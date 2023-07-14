import _ from "lodash";
import { KeyValue } from ".";

interface Node<T = any> {
    /**
     * The value stored on this node
     */
    value?: T,

    /**
     * The nodes which directly descend from this
     */
    children: KeyValue<Node<T>>
}

const PATH_SEPARATOR = ".";

function emptyNode<T>(): Node<T> {
    return {children: {}};
}
export class Tree<T = any> {
    private static pathSteps(path: string) {
        return path ? path.replace(/\//g, PATH_SEPARATOR).split(PATH_SEPARATOR) : [];
    }

    /**
     * Searches for a node in a tree, given its expected path.
     * @param startingNode The starting point for the search. Attempts to find the wanted node somewhere in the descendents of the starting node.
     * @param relativePath The path (relative to the starting point) where the node is expected to be found.
     * @returns A descendent node from the starting point, or `undefined` if not found.
     */
    public static findNode<T = any>(startingNode: Node<T>, relativePath: string) {
        const steps = Tree.pathSteps(relativePath);
        let currentNode: Node<T>|undefined = startingNode;

        for (const step of steps) {
            if (!currentNode) break;
            currentNode = currentNode.children?.[step];
        }

        return currentNode;
    }

    /**
     * Creates a new node in a tree, if it doesn't already exist.
     * @param startingNode The starting point for the search. Attempts to create the new node somewhere in the descendents of the starting node.
     * @param relativePath The path (relative to the starting point) where the node is expected to be created.
     * @returns The created node, or the one that already existed.
     */
    public static createNode<T = any>(startingNode: Node<T>, relativePath: string) {
        const steps = Tree.pathSteps(relativePath);
        let currentNode: Node<T> = startingNode;

        for (const step of steps) {
            currentNode = currentNode.children[step] ??= emptyNode();
        }

        return currentNode;
    }

    /**
     * Deletes an existing node.
     * @param startingNode The starting point for the search. Attempts to create the new node somewhere in the descendents of the starting node.
     * @param relativePath The path (relative to the starting point) where the node is expected to be created.
     * @returns The created node, or the one that already existed.
     */
    public static deleteNode<T = any>(startingNode: Node<T>, relativePath: string) {
        const steps = Tree.pathSteps(relativePath);
        let currentNode: Node<T>|undefined = startingNode;

        for (let i = 0; i < steps.length; i++) {
            if (!currentNode) return false;

            const step = steps[i];

            if (i < steps.length - 1) {
                currentNode = currentNode.children?.[step];
            } else {
                delete currentNode.children?.[step];
                return true;
            }
        }

        return false;
    }

    /**
     * The root node. All other nodes descend from this.
     */
    public get root() {
        return this._root;
    }
    private _root: Node<T> = emptyNode()

    /**
     * Gets a node from the tree
     * @param path The path, starting from the root
     * @returns The found node, or `undefined` if not found.
     */
    public node(path: string) {
        return Tree.findNode(this.root, path);
    }

    /**
     * Gets a value from the tree
     * @param path The path, starting from the root
     * @returns The value obtained, or `undefined` if not found.
     */
    public get(path: string) {
        return Tree.findNode(this.root, path)?.value;
    }

    /**
     * Writes a value into the tree
     * @param path The path, starting from the root
     * @param value The value you want to write
     * @returns The new value written
     */
    public set(path: string, value?: T) {
        return Tree.createNode(this.root, path).value = value;
    }

    /**
     * Deletes an existing node
     * @param path The path, starting from the root
     * @returns `true` if there was a value, `false` otherwise.
     */
    public unset(path: string) {
        return Tree.deleteNode(this.root, path);
    }

    /**
     * Removes all nodes from the tree
     */
    public reset() {
        this._root = emptyNode();
    }

    constructor (rootValue?: T) {
        this._root.value = rootValue;
    }
}