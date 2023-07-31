import { Group, KeyValue, StringKeyOf } from "../utils";
import { Entity, User } from ".";
import { UserGroup, BuiltinUserGroup } from "./UserGroup";

export type EntityKey<EntityType extends Entity> = StringKeyOf<EntityType>;

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
export type ReturnTypeName = TypeName|"void";

export interface EntityPropertySchema<EntityType extends Entity = any> {
    name: string;
    alias: string;
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
    name: string;
    alias: string;
    parameters: EntityMethodParameterSchema[];
    returnType: ReturnTypeName;
    actionGroupName: string;
    eventGroupName: string;
}

export interface EntityMethodParameterSchema {
    name: string;
    type: TypeName;
    required: boolean;
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


export class EntitySchema<EntityType extends Entity = any> {
    properties: KeyValue<EntityPropertySchema<EntityType>> = {};
    methods: KeyValue<EntityMethodSchema> = {};
    aliasMap: KeyValue<EntityKey<EntityType>> = {};
    visibleUserGroups: Group<string> = new Group();
    prototype?: typeof Entity;
    extends?: EntitySchema;

    getProperty(key: string): EntityPropertySchema|undefined {
        const alias = this.aliasMap[key] ?? key;
        return this.properties[alias] ?? this.extends?.getProperty(key);
    }

    getMethod(key: string): EntityMethodSchema|undefined {
        const alias = this.aliasMap[key] ?? key;
        return this.methods[alias] ?? this.extends?.getMethod(key);
    }

    createProperty(propertyName: string) {
        return this.properties[propertyName] ??= {
            alias: propertyName,
            name: propertyName,
            type: "unknown",
            inputGroupName: UserGroup.NONE,
            outputGroupName: UserGroup.OWNERS,
            isAsynchronous: false
        };
    }

    createMethod(methodName: string) {
        return this.methods[methodName] ??= {
            alias: methodName,
            name: methodName,
            returnType: "unknown",
            parameters: [],
            actionGroupName: UserGroup.NONE,
            eventGroupName: UserGroup.NONE
        };
    }

    listAliases(): string[] {
        const keys = [...Object.keys(this.properties), ...Object.keys(this.methods)];
        const group = new Group(...keys);

        for (const alias in this.aliasMap) {
            const name = this.aliasMap[alias];
            group.add(alias);
            group.remove(name);
        }

        if (this.extends) group.addMany(this.extends.listAliases());
        return group.asArray;
    }

    listVisibleGroupNames(): string[] {
        const group = this.visibleUserGroups.clone();
        if (this.extends) group.addMany(this.extends.listVisibleGroupNames());
        return group.asArray;
    }

    constructor(public readonly type: string) {}
}

export class Schema {
    public static readonly entities: KeyValue<EntitySchema> = {};

    public static findOrCreate(entity: typeof Entity): EntitySchema {
        const typeName = entity.constructor.name;
        const schema = this.entities[typeName] ??= new EntitySchema(typeName);

        if (!schema.prototype) {
            const entityPrototype = Object.getPrototypeOf(entity);
            schema.prototype = entity;
            schema.extends = entity.constructor === Entity || !entityPrototype ? undefined : Schema.findOrCreate(entityPrototype);
        }

        return schema;
    }

    public static findOrCreateByName(typeName: string) {
        return this.entities[typeName] ??= new EntitySchema(typeName);
    }
}