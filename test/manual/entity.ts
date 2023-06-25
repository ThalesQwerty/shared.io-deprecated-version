import { Channel, Entity, User, UserGroup } from "../../lib/api";
import { Server } from "../../lib/connection";

const server = new Server();

const { inputFor, outputFor, group, input, output, hidden, shared } = Entity.decorators<TestEntity>();
class TestEntity extends Entity {
    @input @output a = 1;
    @output b = 2;

    ally = new UserGroup();
    allyAndOwner = UserGroup.union(this.ally, this.owners);

    @shared test(n = 0) {
        return this.a += n;
    }
}

console.log(TestEntity.schema);

const entity = new TestEntity(new Channel(server));

console.log(entity.schema);