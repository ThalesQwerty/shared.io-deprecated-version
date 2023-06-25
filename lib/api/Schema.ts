import { KeyValue } from "../utils";

export interface EntitySchema {
    type: string;
    properties: KeyValue<EntityPropertySchema>;
    userGroups: UserListSchema[]
}

export type UserListSchema = string;

export interface EntityPropertySchema {
    name: string;
    inputGroup: UserListSchema;
    outputGroup: UserListSchema;
}

export class Schema {
    public static readonly entities: KeyValue<EntitySchema> = {};
}