import { CustomEventEmitter, Group, Tree } from "../utils";
import { Channel, Entity, User } from "../api";
import { Client, WebSocketServer } from ".";

export interface ServerEvents {
    start: {},
    stop: {},
    connection: {
        user: User
    },
    disconnection: {
        user: User
    }
}

export interface ServerConfig {
    port: number,
}

const DEFAULT_CONFIG: ServerConfig = {
    port: 3000
}
export class Server extends CustomEventEmitter<ServerEvents> {
    public readonly config: ServerConfig = DEFAULT_CONFIG;

    /**
     * All users connected
     */
    public readonly users = new Group<User>();

    /**
     * All channels on this server
     */
    public readonly channels = new Tree<Channel>();

    private wss?: WebSocketServer;

    constructor(config: Partial<ServerConfig> = {}) {
        super();

        for (const key in config) {
            (this.config as any)[key] = (config as any)[key];
        }
    }

    /**
     * Starts the server
     */
    public start() {
        this.wss = new WebSocketServer({
            port: this.config.port
        });

        console.log(`SharedIO server listening on port ${this.config.port}`);

        this.wss.on("connection", ws => {
            const client = new Client(this, ws);
            const user = new User(client);

            this.users.add(user);

            this.emit("connection", { user });

            client.on("close", () => {
                this.emit("disconnection", { user });
            });
        });

        this.wss.on("close", () => {
            this.stop();
        })

        return this;
    }

    /**
     * Stops the server and forcefully disconnects all users
     */
    public stop() {
        this.wss?.close();
        this.wss?.removeAllListeners();

        this.emit("stop", {});

        return this;
    }
}