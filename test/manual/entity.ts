import { Channel, Entity, User, UserGroup } from "../../lib/api";
import { Client, Server } from "../../lib/connection";

const server = new Server();

const { input, output, action, event, shared, hidden, view } = Entity.decorators<TestEntity>();
class TestEntity extends Entity {
    @input @output a = 1;

    @view({
        get() {
            return "Hello, world!"
        }
    })
    b = "oxe";
    c = false;

    @shared
    test() {}

    group = new UserGroup();

    @action @event
    delete(user?: User) {
        super.delete();
    }
}

class TestChannel extends Channel {
    maxUsers = 5;
}

const user = new User(new Client(server));
const channel = new TestChannel(server);
const entity = new TestEntity(channel, user);

console.dir(channel.schema, { depth: null });
console.dir(entity.schema, { depth: null });
console.log(channel.schema.getProperty("joined"));