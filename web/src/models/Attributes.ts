export class Attributes<T extends object> {
    constructor(private data: T) {}

    get<K extends keyof T>(key: K): T[K] {
        console.log("this", this.data);
        return this.data[key];
    }

    set(update: T): void {
        Object.assign(this.data, update);
    }

    getAll(): T {
        console.log(this.data);
        return this.data;
    }
}
