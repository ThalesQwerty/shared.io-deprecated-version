import { Channel, Entity, Server } from "../../lib";

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