import { Channel, DECORATORS, Decorators, User } from ".";
import { CustomEventEmitter, StringKeyOf, UUID, WatchedObject, WatchedObjectEvents } from "../utils";
import _ from "lodash";
import { Schema, EntityBlankSchema, EntityPolicy } from "./Schema";
import { UserGroup } from "./UserGroup";

function blankSchema(type: string): EntityBlankSchema {
    return {
        type: type,
        properties: {},
        userGroups: ["owner", "*", ""]
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

export type OutputHandler<T = unknown> = (info: {oldValue: T, newValue: T, user: User, entity: Entity, key: string }) => T;

export class Entity<ChannelType extends Channel = Channel> extends CustomEventEmitter<EntityEvents> {
    /**
     * The path in which this entity can be found by the users' clients
     */
    public get path() {
        return [this.channel.path, this.type, this.id].join("/");
    }

    /**
     * The path in which this entity can be found on its channel's entity tree
     */
    private get localPath() {
        return [this.type, this.id].join("/");
    }

    public get server() {
        return this.channel.server;
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
     * @returns The decorators: `@group`, `@inputFor`, `@outputFor`, `@input`, `@output`, `@hidden` and `@shared`
     */
    public static decorators<EntityType extends Entity = Entity>() {
        return DECORATORS as unknown as Decorators<EntityType>;
    }

    /**
     * Random unique and universal identifier string for this entity.
     */
    public readonly id = UUID();
    
    private readonly "*" = this.channel.users;

    constructor (
        /**
         * The channel in which this entity can be found
         */
        public readonly channel: ChannelType,

        /**
         * The user who created this entity.
         *
         * `undefined` if it has been created by the server.
         */
        public readonly owner?: User
    ) {
        super();
        const { proxy, watcher } = new WatchedObject(this, ["channel", "owner", "schema", "policy", "type", "path"]);

        channel.entities.set(this.localPath, this);

        watcher.on("write", ({ key, newValue, oldValue }) => {
            const group = this.policy[key]?.output;
            if (!group || newValue === oldValue) return;

            group.read({
                entity: this,
                key,
                value: newValue
            });

            this.emit("output", {
                key,
                value: newValue,
                group
            });
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

        const propertySchema = this.schema.properties;

        for (const key in propertySchema) {
            const {
                inputGroupName,
                outputGroupName,
                getter
            } = propertySchema[key];

            this.policy[key] = {
                input: UserGroup.force((this as any)[inputGroupName]),
                output: UserGroup.force((this as any)[outputGroupName])
            };

            if (getter) {
                const computedProperty = watcher.infer(key as StringKeyOf<this>, getter.bind(proxy));

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
    delete() {
        this.channel.entities.remove(this.localPath);
        this.emit("delete", {});
    }
}