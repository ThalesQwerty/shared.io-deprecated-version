import { Server, WebSocket } from ".";
import { Input, Output } from "../api";
import { CustomEventEmitter } from "../events";
import { User } from "../models";
import { KeyValue, UUID } from "../utils";

export interface ClientEvents {
    close: {},
    message: {
        client: Client,
        user?: User,
        data: KeyValue
    }
}

/**
 * Represents a websocket client connected to a SharedIO server
 */
export class Client extends CustomEventEmitter<ClientEvents> {
    get connected() {
        return !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * The user this client it assigned to
     */
    public get user() {
        return this._user;
    }
    public set user(newUser) {
        if (newUser !== this.user) {
            this._user?.clients.remove(this);
            newUser?.clients.add(this);
        }
        this._user = newUser;
    }
    private _user?: User;

    constructor(public readonly server: Server, private readonly ws?: WebSocket) {
        super();

        if (ws) {
            ws.on("close", () => {
                this.emit("close", {});
            });

            ws.on("message", (message) => {
                console.log("New message", message, message.toString());

                try {
                    const json = JSON.parse(message.toString());
                    this.handleInput(json);
                } catch {}
            });
        }
    }

    private handleInput(message: KeyValue) {
        const input = message as Input;

        if (!this.user) return;

        const entity = input.data.entity ? this.user.findEntity(input.data.entity) : undefined;
        if (input.data.entity && !entity) return;

        switch (input.type) {
            case "call":
                this.user.call<any, string>(entity, input.data.method, input.data.parameters);
                break;
            case "write":
                for (const key in input.data.changes) {
                    this.user.write<any, string>(entity, key, input.data.changes[key]);
                }
                break;
            case "message":
                this.emit("message", {
                    client: this,
                    user: this.user,
                    data: input.data
                })
                break;
        }
    }

    /**
     * Sends raw data to this client
     */
    sendRaw(rawData: string|KeyValue) {
        if (this.connected) {
            this.ws?.send(typeof rawData === "string" ? rawData : JSON.stringify(rawData));
        }
    }

    /**
     * Sends an arbitrary message via websocket to this client
     */
    send(message: KeyValue) {
        return this.output({
            type: "message",
            data: message
        });
    }

    /**
     * Emits an output via websocket to this client
     */
    output(output: Output | Omit<Output, "id">) {
        const outputWithId = {
            id: UUID(),
            ...output
        } as Output;

        if (this.connected) {
            this.ws?.send(JSON.stringify(outputWithId));
        }
        return outputWithId;
    }
}