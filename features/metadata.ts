import "reflect-metadata";

const plane = {
    color: "red",
};

Reflect.defineMetadata("note", "hi there", plane);

const plane2 = plane;

console.log(Reflect.getMetadata("note", plane2));
