import { Group, KeyValue, StringKeyOf } from "../utils";
import { Entity } from "./Entity";
import { User } from "./User";
import { BuiltinUserGroup, UserGroup } from "./UserGroup";

export type EntityDefaultKey = Exclude<StringKeyOf<Entity>,"delete">;

export type EntityKey<EntityType extends Entity> = Exclude<StringKeyOf<EntityType>, EntityDefaultKey>;

export type EntityGroupKey<EntityType extends Entity = Entity> = BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends Group<User> ? key : never
}[EntityKey<EntityType>];

export type EntityNonGroupKey<EntityType extends Entity = Entity> = {
    [key in EntityKey<EntityType>]: EntityType[key] extends Group<User> ? never : key
}[EntityKey<EntityType>];

export type EntityMethodKey<EntityType extends Entity = Entity> = EntityNonGroupKey<EntityType> & (BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends Function ? key : never
}[EntityKey<EntityType>]);

export type EntityPropertyKey<EntityType extends Entity = Entity> = EntityNonGroupKey<EntityType> & (BuiltinUserGroup | {
    [key in EntityKey<EntityType>]: EntityType[key] extends Function ? never : key
}[EntityKey<EntityType>]);
export interface EntitySchema {
    type: string;
    properties: KeyValue<EntityPropertySchema>;
    userGroups: string[]
}

export interface EntityBlankSchema extends EntitySchema {
    type: string;
    properties: KeyValue<EntityPropertySchema>;
    userGroups: BuiltinUserGroup[]
}

export interface EntityPropertySchema {
    name: string;
    inputGroupName: string;
    outputGroupName: string;
}

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