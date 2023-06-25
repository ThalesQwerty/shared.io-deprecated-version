import { KeyValue } from "../utils";
import { BuiltinUserGroup } from "./UserGroup";

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
    inputGroup: string;
    outputGroup: string;
}

export class Schema {
    public static readonly entities: KeyValue<EntitySchema> = {};
}