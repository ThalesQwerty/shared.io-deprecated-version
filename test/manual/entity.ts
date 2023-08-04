import { Channel, Entity, User, UserGroup, Server, Client } from "../../lib";

const { input, inputFor, output, action, event, shared, hidden, property, group } = Entity.decorators<TestEntity>();

class TestEntity extends Entity {
    @input @output a: number = 1;
    b: number = 2;

    c: boolean = false;

    @output wololo: number[] = [1, 2, 3];

    @output
    get ab(): number {
        return this.a + this.b;
    }

    @shared
    sum(a: number, user: User, b: number, client: Client): number {
        console.log("sum", arguments);
        return a + b;
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

const client = new Client(server);
const user = new User(client);
const channel = new TestChannel(server);
const entity = new TestEntity(channel, user);

channel.join(user);
user.call(entity, "sum", [1, 2], client);

// console.dir(channel.schema.extended(), { depth: null });
// console.dir(entity.schema, { depth: null });
// console.log(entity.schema.listGroupAliases());
// console.log(entity.schema);