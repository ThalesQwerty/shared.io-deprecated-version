import { CustomEventEmitter } from "./CustomEventEmitter";

export interface GroupEvents<T> {
    add: {
        item: T,
        group: Group<T>
    },
    remove: {
        item: T,
        group: Group<T>
    },
    change: {}
}

/**
 * Base class for groups of items. Behaves similarly to sets.
 */
export class Group<T> extends CustomEventEmitter<GroupEvents<T>> {
    private items: T[] = []

    /**
     * Adds a new item to the group, if not already included
     * @param item The item to be added
     * @returns `true` if not already included, `false` otherwise
     */
    add(item: T) {
        if (this.locked) throw new Error("Cannot directly add new items to locked group.");

        if (!this.has(item)) {
            this.items.push(item);
            this.emit("add", {
                item,
                group: this
            });
            return true;
        }
        return false;
    }

    /**
     * Adds many new items to the group, if not already included
     * @param items The items to be added
     * @returns An array mapping `true` for each item not already included, and `false` for otherwise
     */
    addMany(items: T[]|Group<T>) {
        const itemArray = items instanceof Group ? items.asArray : items;
        return itemArray.map(item => this.add(item));
    }

    /**
     * Remvoes an item from the group, if it was included
     * @param item The item to be removed
     * @returns `true` if it was included, `false` otherwise
     */
    remove(item: T) {
        if (this.locked) throw new Error("Cannot directly remove items from locked group.");

        const index = this.items.indexOf(item);
        if (index >= 0) {
            this.items.splice(index, 1);
            this.emit("remove", {
                item,
                group: this
            });
            return true;
        }
        return false;
    }

    /**
     * Removes all items from the group
     * @returns `true` if the group wasn't already empty, `false` otherwise
     */
    clear() {
        if (this.locked)throw new Error("Cannot directly remove items from locked group.");
        if (!this.count) return false;

        this.asArray.forEach(item => this.remove(item));
        return true;
    }

    /**
     * Generates a new copy of this group
     */
    clone() {
        return new Group(...this.asArray);
    }

    /**
     * Verifies whether or not a given item is included in the group
     */
    has(item: T) {
        return this.items.includes(item);
    }

    /**
     * Verifies whether or not all given items are included in the group
     */
    hasAll(...items: T[]) {
        for (const item of items) {
            if (!this.has(item)) return false;
        }
        return true;
    }

    /**
     * Verifies whether or not any of the given items are included in the group
     */
    hasAny(...items: T[]) {
        for (const item of items) {
            if (this.has(item)) return true;
        }
        return false;
    }

    /**
     * Verifies whether or not all given items are the only included in the group
     */
    hasOnly(...items: T[]) {
        const itemsWithoutDuplicates = items.reduce((array, currentItem) => {
            return array.includes(currentItem) ? array : [...array, currentItem]
        }, [] as T[]);

        return this.count === itemsWithoutDuplicates.length && this.hasAll(...items);
    }

    /**
     * Gets the amount of items in the group
     */
    get count() {
        return this.items.length;
    }

    /**
     * Is this group empty?
     */
    get empty() {
        return !this.count;
    }

    /**
     * Generates an array containing the items of this group
     */
    get asArray() {
        return [...this.items];
    }

    [Symbol.iterator]() {
        return this.asArray;
    }

    /**
     * Executes a function for each item in this group
     */
    get forEach() {
        return this.items.forEach.bind(this.items);
    }

    /**
     * Verifies if this group is locked. It's not possible to add or remove elements from locked groups.
     */
    public get locked() {
        return this._locked;
    }
    private _locked = false;

    /**
     * Prevents this group from being further altered
     */
    public lock() {
        this._locked = true;
        return this;
    }

    /**
     * Re-allows this group from being further altered
     */
    public unlock() {
        this._locked = false;
        return this;
    }

    /**
     * Given some other groups, creates a new group, containing only:
     * - Every item present in this group or in any of other groups
     * @param groups Some other groups
     * @returns The union of the groups.
     * The new group is reactive to changes on this and the other groups included, and therefore not directly editable.
     */
    or(...groups: Group<T>[]): Group<T> {
        return Group.union(this, ...groups);
    }

    /**
     * Given some other groups, creates a new group, containing only:
     * - Every item simutaneously present in this and all of other groups
     * @param group Some other groups
     * @returns The disjunctive union of the groups.
     * The new group is reactive to changes on this and the other groups included, and therefore not directly editable.
     */
    and(...groups: Group<T>[]): Group<T> {
        return Group.intersection(this, ...groups);
    }

    /**
     * Given some other groups, creates a new group, containing only:
     * - Every item present in this group, but missing in all other groups
     * @param group Some other groups
     * @returns The difference of this group and the others.
     * The new group is reactive to changes on this and the other groups included, and therefore not directly editable.
     */
    but(...groups: Group<T>[]): Group<T> {
        return Group.difference(this, ...groups);
    }

    /**
     * Given some other groups, creates a new group, containing only:
     * - Every item present only in this or any of the included groups, but missing in all ohters
     * @param group
     * @returns The disjunctive union of the groups.
     * The new group is reactive to changes on this and the other groups included, and therefore not directly editable.
     */
    xor(...groups: Group<T>[]): Group<T> {
        return Group.symmetricDifference(this, ...groups);
    }

    constructor(...items: T[]) {
        super();
        this.items.push(...items);

        this.on("add", () => {
            this.emit("change", {});
        });

        this.on("remove", () => {
            this.emit("change", {});
        });
    }

    /**
     * Empty group. Cannot be altered.
     */
    public static readonly empty = new Group<never>().lock();

    /**
     * Generates a new group from the union of other groups.
     * @param groups The groups to be included on the operation
     * @returns The union of the groups.
     * The new group is reactive to changes on the included groups, and therefore not directly editable.
     */
    static union<T>(...groups: Group<T>[]) {
        const newList = new Group<T>();

        function add({ item }: GroupEvents<T>["add"]) {
            newList.unlock();
            newList.add(item);
            newList.lock();
        }

        function remove({ item }: GroupEvents<T>["remove"]) {
            newList.unlock();
            for (const otherList of groups) {
                if (otherList.has(item)) return;
            }
            newList.remove(item);
            newList.lock();
        }

        for (const group of groups) {
            group.forEach(item => add({ item, group }));
            group.on("add", add);
            group.on("remove", remove);
        }

        newList.lock();
        return newList;
    }

    /**
     * Generates a new group from the intersection of other groups.
     * @param groups The groups to be included on the operation
     * @returns The intersection of the groups.
     * The new group is reactive to changes on the included groups, and therefore not directly editable.
     */
    static intersection<T>(...groups: Group<T>[]) {
        const newList = new Group<T>();

        function add({ item }: GroupEvents<T>["add"]) {
            newList.unlock();
            for (const otherList of groups) {
                if (!otherList.has(item)) return;
            }
            newList.add(item);
            newList.lock();
        }

        function remove({ item }: GroupEvents<T>["remove"]) {
            newList.unlock();
            newList.remove(item);
            newList.lock();
        }

        for (const group of groups) {
            group.forEach(item => add({ item, group }));
            group.on("add", add);
            group.on("remove", remove);
        }

        newList.lock();
        return newList;
    }

    /**
     * Generates a new group from the difference of a given group and other groups.
     * @param sourceGroup The group to be used as the basis for the operation
     * @param otherGroups The groups which elements you want to exclude from the final result
     * @returns The difference between the `sourceGroup` and the union of the `otherGroups`.
     * The new group is reactive to changes on the included groups, and therefore not directly editable.
     */
    static difference<T>(sourceGroup: Group<T>, ...otherGroups: Group<T>[]) {
        const unwanted = otherGroups.length > 1 ? Group.union(...otherGroups) : otherGroups[0];
        const newList = new Group<T>();

        function add({ item }: GroupEvents<T>["add"]) {
            newList.unlock();
            if (sourceGroup.has(item) && !unwanted.has(item)) {
                newList.add(item);
            }
            newList.lock();
        }

        function remove({ item }: GroupEvents<T>["remove"]) {
            newList.unlock();
            if (!sourceGroup.has(item) || unwanted.has(item)) {
                newList.remove(item);
            }
            newList.lock();
        }

        sourceGroup.forEach(item => add({ item, group: sourceGroup }));
        sourceGroup.on("add", add);
        sourceGroup.on("remove", remove);

        unwanted.forEach(item => remove({ item, group: unwanted }));
        unwanted.on("add", remove);
        unwanted.on("remove", add);

        newList.lock();
        return newList;
    }

    /**
     * Generates a new group from the symmetric difference of other groups.
     * @param groups The groups to be included on the operation
     * @returns The symmetric difference (union without intersection) of the groups.
     * The new group is reactive to changes on the included groups, and therefore not directly editable.
     */
    static symmetricDifference<T>(...groups: Group<T>[]) {
        return this.difference(this.union(...groups), this.intersection(...groups));
    }
}