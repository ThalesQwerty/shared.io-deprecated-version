import { UUID, GroupEvents } from "../utils";
import _ from "lodash";
import { User } from ".";
import { Server } from "../connection";
import { UserGroup } from "./UserGroup";
import { CustomEventEmitter } from "../utils";

export interface ChannelEvents {
    delete: {},
    join: {
        user: User,
    },
    leave: {
        user: User
    }
}

export class Channel extends CustomEventEmitter<ChannelEvents> {
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
        return [this.type, this.id].join("/");
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
        super();

        this.server.channels.set(this.path, this);

        const emitJoin = (event: GroupEvents<User>["add"]) => {
            this.emit("join", { user: event.item });
        };

        const emitLeave = (event: GroupEvents<User>["remove"]) => {
            this.emit("join", { user: event.item });
        };

        this.users.on("add", emitJoin);
        this.users.on("remove", emitLeave);

        this.on("delete", () => {
            this.users.removeListener("add", emitJoin);
            this.users.removeListener("remove", emitJoin);
        });
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