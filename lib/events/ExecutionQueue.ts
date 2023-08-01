/**
 * Class used for delaying and ordering execution of a certain function and storing its calls' parameters into a queue
 */
export class ExecutionQueue<T extends (...args: any[]) => any = (...args: any[]) => any> {
    constructor (public readonly method: T, public readonly items: Parameters<T>[] = []) {}

    /**
     * Is this queue empty?
     */
    public get empty() {
        return !this.items.length;
    }

    /**
     * The amount of function calls waiting on queue
     */
    public get length() {
        return this.items.length;
    }

    /**
     * Adds a new function call to the end of the queue
     */
    public add(...parameters: Parameters<T>) {
        this.items.push(parameters);
    }

    /**
     * Removes all function calls from the queue
     */
    public clear() {
        this.items.splice(0, this.items.length);
    }

    /**
     * Executes the first function call and removes it from the queue
     * @returns The returned value of the method
     */
    public next() {
        const firstItem = this.items.shift();
        if (firstItem) return this.method(firstItem) as ReturnType<T>|void;
    }

    /**
     * Executes this queue's method on all items, from start to finish, clearing the queue
     * @returns An array containing the returned values mapped for each function call on the queue
     */
    public run() {
        const returnedValues: (ReturnType<T>|void)[] = [];

        while (!this.empty) {
            returnedValues.unshift(this.next());
        }

        return returnedValues;
    }
}