import { BuiltinUserGroup, Entity, User, UserGroup, EntityKey } from ".";
import { Group } from "../utils";

type GroupName<EntityType extends Entity = Entity> = BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends Group<User> ? key : never
}[EntityKey<EntityType>];

type NotGroupName<EntityType extends Entity = Entity> = {
    [key in EntityKey<EntityType>]: EntityType[key] extends Group<User> ? never : key
}[EntityKey<EntityType>];

type MethodName<EntityType extends Entity = Entity> = NotGroupName<EntityType> & (BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends Function ? key : never
}[EntityKey<EntityType>]);

type PropertyName<EntityType extends Entity = Entity> = NotGroupName<EntityType> & (BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends Function ? never : key
}[EntityKey<EntityType>]);

function getPropertySchema<EntityType extends Entity>(entity: EntityType, propertyName: string) {
    const { schema } = entity;
    if (!schema) return;

    return schema.properties[propertyName] ??= {
        name: propertyName,
        inputGroup: UserGroup.NONE,
        outputGroup: UserGroup.VIEWERS
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
     * Defines a given user group on this entity as the one who's able to read this property (or if it's a method, allows them to listen to its calls)
     */
    outputFor: (group: GroupName<EntityType>) => (entity: EntityType, propertyName: NotGroupName<EntityType>) => void;

    /**
     * Defines a given user group on this entity as the one who's able towrite into this property (or if it's a method, allows them to directly call it)
     */
    inputFor: (group: GroupName<EntityType>) => (entity: EntityType, propertyName: NotGroupName<EntityType>) => void;

    /**
     * Defines the access rules for this property.
     * 
     * @param inputGroup If not null, defines a given user group on this entity as the one who's able to write into this property (or to directly call it, if it's a method).
     * @param outputGroup If not null, defines a given user group on this entity as the one who's able to read this property (or to listen to its calls, if it's a method).
     */
    io: (inputGroup?: GroupName<EntityType> | null, outputGroup?: GroupName<EntityType> | null) => (entity: EntityType, propertyName: NotGroupName<EntityType>) => void;

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

    io(inputGroup: string | null = UserGroup.OWNERS, outputGroup: string | null = UserGroup.INHERIT) {
        return function (entity: Entity, propertyName: string) {
            const rules = getPropertySchema(entity, propertyName);
            if (!rules) return;

            rules.inputGroup = inputGroup ?? rules.inputGroup;
            rules.outputGroup = outputGroup ?? rules.outputGroup;
        }
    },

    outputFor(group: string) {
        return DECORATORS.io(UserGroup.INHERIT, group as any);
    },

    inputFor(group: string) {
        return DECORATORS.io(group as any, UserGroup.INHERIT);
    },

    output(entity: Entity, propertyName: string) {
        return DECORATORS.io(UserGroup.INHERIT, UserGroup.VIEWERS)(entity, propertyName as NotGroupName);
    },

    input(entity: Entity, propertyName: string) {
        return DECORATORS.io(UserGroup.OWNERS, UserGroup.INHERIT)(entity, propertyName as NotGroupName);
    },

    hidden(entity: Entity, propertyName: string) {
        return DECORATORS.io(UserGroup.INHERIT, UserGroup.OWNERS)(entity, propertyName as NotGroupName);
    },

    shared(entity: Entity, propertyName: string) {
        return DECORATORS.io(UserGroup.VIEWERS, UserGroup.INHERIT)(entity, propertyName as NotGroupName);
    }
}

const { input, output, hidden, shared } = DECORATORS;
export { input, output, hidden, shared, DECORATORS };