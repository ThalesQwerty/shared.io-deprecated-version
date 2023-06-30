import { KeyValue, UUID, WatchedObject, Group } from "../utils";
import _ from "lodash";
import { User } from ".";
import { Server } from "../connection";
import { UserGroup } from "./UserGroup";

export interface ChannelEvents {
    delete: {},
    join: {
        user: User,
    },
    leave: {
        user: User
    }
}

export class Channel extends WatchedObject<object, ChannelEvents> {
    /**
     * Verifies whether or not an user can join a given channel
     */
    static canUserJoin(channel: Channel, user: User) {
        return channel.users.count <= channel.maxUsers
            && !channel.users.has(user)
            && channel.gate(user);
    }

    /**
     * The path in which this channel can be found on the server's channel tree
     */
    public get path() {
        return [this.type, UUID()].join("/");
    }

    public get type() {
        return this.constructor.name;
    }

    /**
     * Random unique and universal identifier string for this channel.
     */
    public readonly id = UUID();


    /**
     * The users who are in this channel
     */
    public readonly users = new UserGroup().lock();

    /**
     * The maximum amount of users allowed on this channel.
     *
     * Default is `Infinity`
     */
    public maxUsers: number = Infinity;

    constructor(public readonly server: Server) {
        super(undefined, ["server"]);

        this.server.channels.set(this.path, this);
    }

    /**
     * Deletes this channel
     */
    delete() {
        this.server.channels.unset(this.path);

        this.emit("delete", {});
    }

    /**
     * Determines whether or not an user is allwoed to join this channel
     * @param user
     * @returns
     */
    gate(user: User): boolean {
        return true;
    }
}