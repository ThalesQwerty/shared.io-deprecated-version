import { Channel, DECORATORS, Decorators, User, UserGroup, BuiltinUserGroup, Schema, EntityBlankSchema, EntityPolicy, EntityPropertyKey } from ".";
import { CustomEventEmitter, StringKeyOf, UUID, WatchedObject } from "../utils";
import { Server } from "../connection";
import _ from "lodash";

function blankSchema(type: string): EntityBlankSchema {
    return {
        type: type,
        properties: {},
        methods: {},
        userGroups: ["owner", "viewers", "nobody"]
    };
}

export interface EntityEvents {
    delete: {},
    output: {
        key: string,
        value: unknown,
        group: UserGroup
    }
}
export class Entity<EventList extends EntityEvents = EntityEvents> extends CustomEventEmitter<EventList> implements Partial<Record<BuiltinUserGroup, User|UserGroup>> {
    /**
     * The server in which this entity can be found
     */
    public get server(): Server {
        return this.channel instanceof Server ? this.channel : this.channel.server;
    }

    /**
     * The path in which this entity can be found in this entity
     */
    public get path(): string[][] {
        const localPath = [this.type, this.id];
        return this.channel instanceof Channel ? [...this.channel.path, localPath] : [localPath];
    }

    /**
     * The name of this entity's class
     */
    public get type() {
        return this.constructor.name;
    }

    public get schema() {
        const { type } = this;
        return Schema.entities[type] ??= blankSchema(type);
    }

    /**
     * The users who can view and interact with this entity.
     */
    public get viewers() {
        return this.channel.users;
    }

    /**
     * Builtin empty user group. Cannot be altered.
     */
    public readonly nobody = UserGroup.none;

    /**
     * Access rules for this entity's keys
     */
    public readonly policy: EntityPolicy = {
        delete: {
            input: UserGroup.none,
            output: UserGroup.none
        }
    };

    public static get schema() {
        const type = this.prototype.constructor.name;
        return Schema.entities[type] ??= blankSchema(type);
    }

    /**
     * Get the decorators with correct type annotation for a given entity type
     * @param EntityType (type paremeter) The entity class
     * @returns The decorators: `@group`, `@inputGroupName`, `@outputFor`, `@input`, `@output`, `@hidden` and `@shared`
     */
    public static decorators<EntityType extends Entity = Entity>() {
        return DECORATORS as unknown as Decorators<EntityType>;
    }

    /**
     * Random unique and universal identifier string for this entity.
     */
    public readonly id = UUID();

    constructor(
        /**
         * The channel in which this entity can be found
         */
        public readonly channel: Channel|Server,

        /**
         * The user who created this entity.
         *
         * `undefined` if it has been created by the server.
         */
        public readonly owner?: User
    ) {
        super();

        const { proxy, watcher } = new WatchedObject(this, ["channel", "owner", "schema", "policy", "type", "path"]);
        const schema = this.schema;

        this.owner?.ownedEntities.addEntity(this);
        this.channel.entities.addEntity(this);

        watcher.on("write", ({ key, newValue, oldValue }) => {
            const propertySchema = this.schema.properties[key];
            if (!propertySchema?.isAsynchronous && newValue !== oldValue) {
                this.sync(key as EntityPropertyKey<this>, newValue as any);
            }
        });

        watcher.on("call", ({ key, parameters, returnedValue }) => {
            const group = this.policy[key]?.output;
            if (!group) return;

            group.listen({
                entity: this,
                methodName: key,
                parameters,
                returnedValue
            });
        });

        for (const key in schema.properties) {
            const {
                inputGroupName,
                outputGroupName,
                objectiveGetter,
                subjectiveGetter,
                initialDependencies
            } = schema.properties[key];

            this.policy[key] = {
                input: UserGroup.force((this as any)[inputGroupName]),
                output: UserGroup.force((this as any)[outputGroupName])
            };

            if (objectiveGetter) {
                const computedProperty = watcher.infer(key as StringKeyOf<this>, objectiveGetter.bind(proxy));
                if (initialDependencies) computedProperty.dependencies.addMany(initialDependencies?.array as any[]);

                this.on("delete", () => {
                    computedProperty.disabled = true;
                });
            }

            if (subjectiveGetter) {
                const computedProperty = watcher.infer(key as StringKeyOf<this>, () => subjectiveGetter);

                this.on("delete", () => {
                    computedProperty.disabled = true;
                });
            }
        }

        this.on("delete", () => {
            watcher.removeAllListeners();
        });

        return proxy;
    }

    /**
     * Deletes this entity
     */
    delete(): void {
        this.owner?.ownedEntities.removeEntity(this);
        this.emit("delete", {});
    }

    sync<Key extends EntityPropertyKey<this>>(key: Key, value?: this[Key]) {
        const group = this.policy[key]?.output;
        if (!group) return;

        const definedValue = value === undefined ? this[key] : value;

        group.read({
            entity: this,
            key,
            value: this.schema.properties[key]?.subjectiveGetter ?? definedValue
        });

        this.emit("output", {
            key,
            value: definedValue,
            group
        });
    }
}