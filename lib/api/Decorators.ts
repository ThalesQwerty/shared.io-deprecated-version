import { Entity, EntityKey, EntityNonGroupKey, EntityGroupKey, EntitySubjectiveGetter, EntitySubjectiveSetter, EntityPropertyKey, EntityPropertySchema, EntityMethodSchema, EntityMethodKey } from ".";
import { UserGroup } from "./UserGroup";
import { Schema } from "./Schema";
import { Group } from "../utils";

function getPropertySchema<EntityType extends Entity>(entity: EntityType, propertyName: string) {
    const schema = Schema.findOrCreateByName(entity.constructor.name);

    return schema.properties[propertyName] ??= {
        key: propertyName,
        name: propertyName,
        type: "unknown",
        inputGroupName: UserGroup.NONE,
        outputGroupName: UserGroup.OWNERS,
        isAsynchronous: false
    };
}

function getMethodSchema<EntityType extends Entity>(entity: EntityType, methodName: string) {
    const schema = Schema.findOrCreateByName(entity.constructor.name);

    return schema.methods[methodName] ??= {
        key: methodName,
        name: methodName,
        returnType: "unknown",
        parameters: [],
        actionGroupName: UserGroup.NONE,
        eventGroupName: UserGroup.NONE
    };
}

export interface Decorators<EntityType extends Entity = Entity> {
    /**
     * Allows this entity's viewers to read this property
     */
    output: (entity: EntityType, propertyName: EntityPropertyKey<EntityType>) => void;

    /**
     * Allows this entity's owner to write into this property
     */
    input: (entity: EntityType, propertyName: EntityPropertyKey<EntityType>) => void;

    /**
     * Allows this entity's owner to read this property
     */
    hidden: (entity: EntityType, propertyName: EntityPropertyKey<EntityType>) => void;

    /**
     * Allows this entity's owner to call this method
     */
    action: (entity: EntityType, propertyName: EntityMethodKey<EntityType>) => void;

    /**
     * Allows this entity's viewers to listen to this function's calls
     */
    event: (entity: EntityType, propertyName: EntityMethodKey<EntityType>) => void;

    /**
     * Allows this entity's viewers to call this method
     */
    shared: (entity: EntityType, propertyName: EntityMethodKey<EntityType>) => void;

    /**
     * Defines a given user group on this entity as the one who's able to write into this property
     */
    inputFor: (group: EntityGroupKey<EntityType>) => (entity: EntityType, propertyName: EntityPropertyKey<EntityType>) => void;

    /**
     * Defines a given user group on this entity as the one who's able to read this property
     */
    outputFor: (group: EntityGroupKey<EntityType>) => (entity: EntityType, propertyName: EntityPropertyKey<EntityType>) => void;

    /**
     * Defines a given user group on this entity as the one who's able to call this function
     */
    actionFor: (group: EntityGroupKey<EntityType>) => (entity: EntityType, propertyName: EntityMethodKey<EntityType>) => void;

    /**
     * Defines a given user group on this entity as the one who's able to listen to this function's calls
     */
    eventFor: (group: EntityGroupKey<EntityType>) => (entity: EntityType, propertyName: EntityMethodKey<EntityType>) => void;

    /**
     * Defines a shared property for this entity.
     */
    property: (config?: Partial<EntityPropertySchema<EntityType>>) => (entity: EntityType, propertyName: EntityPropertyKey<EntityType>) => void;

    /**
     * Defines a shared method for this entity.
     */
    method: (config?: Partial<EntityMethodSchema<EntityType>>) => (entity: EntityType, propertyName: EntityMethodKey<EntityType>) => void;

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
    view: <Key extends string, Name extends EntityNonGroupKey<EntityType>>(subjectiveProperty: {
        as?: Key extends EntityKey<EntityType> ? never : Key,
        get?: EntitySubjectiveGetter<EntityType, EntityType[Name]>,
        set?: EntitySubjectiveSetter<EntityType, EntityType[Name]>
    }) => (entity: EntityType, propertyName: Name) => void;

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

const DECORATORS: Decorators<any> = {
    uses(...dependencies: string[]) {
        return function (entity: Entity, propertyName: string) {
            const rules = getPropertySchema(entity, propertyName);
            if (!rules) return;

            rules.initialDependencies ??= new Group<string>();
            rules.initialDependencies.addMany(dependencies);
        }
    },

    view(subjectiveProperty: {
        as?: string,
        get?: EntitySubjectiveGetter,
        set?: EntitySubjectiveSetter
    }) {
        return DECORATORS.property({
            key: subjectiveProperty.as,
            subjectiveGetter: subjectiveProperty.get,
            subjectiveSetter: subjectiveProperty.set
        })
    },

    group(entity: Entity, propertyName: string) {
        return DECORATORS.view({
            get(user) {
                const userGroup = UserGroup.force((entity as any)[propertyName]);
                return userGroup.has(user);
            }
        });
    },

    async() {
        return DECORATORS.property({ isAsynchronous: true });
    },

    property(config: Omit<Partial<EntityPropertySchema>, "name" | "objectiveGetter" | "objectiveSetter"> = {}) {
        return function (entity: Entity, propertyName: string) {
            const rules = getPropertySchema(entity, config.key ?? propertyName);
            if (!rules) return;

            const property = Object.getOwnPropertyDescriptor(entity, propertyName);

            rules.name = propertyName;

            for (const key in config) {
                (rules as any)[key] = (config as any)[key] ?? (rules as any)[key];
            }

            if (property) {
                rules.objectiveGetter = property?.get ?? rules.objectiveGetter;
                rules.objectiveSetter = property?.set ?? rules.objectiveSetter;
            }
        }
    },

    method(config: Omit<Partial<EntityMethodSchema>, "name"> = {}) {
        return function (entity: Entity, propertyName: string) {
            const rules = getMethodSchema(entity, config.key ?? propertyName);
            if (!rules) return;

            rules.name = propertyName;

            for (const key in config) {
                (rules as any)[key] = (config as any)[key] ?? (rules as any)[key];
            }
        }
    },

    outputFor(group: string) {
        return DECORATORS.property({ outputGroupName: group });
    },

    inputFor(group: string) {
        return DECORATORS.property({ inputGroupName: group });
    },

    actionFor(group: string) {
        return DECORATORS.method({ actionGroupName: group });
    },

    eventFor(group: string) {
        return DECORATORS.method({ eventGroupName: group });
    },

    input(entity: Entity, propertyName: string) {
        return DECORATORS.inputFor("owner")(entity, propertyName as never);
    },

    output(entity: Entity, propertyName: string) {
        return DECORATORS.outputFor("viewers")(entity, propertyName as never);
    },

    hidden(entity: Entity, propertyName: string) {
        return DECORATORS.outputFor("owner")(entity, propertyName as never);
    },

    action(entity: Entity, propertyName: string) {
        return DECORATORS.actionFor("owner")(entity, propertyName as never);
    },

    event(entity: Entity, propertyName: string) {
        return DECORATORS.eventFor("viewers")(entity, propertyName as never);
    },

    shared(entity: Entity, propertyName: string) {
        return DECORATORS.actionFor("viewers")(entity, propertyName as never);
    }
}

const { input, output, hidden, shared } = DECORATORS;
export { input, output, hidden, shared, DECORATORS };