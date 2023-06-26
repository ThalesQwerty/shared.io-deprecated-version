/**
 * Class used for delaying execution of a certain method and storing its callings' parameters into a queue
 */
export class ExecutionQueue<Parameters = any, ReturnType = void> {
    constructor (public readonly method: (item: Parameters) => ReturnType, public readonly items: Parameters[] = []) {}

    public get empty() {
        return !this.items.length;
    }

    /**
     * Adds a new item to the end of the queue
     */
    public add(...newItems: Parameters[]) {
        this.items.push(...newItems);
    }

    /**
     * Removes all items from the queue
     */
    public clear() {
        this.items.splice(0, this.items.length);
    }

    /**
     * Executes this queue's method on the first item and removes it from the queue
     * @returns The returned value of the method
     */
    public next(): ReturnType|void {
        const firstItem = this.items.shift();
        if (firstItem) return this.method(firstItem);
    }

    /**
     * Executes this queue's method on all items, from start to finish, clearing the queue
     * @returns An array containing the returned value mapped for each item on the queue
     */
    public execute(): (ReturnType|void)[] {
        const returnedValues: (ReturnType|void)[] = [];

        while (!this.empty) {
            returnedValues.unshift(this.next());
        }

        return returnedValues;
    }
}