import { WatchedObject } from "../../lib/utils/WatchedObject";

const obj = new WatchedObject({
    a: 2,
    b: 3,
    c: 5,
    obj: {
        key: 0
    },
    arr: [] as any[]
});

obj.on("write", ({ key, oldValue, newValue }) => {
    console.log(`WRITE ${key}: ${oldValue} -> ${newValue}`);
});

obj.on("change", ({ diff }) => {
    console.log("CHANGE", diff);
});

obj.a = 0;
obj.b = 1;
obj.obj.key = 5;
obj.obj = null as any;
obj.arr.push(1);
