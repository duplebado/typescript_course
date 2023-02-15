import { User } from "./models/User";

const user = new User({});

user.set({ name: "saka", age: 80 });
user.save();
