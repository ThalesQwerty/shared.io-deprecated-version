import EventEmitter from "node:events";
import { CustomEventEmitter, KeyValue } from ".";
import _  from "lodash";

export interface WatchedObjectEvents {
    write: {
        key: string,
        oldValue: unknown,
        newValue: unknown
    },
    call: {
        key: string,
        parameters: unknown[],
        returnedValue: unknown
    },
    deleteKey: {
        key: string,
        oldValue: unknown
    }
}

type WatchedObject<ObjectType extends object = object, EventList extends KeyValue = {}> = ObjectType&CustomEventEmitter<WatchedObjectEvents&EventList>;

const WatchedObject = class WatchedObject extends CustomEventEmitter<WatchedObjectEvents> {
    constructor(props?: object, ignoreKeys: string[] = []) {
        super();

        if (props) {
            Object.setPrototypeOf(this, Object.getPrototypeOf(props));

            for (const key in EventEmitter.prototype) {
                (this as any)[key] = (EventEmitter.prototype as any)[key];
            }
        }

        const ignoredKeys: string[] = [...ignoreKeys, ...Object.keys(EventEmitter.prototype)];
        const children: KeyValue<WatchedObject> = {};

        const createChild = (key: string, target: Object) => {
            const newChild = children[key] = new WatchedObject(target);

            newChild.on("write", event => {
                if (children[key] === newChild) {
                    this.emit("write", {
                        key: `${key}.${event.key}`,
                        oldValue: event.oldValue,
                        newValue: event.newValue
                    })
                }
            });

            newChild.on("call", event => {
                if (children[key] === newChild) {
                    this.emit("call", {
                        key: `${key}.${event.key}`,
                        parameters: event.parameters,
                        returnedValue: event.returnedValue
                    })
                }
            });

            newChild.on("deleteKey", event => {
                if (children[key] === newChild) {
                    this.emit("deleteKey", {
                        key: `${key}.${event.key}`,
                        oldValue: event.oldValue
                    })
                }
            });

            return newChild;
        }

        const proxy = new Proxy(this, {
            get: (target: any, key: string) => {
                if (ignoredKeys.includes(key)) {
                    return target[key];
                }

                const value = target[key];
                const isObject = value && typeof value === "object";
                const isFunction = value && typeof value === "function";

                return isObject ? (children[key] ??= createChild(key, value))
                    : isFunction ? (children[key] ??= new Proxy(value, {
                        apply: (target: Function, thisArg: object, parameters: any[]) => {
                            const returnedValue = target.apply(thisArg, parameters);
                            this.emit("call", {
                                key,
                                parameters,
                                returnedValue
                            });
                            return returnedValue;
                        }
                    }))
                    : value;
            },
            set: (target: any, key: string, newValue: any) => {
                if (ignoredKeys.includes(key)) {
                    target[key] = newValue;
                    return true;
                }

                if (newValue && typeof newValue === "object") {
                    createChild(key, newValue);
                }

                const oldValue = target[key];
                target[key] = newValue;

                this.emit("write", {
                    key,
                    oldValue,
                    newValue
                });

                return true;
            },
            deleteProperty: (target: any, key: string) => {
                if (ignoredKeys.includes(key)) {
                    delete target[key];
                    return true;
                }

                const oldValue = target[key];
                delete target[key];

                this.emit("deleteKey", {
                    key,
                    oldValue
                });

                return true;
            }
        }) as this;

        if (props) {
            for (const key in props) {
                (proxy as any)[key] = (props as any)[key];
            }
            if (props instanceof Array) (proxy as any).length = props.length;
        }

        return proxy;
    }
} as new <ObjectType extends object, EventList extends KeyValue = {}>
    (object?: ObjectType, ignoreKeys?: string[]) => WatchedObject<ObjectType, EventList>;

export {
    WatchedObject
};