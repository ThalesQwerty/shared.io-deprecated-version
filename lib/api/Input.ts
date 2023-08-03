import { KeyValue } from "../utils";

/**
 * Base interface for inputs
 */
export interface SharedIOBaseInput {
    type: "write" | "call" | "message";
    id: string;
    data: KeyValue;
}

export interface EntityInputIndexes {
    type: string;
    id: string;

    channel: {
        type: string;
        id: string;
    } | null;

    isOwned: boolean;
    hasJoined: boolean;
}

/**
 * Sends updates of the user view in a given channel
 */
 export interface WriteInput extends SharedIOBaseInput {
    type: "write";
    data: {
        entity: EntityInputIndexes
        changes: KeyValue
    }
}

export interface CallInput extends SharedIOBaseInput {
    type: "call";
    data: {
        entity: EntityInputIndexes
        method: string,
        parameters: unknown[]
    }
}

export interface MessageInput extends SharedIOBaseInput {
    type: "message";
    data: KeyValue
}

export type Input =
    | WriteInput
    | CallInput
    | MessageInput;