import { KeyValue } from "../utils";

/**
 * Base interface for inputs
 */
export interface SharedIOBaseInput {
    type: "write" | "call";
    id: string;
    data: KeyValue;
}

/**
 * Sends updates of the user view in a given channel
 */
 export interface WriteInput extends SharedIOBaseInput {
    type: "write";
    data: {
        path: string,
        changes: KeyValue
    }
}

export interface CallInput extends SharedIOBaseInput {
    type: "call";
    data: {
        path: string,
        method: string,
        parameters: unknown[]
    }
}

export type Input =
    | WriteInput
    | CallInput;