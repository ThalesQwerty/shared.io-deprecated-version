import { UUID, GroupEvents } from "../utils";
import { Entity, EntityEvents } from "./Entity";
import { User, UserGroup, EntityTree } from ".";
import { Server } from "../connection";
import { DECORATORS, Decorators } from "./Decorators";
import _ from "lodash";

export interface ChannelEvents extends EntityEvents {
    join: {
        user: User,
    },
    leave: {
        user: User
    }
}

const { eventFor, actionFor, group, property, not } = DECORATORS as Decorators<Channel>;

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
    @group("joined")
    public readonly users = new UserGroup().lock();

    /**
     * The maximum amount of users allowed on this channel.
     *
     * Default is `Infinity`
     */
    public maxUsers: number = Infinity;

    public readonly entities = new EntityTree();

    constructor (
        channel: Channel|Server,

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
    @actionFor(not("users")) @eventFor("users")
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
    @actionFor("users") @eventFor("users")
    leave(user: User): boolean {
        // to-do: add decorators
        if (!this.users.has(user)) return false;

        this.users.remove(user);
        return false;
    }
}