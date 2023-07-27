import { BuiltinUserGroup, Entity, User, UserGroup, EntityKey, EntityNonGroupKey, EntityGroupKey, EntitySubjectiveGetter, EntitySubjectiveSetter, EntityPropertyKey } from ".";
import { Group } from "../utils";

function getPropertySchema<EntityType extends Entity>(entity: EntityType, propertyName: string) {
    const { schema } = entity;
    if (!schema) return;

    return schema.properties[propertyName] ??= {
        name: propertyName,
        inputGroupName: UserGroup.NONE,
        outputGroupName: UserGroup.VIEWERS,
        isAsynchronous: false
    };
}

export interface Decorators<EntityType extends Entity = Entity> {
    /**
     * Allows this entity's viewers to read this property (or if it's a method, allows them to listen to its calls)
     */
    output: (entity: EntityType, propertyName: EntityNonGroupKey<EntityType>) => void;

    /**
     * Allows this entity's owners to write into this property (or if it's a method, allows them to directly call it)
     */
    input: (entity: EntityType, propertyName: EntityNonGroupKey<EntityType>) => void;

    /**
     * Allows this entity's owners to read this property (or if it's a method, allows them to listen to its calls)
     */
    hidden: (entity: EntityType, propertyName: EntityNonGroupKey<EntityType>) => void;

    /**
     * Allows this entity's viewers to write into this property (or if it's a method, allows them to directly call it)
     */
    shared: (entity: EntityType, propertyName: EntityNonGroupKey<EntityType>) => void;

    /**
     * Defines a given user group on this entity as the one who's able to read this property (or if it's a method, allows them to listen to its calls)
     */
    outputFor: (group: EntityGroupKey<EntityType>) => (entity: EntityType, propertyName: EntityNonGroupKey<EntityType>) => void;

    /**
     * Defines a given user group on this entity as the one who's able towrite into this property (or if it's a method, allows them to directly call it)
     */
    inputFor: (group: EntityGroupKey<EntityType>) => (entity: EntityType, propertyName: EntityNonGroupKey<EntityType>) => void;

    /**
     * Defines the access rules for this property.
     *
     * @param inputGroup If not null, defines a given user group on this entity as the one who's able to write into this property (or to directly call it, if it's a method).
     * @param outputGroup If not null, defines a given user group on this entity as the one who's able to read this property (or to listen to its calls, if it's a method).
     */
    io: (inputGroup?: EntityGroupKey<EntityType> | null, outputGroup?: EntityGroupKey<EntityType> | null) => (entity: EntityType, propertyName: EntityNonGroupKey<EntityType>) => void;

    /**
     * Manually declares dependencies for this property. Whenever one of the dependencies change, all users who can read this property will receive an update of its value.
     * @param dependencies
     * @returns
     */
    uses: (...dependencies: EntityPropertyKey<EntityType>[]) => (entity: EntityType, propertyName: EntityPropertyKey<EntityType>) => void;

    /**
     * Defines a subjective property.
     * @param subjectiveProperty
     * @returns
     */
    view: <Key extends EntityNonGroupKey<EntityType>>(subjectiveProperty: {
        get?: EntitySubjectiveGetter<EntityType, EntityType[Key]>,
        set?: EntitySubjectiveSetter<EntityType, EntityType[Key]>
    }) => (entity: EntityType, propertyName: Key) => void;

    /**
     * Makes this property asynchronous
     */
    async: (entity: EntityType, propertyName: EntityPropertyKey<EntityType>) => void;

    /**
     * Marks this user group as visible on client-side.
     *
     * This is useful for writing certain conditionals and improving type annotation on the client-side.
     */
    group: (entity: EntityType, propertyName: EntityGroupKey<EntityType>) => void;
};

const DECORATORS: Decorators = {
    group(entity: Entity, propertyName: string) {
        const { schema } = entity;
        if (!schema) return;

        if (!schema.userGroups.includes(propertyName)) {
            schema.userGroups.push(propertyName);
        }
    },

    uses(...dependencies: string[]) {
        return function (entity: Entity, propertyName: string) {
            const rules = getPropertySchema(entity, propertyName);
            if (!rules) return;

            rules.initialDependencies ??= new Group<string>();
            rules.initialDependencies.addMany(dependencies);
        }
    },

    view(subjectiveProperty: {
        get?: EntitySubjectiveGetter,
        set?: EntitySubjectiveSetter
    }) {
        return function (entity: Entity, propertyName: string) {
            const rules = getPropertySchema(entity, propertyName);
            if (!rules) return;

            rules.subjectiveGetter = subjectiveProperty.get;
            rules.subjectiveSetter = subjectiveProperty.set;
        }
    },

    async(entity: Entity, propertyName: string) {
        const rules = getPropertySchema(entity, propertyName);
        if (!rules) return;

        rules.isAsynchronous = true;
    },

    io(inputGroupName: string | null = UserGroup.OWNERS, outputGroupName: string | null = UserGroup.INHERIT) {
        return function (entity: Entity, propertyName: string) {
            const rules = getPropertySchema(entity, propertyName);
            if (!rules) return;

            const property = Object.getOwnPropertyDescriptor(entity, propertyName);
            rules.objectiveGetter = property?.get;
            rules.objectiveSetter = property?.set;
            rules.inputGroupName = inputGroupName ?? rules.inputGroupName;
            rules.outputGroupName = outputGroupName ?? rules.outputGroupName;
        }
    },

    outputFor(group: string) {
        return DECORATORS.io(UserGroup.INHERIT, group as any);
    },

    inputFor(group: string) {
        return DECORATORS.io(group as any, UserGroup.INHERIT);
    },

    output(entity: Entity, propertyName: string) {
        return DECORATORS.io(UserGroup.INHERIT, UserGroup.VIEWERS)(entity, propertyName as EntityNonGroupKey);
    },

    input(entity: Entity, propertyName: string) {
        return DECORATORS.io(UserGroup.OWNERS, UserGroup.INHERIT)(entity, propertyName as EntityNonGroupKey);
    },

    hidden(entity: Entity, propertyName: string) {
        return DECORATORS.io(UserGroup.INHERIT, UserGroup.OWNERS)(entity, propertyName as EntityNonGroupKey);
    },

    shared(entity: Entity, propertyName: string) {
        return DECORATORS.io(UserGroup.VIEWERS, UserGroup.INHERIT)(entity, propertyName as EntityNonGroupKey);
    }
}

const { input, output, hidden, shared } = DECORATORS;
export { input, output, hidden, shared, DECORATORS };