import { Group, KeyValue, StringKeyOf } from "../utils";
import { Entity, User, BuiltinUserGroup, UserGroup } from ".";

export type EntityKey<EntityType extends Entity> = StringKeyOf<EntityType>;

export type EntityGroupKey<EntityType extends Entity = Entity> = BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends User|Group<User>|undefined ? key : never
}[EntityKey<EntityType>];

export type EntityNonGroupKey<EntityType extends Entity = Entity> = {
    [key in EntityKey<EntityType>]: EntityType[key] extends User|Group<User>|undefined  ? never : key
}[EntityKey<EntityType>];

export type EntityMethodKey<EntityType extends Entity = Entity> = EntityKey<EntityType> & (BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends Function ? key : never
}[EntityKey<EntityType>]);

export type EntityPropertyKey<EntityType extends Entity = Entity> = EntityKey<EntityType> & (BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends Function ? never : key
}[EntityKey<EntityType>]);

export type PrimitiveTypeName =
    | "unknown"
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "object";
export type ArrayTypeName = (PrimitiveTypeName) | `${(PrimitiveTypeName)}[]`
export type UnionTypeName = ArrayTypeName | `${ArrayTypeName}|${ArrayTypeName}` | `${ArrayTypeName}|${ArrayTypeName}|${ArrayTypeName}`;
export type SimpleTypeName = (UnionTypeName) | `${(UnionTypeName)}[]`;
export interface CompoundTypeName {
    [key: string]: (SimpleTypeName|CompoundTypeName)|(SimpleTypeName|CompoundTypeName)[]
}
export type TypeName = SimpleTypeName|CompoundTypeName;

export interface EntitySchema<EntityType extends Entity = any> {
    type: string;
    properties: KeyValue<EntityPropertySchema<EntityType>>;
    methods: KeyValue<EntityMethodSchema>;
    userGroups: EntityGroupKey<EntityType>[];
    extends?: EntitySchema;
    getProperty: (key: string) => EntityPropertySchema|undefined;
    getMethod: (key: string) => EntityMethodSchema|undefined;
    complete: boolean;
}

export interface EntityPropertySchema<EntityType extends Entity = any> {
    key: string;
    name: string;
    type: TypeName;
    inputGroupName: string;
    outputGroupName: string;
    objectiveGetter?: EntityObjectiveGetter,
    objectiveSetter?: EntityObjectiveSetter,
    subjectiveGetter?: EntitySubjectiveGetter<EntityType>,
    subjectiveSetter?: EntitySubjectiveSetter<EntityType>,
    initialDependencies?: Group<string>,
    isAsynchronous: boolean,
}

export interface EntityMethodSchema<EntityType extends Entity = any> {
    key: string;
    name: string;
    parameters: EntityMethodParameterSchema[];
    returnType: "void"|TypeName;
    actionGroupName: string;
    eventGroupName: string;
}

export interface EntityMethodParameterSchema {
    name: string;
    type: TypeName;
    required: boolean;
}
export interface EntityBlankSchema extends EntitySchema {
    type: string;
    properties: KeyValue<EntityPropertySchema>;
    userGroups: (BuiltinUserGroup&string)[]
}

export type EntityObjectiveGetter = () => unknown;
export type EntityObjectiveSetter = (newValue: unknown) => void;
export type EntitySubjectiveGetter<EntityType extends Entity = any, ValueType = unknown> = (this: EntityType, user: User) => ValueType;
export type EntitySubjectiveSetter<EntityType extends Entity = any, ValueType = unknown> = (this: EntityType, newValue: unknown, user: User) => ValueType;

export type EntityPolicy = Partial<{
    [key: string]: {
        /**
         * Which user group has input access to this key
         */
        input: UserGroup,

        /**
         * Which user group has output access to this key
         */
        output: UserGroup
    }
}>;

export class Schema {
    public static readonly entities: KeyValue<EntitySchema> = {};

    public static generate(name: string): EntityBlankSchema {
         const schema: EntityBlankSchema = {
            complete: false,
            type: name,
            properties: {},
            methods: {},
            userGroups: ["owner", "viewers", "nobody"],

            getProperty(key) {
                return schema.properties[key] ?? schema.extends?.getProperty(key);
            },

            getMethod(key) {
                return schema.methods[key] ?? schema.extends?.getMethod(key);
            },
        };

        return schema;
    }

    public static findOrCreate(entity: typeof Entity): EntitySchema {
        const typeName = entity.constructor.name;
        const schema = this.entities[typeName] ??= this.generate(typeName);

        if (!schema.complete) {
            const entityPrototype = Object.getPrototypeOf(entity);
            schema.extends = entity.constructor === Entity || !entityPrototype ? undefined : Schema.findOrCreate(entityPrototype);
            schema.complete = true;
        }

        return schema;
    }

    public static findOrCreateByName(typeName: string) {
        return this.entities[typeName] ??= this.generate(typeName);
    }
}