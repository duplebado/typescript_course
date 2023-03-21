import { User } from "./models/User";

const user = User.buildUser({ id: 1, name: "Ajanlekoko" });

user.on("change", () => {
    console.log("change event occured", user);
});

user.on("save", () => {
    console.log("saved event occured");
});

user.fetch();
