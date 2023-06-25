export class Debouncer<ParameterType = any, ReturnType = any> {
    private readonly queue: ParameterType[] = [];

    constructor (public readonly method: (parameters: ParameterType[]) => ReturnType) {}

    call (parameter: ParameterType) {
        if (!this.queue.length) {
            process.nextTick(() => {
                this.method([...this.queue]);
                this.queue.splice(0, this.queue.length);
            })
        }

        this.queue.push(parameter);
    }
}