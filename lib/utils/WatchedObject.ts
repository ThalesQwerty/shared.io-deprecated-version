import EventEmitter from "node:events";
import { CustomEventEmitter, KeyValue } from ".";
import _  from "lodash";

export type WatchedObjectEvents = {
    write: (event: { key: string, oldValue: unknown, newValue: unknown }) => void;
    delete: (event: { key: string, oldValue: unknown }) => void;
    change: (event: { diff: KeyValue }) => void
}

type WatchedObject<T extends object = object> = T&CustomEventEmitter<WatchedObjectEvents>;

const WatchedObject = class WatchedObject extends CustomEventEmitter<WatchedObjectEvents> {
    constructor(props?: Object) {
        super();

        if (props) {
            Object.setPrototypeOf(this, Object.getPrototypeOf(props));

            for (const key in EventEmitter.prototype) {
                (this as any)[key] = (EventEmitter.prototype as any)[key];
            }
        }

        const ignoredKeys: string[] = Object.keys(EventEmitter.prototype);
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

            newChild.on("delete", event => {
                if (children[key] === newChild) {
                    this.emit("delete", {
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

                return isObject ? (children[key] ??= createChild(key, value)) : value;
            },
            set: (target: any, key: string, value: any) => {
                if (ignoredKeys.includes(key)) {
                    target[key] = value;
                    return true;
                }

                const isObject = value && typeof value === "object";

                if (isObject) {
                    createChild(key, value);
                }

                this.emit("write", {
                    key,
                    oldValue: target[key],
                    newValue: value
                });

                target[key] = value;
                return true;
            },
            deleteProperty: (target: any, key: string) => {
                if (ignoredKeys.includes(key)) {
                    delete target[key];
                    return true;
                }

                this.emit("delete", {
                    key,
                    oldValue: target[key]
                });

                delete target[key];
                return true;
            }
        }) as this;

        let changes: KeyValue = {};

        const emitChange = (key: string, newValue: unknown) => {
            const hasChanges = !!Object.keys(changes).length;

            if (!hasChanges) {
                process.nextTick(() => {
                    proxy.emit("change", {
                        diff: _.cloneDeep(changes)
                    });
                    changes = {};
                });
            }

            changes[key] = newValue;
        }

        proxy.on("write", ({ key, newValue }) => {
            emitChange(key, newValue);
        });

        proxy.on("delete", ({ key }) => {
            emitChange(key, undefined);
        });

        if (props) {
            for (const key in props) {
                (proxy as any)[key] = (props as any)[key];
            }
        }

        return proxy;
    }
} as new <T extends object>(object?: T) => WatchedObject<T>;

export {
    WatchedObject
};