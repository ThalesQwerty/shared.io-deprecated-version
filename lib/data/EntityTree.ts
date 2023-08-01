import { Entity, Channel } from "../models";
import { InstanceTree, Constructor } from "./InstanceTree";

export class EntityTree<EntityType extends Entity = Entity> extends InstanceTree<EntityType> {
    findRecursive(...steps: [constructor: string|Constructor<EntityType>, id: string][]) {
        let tree: EntityTree<any> = this;
        let found: EntityType|undefined;

        for (const step of steps) {
            found = tree.find(...step);
            if (!(found instanceof Channel)) break;

            tree = found.entities;
            if (!tree) break;
        }

        return found;
    }

    addEntity(entity: EntityType) {
        return super.add(entity, entity.id);
    }

    removeEntity(entity: EntityType) {
        return super.remove(entity.type, entity.id);
    }
}