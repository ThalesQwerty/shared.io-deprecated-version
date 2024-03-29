import { Group } from "../data";
import { StringKeyOf } from "../utils";
import { Debouncer } from "./Debouncer";
import { WatchedObject, WatchedObjectEvents } from "./WatchedObject";

export class ComputedProperty<PropertyType = any, ObjectType extends Object = Object> {
    public readonly dependencies = new Group<StringKeyOf<ObjectType>>();
    public readonly reference: WatchedObject<ObjectType>;

    private _value: PropertyType;
    public get value() {
        return this._value;
    }
    public set value(newValue) {
        const oldValue = this._value;
        this.onChange(this._value = newValue, oldValue);
    }

    public disabled = false;
    public disable() {
        this.disabled = true;
    }
    public enable() {
        this.disabled = false;
    }

    constructor(
        reference: WatchedObject<ObjectType>|ObjectType,
        private readonly algorithm: (proxy: ObjectType) => PropertyType,
        public onChange: (newValue: PropertyType, oldValue: PropertyType) => void = () => {},
    ) {
        this.reference = reference instanceof WatchedObject ? reference : new WatchedObject<ObjectType>(reference);

        this.reference.watcher.on("write", event => this.triggerUpdate(event));
        this._value = this.update();
    }

    private readonly triggerUpdate = new Debouncer((writeEvents: WatchedObjectEvents["write"][]) => {
        if (this.disabled) return;

        let hasAnyDepedencyChanged = false;

        for (const writeEvent of writeEvents) {
            if (this.dependencies.has(writeEvent.key as StringKeyOf<ObjectType>)) {
                hasAnyDepedencyChanged = true;
                break;
            }
        }

        if (hasAnyDepedencyChanged) {
            this.update();
        }
    }).call;

    update(): PropertyType {
        const addDependency = ({ key }: WatchedObjectEvents["read"]) => {
            const typedKey = key as StringKeyOf<ObjectType>;

            this.dependencies.add(typedKey);
        }

        this.reference.watcher.on("read", event => addDependency(event));

        this.value = this.algorithm(this.reference.proxy);

        this.reference.watcher.off("read", event => addDependency(event));

        return this.value;
    }
}