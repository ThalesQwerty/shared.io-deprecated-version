import { Channel, Entity, Schema, User, UserGroup } from "../../lib/api";
import { Client, Server } from "../../lib/connection";

const { input, inputFor, output, action, event, shared, hidden, property, group } = Entity.decorators<TestEntity>();
class TestEntity extends Entity {
    @input @output a = 1;

    @property({
        get() {
            return "Hello, world!"
        }
    })
    b = "oxe";

    c = false;

    @output
    get ab() {
        return this.a + this.b;
    }

    @shared
    test() {}

    @group("groupAliasTest")
    group = new UserGroup();

    @action @event
    delete(user?: User) {
        super.delete();
    }
}

class TestChannel extends Channel {
    maxUsers = 5;
}

const server = new Server({
    entities: [
        TestEntity,
        TestChannel
    ]
});


const user = new User(new Client(server));
const channel = new TestChannel(server);
const entity = new TestEntity(channel, user);

console.dir(channel.schema.extended(), { depth: null });
// console.dir(entity.schema, { depth: null });
// console.log(entity.schema.listGroupAliases());