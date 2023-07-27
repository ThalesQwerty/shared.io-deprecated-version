import { Group, KeyValue, StringKeyOf } from "../utils";
import { Entity, User, BuiltinUserGroup, UserGroup } from ".";

export type EntityDefaultKey = Exclude<StringKeyOf<Entity>,"delete">;

export type EntityKey<EntityType extends Entity> = Exclude<StringKeyOf<EntityType>, EntityDefaultKey>;

export type EntityGroupKey<EntityType extends Entity = Entity> = BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends User|Group<User>|undefined ? key : never
}[EntityKey<EntityType>];

export type EntityNonGroupKey<EntityType extends Entity = Entity> = {
    [key in EntityKey<EntityType>]: EntityType[key] extends User|Group<User>|undefined  ? never : key
}[EntityKey<EntityType>];

export type EntityMethodKey<EntityType extends Entity = Entity> = EntityNonGroupKey<EntityType> & (BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends Function ? key : never
}[EntityKey<EntityType>]);

export type EntityPropertyKey<EntityType extends Entity = Entity> = EntityNonGroupKey<EntityType> & (BuiltinUserGroup | {
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

export interface EntitySchema {
    type: string;
    properties: KeyValue<EntityPropertySchema>;
    methods: KeyValue<EntityMethodSchema>;
    userGroups: string[]
}

export interface EntityPropertySchema {
    key: string;
    name: string;
    type: TypeName;
    inputGroupName: string;
    outputGroupName: string;
    objectiveGetter?: EntityObjectiveGetter,
    objectiveSetter?: EntityObjectiveSetter,
    subjectiveGetter?: EntitySubjectiveGetter,
    subjectiveSetter?: EntitySubjectiveSetter,
    initialDependencies?: Group<string>,
    isAsynchronous: boolean,
}

export interface EntityMethodSchema {
    key: string;
    name: string;
    parameters: EntityMethodParameterSchema[];
    returnType: TypeName;
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
export type EntitySubjectiveGetter<EntityType extends Entity = Entity, ValueType = unknown> = (this: EntityType, user: User) => ValueType;
export type EntitySubjectiveSetter<EntityType extends Entity = Entity, ValueType = unknown> = (this: EntityType, newValue: unknown, user: User) => ValueType;

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
}