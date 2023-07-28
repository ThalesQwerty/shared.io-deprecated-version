import { Channel, Entity, User, UserGroup } from "../../lib/api";
import { Client, Server } from "../../lib/connection";
import { StringKeyOf } from "../../lib/utils";

const { input, output, property, from, to, group, uses } = Entity.decorators<Player>();

class Player extends Entity {
    @from("owner") @to("ally")
    name = "Thales";

    @output power = 8001;
    armed = false;

    health = 100;
    position = 0;

    @group ally = new UserGroup();

    shoot() {
        this["*"].lock();
    }
}