import { EventEmitter } from "node:events";
import { KeyValue } from "../utils";

export class CustomEventEmitter<EventList extends KeyValue = {}> extends EventEmitter implements ICustomEventEmitter<EventList> {};

export interface ICustomEventEmitter<EventList extends KeyValue = {}> extends EventEmitter {
    on: <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) => this;
    once: <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) => this;
    addListener: <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) => this;
    removeListener: <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) => this;
    off: <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) => this;
    prependListener: <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) => this;
    emit: <name extends keyof EventList>(event: name extends string ? name : symbol, parameters: EventList[name]) => boolean;
    removeAllListeners: <name extends keyof EventList>(event?: name extends string ? name : symbol) => this;
}

export type CustomEvent<CustomEventList extends KeyValue, name extends keyof CustomEventList> = CustomEventList[name];
