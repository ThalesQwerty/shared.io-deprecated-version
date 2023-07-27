import { CustomEventEmitter, Tree } from "../utils";
import { Entity, EntityTree, User, UserGroup } from "../api";
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
    port: number
}
export class Server extends CustomEventEmitter<ServerEvents> {
    public readonly config: ServerConfig = {
        port: 3000
    };

    /**
     * All users connected
     */
    public readonly users = new UserGroup();

    /**
     * All entities on this server
     */
    public readonly entities = new EntityTree();

    private wss?: WebSocketServer;

    constructor(config: Partial<ServerConfig> = {}) {
        super();

        for (const key in config) {
            (this.config as any)[key] = (config as any)[key];
        }
        console.log("config", this.config);
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