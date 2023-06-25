import { BuiltinUserGroup, Entity, User, UserGroup } from ".";
import { Group, StringKeyOf } from "../utils";

type GroupName<EntityType extends Entity = Entity> = BuiltinUserGroup | {
    [key in StringKeyOf<EntityType>]: EntityType[key] extends Group<User> ? key : never
}[StringKeyOf<EntityType>];

type NotGroupName<EntityType extends Entity = Entity> = BuiltinUserGroup | {
    [key in StringKeyOf<EntityType>]: EntityType[key] extends Group<User> ? never : key
}[StringKeyOf<EntityType>];

type MethodName<EntityType extends Entity = Entity> = NotGroupName<EntityType> & (BuiltinUserGroup | {
    [key in StringKeyOf<EntityType>]: EntityType[key] extends Function ? key : never
}[StringKeyOf<EntityType>]);

type PropertyName<EntityType extends Entity = Entity> = NotGroupName<EntityType> & (BuiltinUserGroup | {
    [key in StringKeyOf<EntityType>]: EntityType[key] extends Function ? never : key
}[StringKeyOf<EntityType>]);

function getPropertySchema<EntityType extends Entity>(entity: EntityType, propertyName: string) {
    const { schema } = entity;
    if (!schema) return;

    return schema.properties[propertyName] ??= {
        name: propertyName,
        inputGroup: "",
        outputGroup: ""
    };
}

export interface Decorators<EntityType extends Entity = Entity> {
    /**
     * Allows this entity's viewers to read this property (or if it's a method, allows them to listen to its calls)
     */
    output: (entity: EntityType, propertyName: NotGroupName<EntityType>) => void;

    /**
     * Allows this entity's owners to write into this property (or if it's a method, allows them to directly call it)
     */
    input: (entity: EntityType, propertyName: NotGroupName<EntityType>) => void;

    /**
     * Allows this entity's owners to read this property (or if it's a method, allows them to listen to its calls)
     */
    hidden: (entity: EntityType, propertyName: NotGroupName<EntityType>) => void;

    /**
     * Allows this entity's viewers to write into this property (or if it's a method, allows them to directly call it)
     */
    shared: (entity: EntityType, propertyName: NotGroupName<EntityType>) => void;

    /**
     * Allows a given user group defined on this entity to read this property (or if it's a method, allows them to listen to its calls)
     */
    outputFor: (group: GroupName<EntityType>) => (entity: EntityType, propertyName: NotGroupName<EntityType>) => void;

    /**
     * Allows a given user group defined on this entity to write into this property (or if it's a method, allows them to directly call it)
     */
    inputFor: (group: GroupName<EntityType>) => (entity: EntityType, propertyName: NotGroupName<EntityType>) => void;

    /**
     * Marks this user group as visible on client-side.
     *
     * This is useful for writing certain conditionals and improving type annotation on the client-side.
     */
    group: (entity: EntityType, propertyName: GroupName<EntityType>) => void;
};

const DECORATORS: Decorators = {
    group(entity: Entity, propertyName: string) {
        const { schema } = entity;
        if (!schema) return;

        if (!schema.userGroups.includes(propertyName)) {
            schema.userGroups.push(propertyName);
        }
    },

    outputFor(group: string) {
        return function (entity: Entity, propertyName: string) {
            const rules = getPropertySchema(entity, propertyName);
            if (!rules) return;

            rules.outputGroup = group;
        }
    },

    inputFor(group: string) {
        return function (entity: Entity, propertyName: string) {
            const rules = getPropertySchema(entity, propertyName);
            if (!rules) return;

            rules.inputGroup = group;
        }
    },

    output(entity: Entity, propertyName: string) {
        return DECORATORS.outputFor(UserGroup.VIEWERS)(entity, propertyName as NotGroupName);
    },

    input(entity: Entity, propertyName: string) {
        return DECORATORS.inputFor(UserGroup.OWNERS)(entity, propertyName as NotGroupName);
    },

    hidden(entity: Entity, propertyName: string) {
        return DECORATORS.outputFor(UserGroup.OWNERS)(entity, propertyName as NotGroupName);
    },

    shared(entity: Entity, propertyName: string) {
        return DECORATORS.inputFor(UserGroup.VIEWERS)(entity, propertyName as NotGroupName);
    }
}

const { input, output, hidden, shared } = DECORATORS;
export { input, output, hidden, shared, DECORATORS };