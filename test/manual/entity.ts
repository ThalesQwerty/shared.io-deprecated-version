import { Channel, Entity } from "../../lib/api";
import { Server } from "../../lib/connection";

const server = new Server();

class TestEntity extends Entity {
     a = 1;
b = 2;

    test(n = 0) {
        return this.a += n;
    }
}

const entity = new TestEntity(new Channel(server));