import { Entity, EntityKey, EntityNonGroupKey, EntityGroupKey, EntitySubjectiveGetter, EntitySubjectiveSetter, EntityPropertyKey, EntityPropertySchema, EntityMethodSchema, EntityMethodKey } from ".";
import { UserGroup } from "./UserGroup";
import { EntityMethodParameterSchema, ReturnTypeName, Schema, TypeName } from "./Schema";
import { Group, KeyValue } from "../utils";

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
     * @param subjectiveProperty
     * @returns
     */
    property: <Type, Key extends string, Name extends EntityPropertyKey<EntityType>>(options: {
        alias?: Key extends EntityKey<EntityType> ? never : Key,
        get?: EntitySubjectiveGetter<EntityType, Type extends never ? EntityType[Name] : Type>,
        set?: EntitySubjectiveSetter<EntityType, Type extends never ? EntityType[Name] : Type>,
        type?: TypeName,
        uses?: EntityPropertyKey<EntityType>[],
        async?: boolean,
        outputFor?: EntityGroupKey<EntityType>,
        inputFor?: EntityGroupKey<EntityType>,
    }) => (entity: EntityType, propertyName: Name) => void;

    /**
     * Defines a shared method for this entity.
     */
    method: <Key extends string, Name extends EntityMethodKey<EntityType>>(options: {
        alias?: Key extends EntityKey<EntityType> ? never : Key,
        parameters?: KeyValue<TypeName>,
        returnType?: ReturnTypeName,
        actionFor?: EntityGroupKey<EntityType>,
        eventFor?: EntityGroupKey<EntityType>,
    }) => (entity: EntityType, propertyName: Name) => void;

    /**
     * Marks this user group as visible on client-side.
     *
     * This is useful for writing certain conditionals and improving type annotation on the client-side.
     *
     * @param alias Optional client-side alias for this group, for semantic purposes. (ex: group "allies" may be seen as "isAllies" on the client-side)
     */
    group: (alias?: string) => (entity: EntityType, propertyName: EntityGroupKey<EntityType>) => void;
};

const DECORATORS: Decorators<any> = {
    group(alias?: string) {
        return function (entity: Entity, propertyName: string) {
            const schema = Schema.findOrCreateByName(entity.constructor.name);
            schema.visibleUserGroups.add(alias ?? propertyName);

            return DECORATORS.property({
                alias,
                get(user) {
                    const userGroup = UserGroup.force((entity as any)[propertyName]);
                    return userGroup.has(user);
                },
                outputFor: 'viewers'
            })(entity, propertyName as never);
        }
    },

    property(options) {
        const config: Partial<EntityPropertySchema> = {
            alias: options.alias,
            subjectiveGetter: options.get,
            subjectiveSetter: options.set,
            type: options.type,
            initialDependencies: options.uses ? new Group(...options.uses) : undefined,
            isAsynchronous: !!options.async,
            outputGroupName: options.outputFor,
            inputGroupName: options.inputFor
        };

        return function (entity: Entity, propertyName: string) {
            const schema = Schema.findOrCreateByName(entity.constructor.name);
            const rules = schema?.createProperty(propertyName);

            if (!rules) return;

            const specialKeys: (keyof EntityPropertySchema)[] = ["initialDependencies"];

            for (const key in config) {
                if (specialKeys.includes(key as keyof EntityPropertySchema)) continue;
                (rules as any)[key] = (config as any)[key] ?? (rules as any)[key];
            }

            if (config.initialDependencies) {
                rules.initialDependencies ??= new Group<string>();
                rules.initialDependencies.addMany(config.initialDependencies);
            }

            const property = Object.getOwnPropertyDescriptor(entity, propertyName);
            rules.objectiveGetter = property?.get ?? rules.objectiveGetter;
            rules.objectiveSetter = property?.set ?? rules.objectiveSetter;

            if (config.alias) {
                schema.aliasMap[config.alias] = propertyName as never;
            }
        }
    },

    method(options) {
        const config: Partial<EntityMethodSchema> = {
            alias: options.alias,
            returnType: options.returnType,
            parameters: options.parameters ? Object.keys(options.parameters).map(name => ({
                name,
                type: options.parameters?.[name] || "unknown",
                required: true // to-do: add "required" logic
            })) : [],
            actionGroupName: options.actionFor,
            eventGroupName: options.eventFor
        };

        return function (entity: Entity, methodName: string) {
            const schema = Schema.findOrCreateByName(entity.constructor.name);
            const rules = schema?.createMethod(methodName);

            if (!rules) return;

            for (const key in config) {
                (rules as any)[key] = (config as any)[key] ?? (rules as any)[key];
            }

            if (config.alias) {
                schema.aliasMap[config.alias] = methodName as never;
            }
        }
    },

    outputFor(group: string) {
        return DECORATORS.property({ outputFor: group as never });
    },

    inputFor(group: string) {
        return DECORATORS.property({ inputFor: group as never });
    },

    actionFor(group: string) {
        return DECORATORS.method({ actionFor: group as never });
    },

    eventFor(group: string) {
        return DECORATORS.method({ eventFor: group as never });
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

const { input, output, hidden, action, event, shared } = DECORATORS;
export { input, output, hidden, action, event, shared, DECORATORS };