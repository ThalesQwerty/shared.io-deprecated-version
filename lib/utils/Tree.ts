import _ from "lodash";
import { KeyValue } from ".";

export interface Node<T = any> {
    /**
     * The value stored on this node
     */
    value?: T,

    /**
     * The nodes which directly descend from this
     */
    children: KeyValue<Node<T>>
}

export class TreeNode<T = any> {
    constructor(
        public value?: T,
        public children: Partial<KeyValue<TreeNode<T>>> = {}
    ) {}
}
export class Tree<T = any> {
    private static splitPath(path: string) {
        return path ? path.replace(/\//g, ".").split(".") : [];
    }

    /**
     * Finds a node from the tree
     * @param path The path, starting from the root
     * @returns The found node, or `undefined` if not found.
     */
    public find(path: string) {
        const steps = Tree.splitPath(path);
        let currentNode: TreeNode<T> | undefined = this.root;

        for (const step of steps) {
            if (!currentNode) break;
            currentNode = currentNode.children[step];
        }

        return currentNode;
    }


    /**
     * Appends a node into the tree
     * @param path The path, starting from the root
     * @param node The node to be appended. If omitted, creates a new empty one.
     * @returns The appended node
     */
    public append(path: string, node: TreeNode<T> = new TreeNode<T>()) {
        const steps = Tree.splitPath(path);
        let currentNode: TreeNode<T> = this.root;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const isLastStep = i === steps.length - 1;

            if (isLastStep) {
                return currentNode.children[step] = node;
            }

            currentNode = currentNode.children[step] ??= new TreeNode<T>();
        }

        return currentNode;
    }

    /**
     * Attempts to find a node from the tree. If not found, appends a new one into the given path.
     * @param path The path, starting from the root
     * @param node The node to be appended if the given path is empty. If omitted, creates a new empty one.
     * @returns The found node, or `undefined` if not found.
     */
    public findOrAppend(path: string, node: TreeNode<T> = new TreeNode<T>()) {
        const steps = Tree.splitPath(path);
        let currentNode: TreeNode<T> = this.root;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const isLastStep = i === steps.length - 1;

            if (isLastStep) {
                return currentNode.children[step] ??= node;
            }

            currentNode = currentNode.children[step] ??= new TreeNode<T>();
        }

        return currentNode;
    }

    /**
     * Removes an existing node from the tree
     * @param path The path, starting from the root
     * @returns The removed node, or `undefined` if it has not been found.
     */
    public remove(path: string) {
        const steps = Tree.splitPath(path);
        let currentNode: TreeNode<T> | undefined = this.root;

        for (let i = 0; i < steps.length; i++) {
            if (!currentNode) return undefined;

            const step = steps[i];
            const isLastStep = i === steps.length - 1

            if (isLastStep) {
                const deleted = currentNode.children?.[step];
                delete currentNode.children?.[step];
                return deleted;
            }

            currentNode = currentNode.children?.[step];
        }

        return undefined;
    }

    /**
     * Finds a node from the tree and returns its value
     * @param path The path, starting from the root
     * @returns The value obtained, or `undefined` if not found.
     */
    public get(path: string) {
        return this.find(path)?.value;
    }

    /**
     * Finds or appends a node into the tree and sets its value
     * @param path The path, starting from the root
     * @param value The value to be written
     * @returns The value that has been written
     */
    public set(path: string, value?: T) {
        return this.findOrAppend(path).value = value;
    }

    public root: TreeNode<T>;

    constructor(rootNode: TreeNode<T>)
    constructor(rootValue?: T)
    constructor(root?: TreeNode<T>|T) {
        if (root instanceof TreeNode) this.root = root;
        else this.root = new TreeNode(root);
    }
}