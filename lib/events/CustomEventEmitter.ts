import { EventEmitter } from "node:events";
import { KeyValue } from "../utils";

export abstract class CustomEventEmitter<EventList extends KeyValue = {}> extends EventEmitter {
    on <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) {
        return super.on(event, listener);
    }

    once <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) {
        return super.once(event, listener);
    }

    addListener <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) {
        return super.addListener(event, listener);
    }

    removeListener <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) {
        return super.removeListener(event, listener);
    }

    off <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) {
        return super.off(event, listener);
    }

    prependListener <name extends keyof EventList>(event: name extends string ? name : symbol, listener: (event: Event & EventList[name]) => void) {
        return super.prependListener(event, listener);
    }

    emit <name extends keyof EventList>(event: name extends string ? name : symbol, parameters: EventList[name]) {
        return super.emit(event, parameters);
    }

    removeAllListeners <name extends keyof EventList>(event?: name extends string ? name : symbol) {
        return super.removeAllListeners(event);
    }
};

export type CustomEvent<CustomEventList extends KeyValue, name extends keyof CustomEventList> = CustomEventList[name];