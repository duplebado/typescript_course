import { User } from "./models/User";

const user = new User({ id: 1, name: "newer name", age: 909 });

user.events.on("change", () => {
    console.log(user);
});

user.events.on("save", () => {
    console.log("saved user");
});

user.save();
