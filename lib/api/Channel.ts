import { KeyValue, UUID, WatchedObject, Group } from "../utils";
import _ from "lodash";
import { User } from ".";
import { Server } from "../connection";
import { UserGroup } from "./UserGroup";

export interface ChannelEvents {
    delete: {},
    join: {
        user: User
    }
}

export class Channel extends WatchedObject<object, ChannelEvents> {
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


    public readonly users = new UserGroup().lock();

    constructor(public readonly server: Server) {
        super(undefined, ["server"]);
    }

    /**
     * Deletes this channel
     */
    delete() {
        this.emit("delete", {});
    }
}