import { Channel } from ".";
import { Client } from "../connection";
import { CustomEventEmitter } from "../utils";

export interface UserEvents {

}

export class User extends CustomEventEmitter<UserEvents> {
    /**
     * Attempts to join a channel
     * @param channel
     * @returns `true` if user successfully joined the channel, `false` otherwise.
     */
    join (channel: Channel): boolean {
        const success = Channel.canUserJoin(channel, this);
        if (success) {
            channel.users.add(this);
        }
        return success;
    }

    constructor (public readonly client: Client) {
        super();
    }
}