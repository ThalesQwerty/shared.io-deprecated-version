import { Channel, User } from ".";
import { Debouncer, KeyValue, UUID, WatchedObject, WatchedObjectEvents } from "../utils";
import _ from "lodash";
import { Schema, EntitySchema } from "./Schema";
import { UserGroup } from "./UserGroup";

function blankSchema(type: string) {
    return {
        type: type,
        properties: {},
        userGroups: ["_all", "_owner"]
    };
}

export interface EntityEvents {
    delete: {},
}

export class Entity<ChannelType extends Channel = Channel> extends WatchedObject<object, EntityEvents> {
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

    public readonly id = UUID();

    /**
     * An user group containing only this entity's owner, if it has one
     *
     * Alias for `this.owner ? new UserGroup(this.owner) : new UserGroup()`
     */
    protected readonly _owner: UserGroup = new UserGroup();

    /**
     * Alias for `this.channel.users`
     */
    protected readonly _all: UserGroup;

    constructor (public readonly channel: ChannelType, public readonly owner?: User) {
        super(undefined, ["channel", "owner", "_owner", "_all", "schema"]);

        this._all = channel.users;
        if (owner) this._owner.add(owner);

        const { server } = channel;
        server.entities.set(this.path, this);

        this.on("write", ({ key, newValue }) => {
            const propertySchema = this.schema.properties[key];
            if (propertySchema) {
                const watchList = propertySchema.outputGroup && (this as any)[propertySchema.outputGroup] as UserGroup;

                if (watchList) {
                    watchList.output({
                        path: this.path,
                        key,
                        value: newValue
                    });
                }
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