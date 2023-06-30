import { Channel, Entity, UserGroup } from "../../lib/api";
import { StringKeyOf } from "../../lib/utils";

const { input, output, io, outputFor } = Entity.decorators<Player>();

class Player extends Entity {
    @io("owners", "nobody") 
    name = "Thales";

    power = 8001;
    armed = false;

    health = 100;
    position = 0;

    ally = new UserGroup();

    shoot() {
        
    }
}