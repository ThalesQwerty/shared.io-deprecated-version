import { UUID, GroupEvents, Tree } from "../utils";
import _ from "lodash";
import { Entity, User } from ".";
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

    /**
     * The name of this channel's class
     */
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
     * The entities which are in this channel
     */
    public readonly entities = new Tree<Entity>();

    /**
     * The maximum amount of users allowed on this channel.
     *
     * Default is `Infinity`
     */
    public maxUsers: number = Infinity;

    constructor(public readonly server: Server) {
        super();

        this.server.channels.set(this.path, this);

        const handleJoin = (event: GroupEvents<User>["add"]) => {
            const user = event.item;
            user.channels.set(this.path, this);

            this.emit("join", { user });
        };

        const handleLeave = (event: GroupEvents<User>["remove"]) => {
            const user = event.item;
            user.channels.remove(this.path);

            this.emit("join", { user });
        };

        this.users.on("add", handleJoin);
        this.users.on("remove", handleLeave);

        this.on("delete", () => {
            this.users.removeListener("add", handleJoin);
            this.users.removeListener("remove", handleLeave);
        });
    }

    /**
     * Deletes this channel
     */
    delete() {
        this.server.channels.remove(this.path);

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