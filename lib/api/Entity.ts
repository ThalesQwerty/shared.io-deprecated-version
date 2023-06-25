import { Channel, DECORATORS, Decorators, User } from ".";
import { UUID, WatchedObject } from "../utils";
import _ from "lodash";
import { Schema, EntityBlankSchema } from "./Schema";
import { UserGroup, BuiltinUserGroup } from "./UserGroup";

function blankSchema(type: string): EntityBlankSchema {
    return {
        type: type,
        properties: {},
        userGroups: ["owners", "viewers"]
    };
}

export interface EntityEvents {
    delete: {},
}

type EntityUserGroups = {
    [key in BuiltinUserGroup]: UserGroup
}

export class Entity<ChannelType extends Channel = Channel> extends WatchedObject<object, EntityEvents> implements EntityUserGroups {
    /**
     * The path in which this entity can be found on the server's entity tree
     */
    public get path() {
        return [this.channel.path, this.type, UUID()].join("/");
    }

    public get type() {
        return this.constructor.name;
    }

    public get schema() {
        const { type } = this;
        return Schema.entities[type] ??= blankSchema(type);
    }

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
        super(undefined, ["channel", "owner", "owners", "viewers", "schema"]);

        this.viewers = channel.users;
        if (owner) this.owners.add(owner);

        const { server } = channel;
        server.entities.set(this.path, this);

        const getWatchList = (key: string) => {
            const propertySchema = this.schema.properties[key];
            if (!propertySchema?.outputGroup) return;

            return (this as any)[propertySchema.outputGroup] as UserGroup|undefined;
        }

        this.on("write", ({ key, newValue }) => {
            const watchList = getWatchList(key);

            if (watchList) {
                watchList.output({
                    path: this.path,
                    key,
                    value: newValue
                });
            }
        });
    }

    /**
     * Deletes this entity
     */
    delete() {
        this.channel.server.entities.unset(this.path);

        this.emit("delete", {});
    }
}