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
    name: EntityPropertyKey<EntityType>;
    alias: string;
    type: TypeName;
    inputGroupName: EntityGroupKey<EntityType>;
    outputGroupName: EntityGroupKey<EntityType>;
    objectiveGetter?: EntityObjectiveGetter,
    objectiveSetter?: EntityObjectiveSetter,
    subjectiveGetter?: EntitySubjectiveGetter<EntityType>,
    subjectiveSetter?: EntitySubjectiveSetter<EntityType>,
    initialDependencies?: Group<string>,
    isAsynchronous: boolean,
}

export interface EntityMethodSchema<EntityType extends Entity = any> {
    name: EntityMethodKey<EntityType>;
    alias: string;
    parameters: EntityMethodParameterSchema[];
    returnType: ReturnTypeName;
    actionGroupName: EntityGroupKey<EntityType>;
    eventGroupName: EntityGroupKey<EntityType>;
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
    reverseAliasMap: KeyValue<string> = {};
    usefulUserGroups: Group<string> = new Group();
    visibleUserGroups: Group<string> = new Group();
    prototype?: typeof Entity;
    extends?: EntitySchema;

    getProperty(alias: string): EntityPropertySchema|undefined {
        const name = this.getName(alias);
        return this.properties[name] ?? this.extends?.getProperty(alias);
    }

    getMethod(alias: string): EntityMethodSchema|undefined {
        const name = this.getName(alias);
        return this.methods[name] ?? this.extends?.getMethod(alias);
    }

    getName(alias: string) {
        return this.aliasMap[alias] ?? alias;
    }

    createProperty(propertyName: EntityPropertyKey<EntityType>) {
        return this.properties[propertyName] ??= {
            alias: propertyName,
            name: propertyName,
            type: "unknown",
            inputGroupName: UserGroup.NONE,
            outputGroupName: UserGroup.OWNERS,
            isAsynchronous: false
        };
    }

    createMethod(methodName: EntityMethodKey<EntityType>) {
        return this.methods[methodName] ??= {
            alias: methodName,
            name: methodName,
            returnType: "unknown",
            parameters: [],
            actionGroupName: UserGroup.NONE,
            eventGroupName: UserGroup.NONE
        };
    }

    extended(): EntitySchema {
        const parent = this.extends?.extended();

        return parent ? {
            ...this,
            properties: {
                ...parent.properties,
                ...this.properties
            },
            methods: {
                ...parent.methods,
                ...this.methods
            },
            aliasMap: {
                ...parent.aliasMap,
                ...this.aliasMap
            },
            reverseAliasMap: {
                ...parent.reverseAliasMap,
                ...this.reverseAliasMap
            },
            usefulUserGroups: Group.union(parent.usefulUserGroups, this.usefulUserGroups).clone(),
            visibleUserGroups: Group.union(parent.visibleUserGroups, this.visibleUserGroups).clone(),
            extends: undefined
        } : this;
    }

    listGroupAliases() {
        const extendedSchema = this.extended();
        const visibleUserGroups = extendedSchema.visibleUserGroups.asArray;
        const usefulUserGroups = extendedSchema.usefulUserGroups.asArray;

        return visibleUserGroups.filter(alias => {
            const name = extendedSchema.aliasMap[alias] ?? alias;
            return usefulUserGroups.includes(name);
        });
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