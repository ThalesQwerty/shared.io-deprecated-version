import _ from "lodash";
import { KeyValue } from ".";

interface Node<T = any> {
    [key: string]: Node | T;
}


export class Tree<T = any> {
    private readonly nodes: Node = {};

    /**
     * Lists all valid paths on the tree
     */
    public readonly paths: string[] = [];

    /**
     * Lists all the values on the tree
     */
    public get values() {
        return this.paths.map(path => this.get(path));
    }

    /**
     * Creates a single-depth object with all paths and values of the tree
     */
    public get flat(): KeyValue<T> {
        return this.paths.reduce((object, path) => ({...object, [path]: this.get(path)}), {});
    }

    private parsePath(path: string) {
        return path.replace(/\//g, ".");
    }

    /**
     * Gets a value from the tree
     * @param path
     * @param value
     */
    public get(path: string): T|undefined {
        return this.paths.includes(path) ? _.get(this.nodes, this.parsePath(path)) : undefined;
    }

    /**
     * Writes a value into the tree
     * @param path
     * @param value
     */
    public set(path: string, value: T) {
        _.set(this.nodes, this.parsePath(path), value);

        if (!this.paths.includes(path)) {
            this.paths.push(path);
        }
    }

    /**
     * Removes a value from the tree
     * @param path
     * @returns `true` if there was a value, `false` otherwise.
     */
    public unset(path: string) {
        const value = this.get(path);

        if (value) {
            const index = this.paths.indexOf(path);
            if (index >= 0) this.paths.splice(index, 1);

            _.unset(this.nodes, this.parsePath(path));
            return true;
        }

        return false;
    }

    /**
     * Removes all values from the tree
     */
    public clear() {
        Object.keys(this.nodes).forEach(key => {
            delete this.nodes[key];
        });
        this.paths.splice(0, this.paths.length);
    }
}