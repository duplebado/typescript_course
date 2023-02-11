import { NumbersCollection } from "./NumbersCollection";
import { CharactersCollection } from "./CharactersCollection";
import { LinkedList } from "./LinkedList";

const characters = new CharactersCollection("XaabZZkl");
const numbers = new NumbersCollection([10, 3, -5, 0]);
const linkedList = new LinkedList();
linkedList.add(500);
linkedList.add(-10);
linkedList.add(-3);
linkedList.add(4);
linkedList.add(68);

characters.sort();
numbers.sort();
linkedList.sort();

console.log("characters => ", characters.data);
console.log("numbers => ", numbers.data);
console.log("\n=====");
console.log("linkedList => ");
linkedList.print();
console.log("=====\n");
