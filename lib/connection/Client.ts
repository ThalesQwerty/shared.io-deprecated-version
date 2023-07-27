import _ from "lodash";
import { CustomEventEmitter, KeyValue, UUID } from "../utils";
import { Output, Server, WebSocket } from ".";

export interface ClientEvents {
    close: {}
}

/**
 * Represents a websocket client connected to a SharedIO server
 */
export class Client extends CustomEventEmitter<ClientEvents> {
    get connected() {
        return !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    constructor(public readonly server: Server, private readonly ws?: WebSocket) {
        super();

        if (ws) {
            ws.on("close", () => {
                this.emit("close", {});
            });

            ws.on("message", (message) => {
                console.log("Message received", message);
            });
        }
    }

    /**
     * Sends an arbitrary message via websocket to this client
     */
    sendRaw(message: KeyValue) {
        if (this.connected) {
            this.ws?.send(JSON.stringify(message));
        }
    }

    /**
     * Emits an output via websocket to this client
     */
    send(output: Output | Omit<Output, "id">) {
        const outputWithId = {
            id: UUID(),
            ...output
        } as Output;

        this.sendRaw(outputWithId);
        return outputWithId;
    }
}