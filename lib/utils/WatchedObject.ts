import EventEmitter from "node:events";
import { ComputedProperty, CustomEventEmitter, Debouncer, KeyValue, StringKeyOf } from ".";
import _  from "lodash";

export interface WatchedObjectEvents {
    write: {
        key: string,
        oldValue: unknown,
        newValue: unknown,
    },
    read: {
        key: string,
        value: unknown
    },
    call: {
        key: string,
        parameters: unknown[],
        returnedValue: unknown
    },
    delete: {
        key: string,
        oldValue: unknown
    }
}

export class ObjectWatcher<ObjectType extends Object = Object> extends CustomEventEmitter<WatchedObjectEvents> {
    /**
     * Dynamically infers the value of a given key in the `target`
     * object, based on the value of its other keys.
     *
     * These other keys are considered dependencies.
     * Whenever any of the dependencies change, a new value is inferred and
     * then the `watcher` emits a `"write"` event accounting for this change.
     *
     * Note: The inferred value is not actually written into the `target`,
     * so it may differ from its actual value (or there may be no actual
     * value at all).
     *
     * @param key
     * The key which value will be dynamically inferred.
     *
     * @param algorithm
     * Method used to compute the inferred value.
     * Whenever other keys from the `target` are read inside the function body,
     * they become dependencies. The inference algorithm will be called
     * whenever any of the dependencies change value.
     *
     * @returns
     * A computed property representing the inferred value.
     */
    public infer<T = any>(key: StringKeyOf<ObjectType>, algorithm: (proxy: ObjectType) => T): ComputedProperty<T, ObjectType> {
        let lastInferredValue: T;
        const computedProperty = new ComputedProperty(this.parent, algorithm, (newValue, oldValue) => {
            if (newValue !== lastInferredValue) {
                this.emit("write", {
                    key,
                    newValue,
                    oldValue
                });
            }
        });
        lastInferredValue = computedProperty.value;
        return computedProperty;
    }

    constructor(private readonly parent: WatchedObject<ObjectType>) {
        super();
    }
}

/**
 * For a given `target` object, creates a new `proxy` object and its `watcher`. Whenever something happens in the `proxy`, it will be replicated on the `target` and the `watcher` will emit a corresponding event that can be listened to.
 */
export class WatchedObject<ObjectType extends Object = Object> {
    /**
     * A proxy for the `target` object. Whenever something happens in it, the `watcher` emits an event.
     */
    public readonly proxy: ObjectType;

    /**
     * Emits events when something happens on the watched object.
     *
     * - `write`: Whenever some value is written into a property
     * - `read`: Whenever some value is read from a property
     * - `call`: Whenever some method is called
     * - `delete`: Whenever some property/method is deleted
     */
    public readonly watcher: ObjectWatcher<ObjectType> = new ObjectWatcher(this);

    constructor(
        /**
         * Original object.
         */
        public readonly target: ObjectType,
        /**
         * Defines which keys will not be watched. (Only top-level keys are supported)
         */
        ignoreKeys: string[] = [],
        ignoreObjects: WatchedObject<any>[] = []
    ) {
        const children: KeyValue<Object> = {};

        const createChild = (key: string, childObject: Object) => {
            if (childObject === this.target) {
                return children[key] = this.proxy;
            }

            const duplicate = ignoreObjects.find(({ target }) => target === childObject);
            if (duplicate) {
                return children[key] = duplicate.proxy;
            }

            const {proxy: newChild, watcher: newProxy} = new WatchedObject(childObject, [], [...ignoreObjects, this]);
            children[key] = newChild;

            newProxy.on("read", event => {
                if (children[key] === newChild) {
                    this.watcher.emit("read", {
                        ...event,
                        key: `${key}.${event.key}`
                    })
                }
            });

            newProxy.on("write", event => {
                if (children[key] === newChild) {
                    this.watcher.emit("write", {
                        ...event,
                        key: `${key}.${event.key}`
                    })
                }
            });

            newProxy.on("call", event => {
                if (children[key] === newChild) {
                    this.watcher.emit("call", {
                        ...event,
                        key: `${key}.${event.key}`
                    })
                }
            });

            newProxy.on("delete", event => {
                if (children[key] === newChild) {
                    this.watcher.emit("delete", {
                        ...event,
                        key: `${key}.${event.key}`
                    })
                }
            });

            return newChild;
        }

        this.proxy = new Proxy(this.target, {
            get: (target: ObjectType, key: StringKeyOf<ObjectType>) => {
                if (ignoreKeys.includes(key)) {
                    return target[key];
                }

                const value = target[key];
                const isObject = value && typeof value === "object";
                const isFunction = value && typeof value === "function";

                this.watcher.emit("read", {
                    key,
                    value
                });

                return isObject ? (children[key] ??= createChild(key, value))
                    : isFunction ? (children[key] ??= new Proxy(value, {
                        apply: (method: Function, thisArg: object, parameters: any[]) => {
                            const returnedValue = method.apply(thisArg, parameters);
                            this.watcher.emit("call", {
                                key,
                                parameters,
                                returnedValue
                            });
                            return returnedValue;
                        }
                    }))
                    : value;
            },
            set: (target: ObjectType, key: StringKeyOf<ObjectType>, newValue: any) => {
                if (ignoreKeys.includes(key)) {
                    target[key] = newValue;
                    return true;
                }

                const oldValue = target[key];
                target[key] = newValue;

                if (newValue && typeof newValue === "object") {
                    createChild(key, newValue);
                }

                this.watcher.emit("write", {
                    key,
                    oldValue,
                    newValue
                });

                return true;
            },
            deleteProperty: (target: ObjectType, key: StringKeyOf<ObjectType>) => {
                if (ignoreKeys.includes(key)) {
                    delete target[key];
                    return true;
                }

                const oldValue = target[key];
                delete target[key];

                this.watcher.emit("delete", {
                    key,
                    oldValue
                });

                return true;
            }
        }) as ObjectType;
    }
}