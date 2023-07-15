import { Channel, Entity } from "../../lib/api";
import { Server } from "../../lib/connection";

const { output } = Entity.decorators<ComputedEntity>();

class ComputedEntity extends Entity {
    @output a = 0;
    @output b = 0;
    @output c = 0;

    @output
    get ab() {
        return this.a + this.b;
    }

    @output
    get ab2() {
        return 2 * this.ab;
    }
}

const entity = new ComputedEntity(new Channel(new Server()));
entity.on("output", event => console.log(event.key, event.value));

process.nextTick(() => {
    entity.a = 5;
    entity.b = 2;
    process.nextTick(() => {
        entity.a = 50;
        entity.b = -3;
        process.nextTick(() => {
            entity.c = 2;
        });
    });
});