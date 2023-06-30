import { Channel, Entity, User, UserGroup } from "../../lib/api";
import { Server } from "../../lib/connection";

const server = new Server().start();

const { input, output, shared, hidden } = Entity.decorators<TestEntity>();
class TestEntity extends Entity {
    @output a = 1;

    @shared
    delete(user?: User) {
        super.delete();
    }
}

class TestChannel extends Channel {
    maxUsers = 5;
}

const channel = new Channel(server);
const entity = new TestEntity(channel);

server.on("connection", ({ user }) => {

});