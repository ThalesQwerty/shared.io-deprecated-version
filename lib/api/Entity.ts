import { Channel, DECORATORS, Decorators, User } from ".";
import { CustomEventEmitter, UUID, WatchedObject } from "../utils";
import _ from "lodash";
import { Schema, EntityBlankSchema, EntityPolicy } from "./Schema";
import { UserGroup, BuiltinUserGroup, HiddenBuiltingUserGroup } from "./UserGroup";

function blankSchema(type: string): EntityBlankSchema {
    return {
        type: type,
        properties: {},
        userGroups: ["owners", "viewers", "nobody"]
    };
}

export interface EntityEvents {
    delete: {},
}

type EntityUserGroups = {
    [key in Exclude<BuiltinUserGroup, HiddenBuiltingUserGroup>]: UserGroup
}

export type OutputHandler<T = unknown> = (info: {oldValue: T, newValue: T, user: User, entity: Entity, key: string }) => T;

export class Entity<ChannelType extends Channel = Channel> extends CustomEventEmitter<EntityEvents> implements EntityUserGroups {
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

    /**
     * Built-in user group for defining the users who are allowed to
     * edit this entity's properties and call its methods,
     * when they are decorated with `@input`
     *
     * By default it contains only the original owner.
     * It can be altered, although it's not advisable.
     */
    public readonly owners: UserGroup = new UserGroup();

    /**
     * Built-in user group for defining the users who are allowed to
     * read this entity's properties and listen to its method calls,
     * when they are decorated with `@output`
     *
     * By default it references the entity channel's user list, and therefore cannot be directly altered.
     * If you wish to change it, reassign this value to a new user group on your class declaration.
     */
    public readonly viewers: UserGroup;

    /**
     * Built-in empty user group. Cannot be altered.
     */
    private readonly nobody: UserGroup = UserGroup.none;

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
        const { proxy, watcher } = new WatchedObject(this, ["channel", "owner", "owners", "viewers", "nobody", "schema", "policy", "type", "path"]);

        this.viewers = channel.users;
        if (owner) this.owners.add(owner);

        channel.entities.set(this.localPath, this);

        watcher.on("write", ({ key, newValue }) => {
            this.policy[key]?.output?.read({
                entity: this,
                key,
                value: newValue
            });
        });

        watcher.on("call", ({ key, parameters, returnedValue }) => {
            this.policy[key]?.output?.listen({
                entity: this,
                methodName: key,
                parameters,
                returnedValue
            });
        });

        const propertySchema = this.schema.properties;

        for (const key in propertySchema) {
            const { inputGroupName, outputGroupName } = propertySchema[key];

            this.policy[key] = {
                input: UserGroup.force((this as any)[inputGroupName]),
                output: UserGroup.force((this as any)[outputGroupName])
            }
        }

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