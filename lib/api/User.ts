import { Client } from "../connection";
import { CustomEventEmitter } from "../utils";

export interface UserEvents {

}

export class User extends CustomEventEmitter<UserEvents> {
    constructor (public readonly client: Client) {
        super();
    }
}