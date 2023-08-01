export type Constructor<T> = new (...args: any[]) => T;

export class InstanceTree<InstanceType extends Object = Object> {
    public readonly children: {
        [className: string]: {
            class: Constructor<InstanceType>,
            instances: {
                [id: string]: InstanceType
            }
        }
    } = {};

    add(instance: InstanceType, id: string) {
        const className = instance.constructor.name;

        this.children[className] ??= {
            class: instance.constructor as Constructor<InstanceType>,
            instances: {}
        };

        this.children[className].instances[id] = instance;
    }

    find(constructor: string|Constructor<InstanceType>, id: string): InstanceType|undefined {
        const className = typeof constructor === "string" ? constructor : constructor.constructor.name;
        return this.children[className].instances[id];
    }

    remove(constructor: string|Constructor<InstanceType>, id: string): InstanceType|undefined {
        const className = typeof constructor === "string" ? constructor : constructor.constructor.name;
        const found = this.children[className].instances[id];
        delete this.children[className].instances[id];
        return found;
    }
}