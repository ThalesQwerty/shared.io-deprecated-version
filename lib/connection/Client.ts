import _ from "lodash";
import { CustomEventEmitter, ExecutionQueue, KeyValue, UUID } from "../utils";
import { Input, Output, Server, WebSocket } from ".";

export interface ClientEvents {
    close: {}
}

type PromisedItem<T extends KeyValue> = T & { resolve?: Function }

/**
 * Represents a websocket client connected to a SharedIO server
 */
export class Client extends CustomEventEmitter<ClientEvents> {
    get connected() {
        return !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    private readonly queues: KeyValue<ExecutionQueue, "input" | "output"> = {
        output: new ExecutionQueue<PromisedItem<{ output: Output }>>(({ output, resolve }) => {
            this.send(output);
            resolve?.(output);
        }),
        input: new ExecutionQueue<PromisedItem<{ input: Input }>>(({ input, resolve }) => {
            // this.receive(input);
            resolve?.(input);
        })
    };

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


    /**
     * Emits an output via websocket to this client on the next synchronization
     */
    output(output: Output | Omit<Output, "id">) {
        return new Promise<Output>(resolve => {
            this.queues.output.add({
                output: {
                    id: UUID(),
                    ...output
                },
                resolve
            })
        });
    }

    /**
     * Simulates an input received from this client
     */
    input(input: Input | Omit<Input, "id">) {
        return new Promise<Input>(resolve => {
            this.queues.input.add({
                input: {
                    id: UUID(),
                    ...input
                } as Input,
                resolve
            });
        });
    }

    /**
     * Syncrhonizes the current server's state and this client's state
     */
    sync() {
        return new Promise<void>(resolve => {
            this.queues.input.execute();
            process.nextTick(() => {
                this.queues.output.execute();
                resolve();
            })
        });
    }
}