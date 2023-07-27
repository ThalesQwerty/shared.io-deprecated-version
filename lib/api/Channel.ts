import { UUID, GroupEvents } from "../utils";
import { Entity, EntityEvents, User } from ".";
import { Server } from "../connection";
import { UserGroup } from "./UserGroup";
import _ from "lodash";
import { EntityTree } from "./EntityTree";

export interface ChannelEvents extends EntityEvents {
    join: {
        user: User,
    },
    leave: {
        user: User
    }
}

export class Channel<EventList extends ChannelEvents = ChannelEvents> extends Entity<EventList> {
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
     * The users who are outside this channel, but can see it and attempt to join it
     */
    public readonly outsiders = UserGroup.difference(this.viewers, this.users);

    /**
     * The maximum amount of users allowed on this channel.
     *
     * Default is `Infinity`
     */
    public maxUsers: number = Infinity;

    public readonly entities = new EntityTree();

    constructor (
        /**
         * The parent channel in which this channel can be found
         */
        public readonly channel: Channel,

        /**
         * The user who created this channel.
         *
         * `undefined` if it has been created by the server.
         */
        public readonly owner?: User
    ) {
        super(channel, owner);

        const handleJoin = (event: GroupEvents<User>["add"]) => {
            const user = event.item;
            user.joinedChannels.addEntity(this);

            this.emit("join", { user });
        };

        const handleLeave = (event: GroupEvents<User>["remove"]) => {
            const user = event.item;
            user.joinedChannels.removeEntity(this);

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
     * Attempts to add a new user into this channel.
     * @param user The user to be added.
     * @returns Whether or not the user successfully joined the channel.
     */
    join(user: User): boolean {
        // to-do: add decorators
        if (this.users.count >= this.maxUsers || this.users.has(user)) return false;

        this.users.add(user);
        return true;
    }

    /**
     * Attempts to remove an user from this channel.
     * @param user The user to be added.
     * @returns Whether or not the user successfully joined the channel.
     */
    leave(user: User): boolean {
        // to-do: add decorators
        if (!this.users.has(user)) return false;

        this.users.remove(user);
        return false;
    }
}

export class GlobalChannel extends Channel {
    public get server() {
        return this._server;
    }

    public get path() {
        return "";
    }

    public readonly users = this._server.users;
    public readonly outsiders = UserGroup.none;
    
    public get viewers() {
        return this._server.users;
    } 

    constructor(private readonly _server: Server) {
        super(null as any);
        (this as any).channel = this;
    }

    delete() {
        return false;
    }
}