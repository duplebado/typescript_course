import { Collection } from "../models/Collection";

export abstract class CollectionView<T, K> {
    constructor(public parent, public collection: Collection<T, K>) {}

    abstract renderitem(model: T, itemParent: Element): void;

    render(): void {
        this.parent.innerHTML = "";

        const templateElement = document.createElement("template");

        for (let model of this.collection.models) {
            const itemParent = document.createElement("div");
            this.renderitem(model, itemParent);
            templateElement.content.append(itemParent);
        }

        this.parent.append(templateElement.content);
    }
}
