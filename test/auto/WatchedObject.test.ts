import { ObjectWatcher, WatchedObject, WatchedObjectEvents } from "../../lib/utils";

describe("WatchedObject", () => {
    describe("Properties", () => {
        describe("Primitives", () => {
            const { proxy: object } = new WatchedObject({
                a: 42,
                b: "test",
                c: false,
                d: null,
                e: undefined
            });

            test("Initial assignment", () => {
                expect(object).toBeInstanceOf(Object);
                expect(object.a).toBe(42);
                expect(object.b).toBe("test");
                expect(object.c).toBe(false);
                expect(object.d).toBe(null);
                expect(object.e).toBe(undefined);
                expect(object).toHaveProperty("d");
                expect(object).toHaveProperty("e");
                expect(object).not.toHaveProperty("f");
            });

            test("Reassign property", () => {
                object.a++;
                object.b = "";
                object.c = true;

                expect(object).toBeInstanceOf(Object);
                expect(object.a).toBe(43);
                expect(object.b).toBe("");
                expect(object.c).toBe(true);
                expect(object.d).toBe(null);
                expect(object.e).toBe(undefined);
                expect(object).toHaveProperty("d");
                expect(object).toHaveProperty("e");
                expect(object).not.toHaveProperty("f");
            });

            test("Assign new property", () => {
                (object as any).f = 0;

                expect(object).toBeInstanceOf(Object);
                expect(object).toHaveProperty("d");
                expect(object).toHaveProperty("e");
                expect(object).toHaveProperty("f");
            });

            test("Delete property", () => {
                delete (object as any).a;
                delete (object as any).d;

                expect(object).toBeInstanceOf(Object);
                expect(object).not.toHaveProperty("a");
                expect(object).toHaveProperty("b");
                expect(object).toHaveProperty("c");
                expect(object).not.toHaveProperty("d");
                expect(object).toHaveProperty("e");
                expect(object).toHaveProperty("f");
            });
        });

        describe("Objects", () => {

            const { proxy: object } = new WatchedObject({
                x: {
                    a: 42,
                    b: "test",
                    c: false,
                },
                y: {
                    d: null,
                    e: undefined
                },
                z: {
                    p: {
                        n: 0,
                        m: "1",
                        q: {
                            i: true
                        }
                    },
                },
                w: {}
            });

            test("Initial assignment", () => {
                expect(object.x).toBeInstanceOf(Object);
                expect(object.x.a).toBe(42);
                expect(object.x.b).toBe("test");
                expect(object.x.c).toBe(false);

                expect(object.y).toBeInstanceOf(Object);
                expect(object.y.d).toBe(null);
                expect(object.y.e).toBe(undefined);

                expect(object.z).toBeInstanceOf(Object);

                expect(object.z.p).toBeInstanceOf(Object);
                expect(object.z.p.n).toBe(0);
                expect(object.z.p.m).toBe("1");

                expect(object.z.p.q).toBeInstanceOf(Object);
                expect(object.z.p.q.i).toBe(true);

                expect(object.w).toBeInstanceOf(Object);
            });

            test("Reassign properties", () => {
                object.x.a++;
                object.x.b = "";
                object.x.c = true;

                expect(object.x).toBeInstanceOf(Object);
                expect(object.x.a).toBe(43);
                expect(object.x.b).toBe("");
                expect(object.x.c).toBe(true);
            });

            test("Reassign sub-properties", () => {
                object.z.p.m += "2";
                object.z.p.n--;
                object.z.p.q.i = false;

                expect(object.z).toBeInstanceOf(Object);
                expect(object.z.p).toBeInstanceOf(Object);
                expect(object.z.p.m).toBe("12");
                expect(object.z.p.n).toBe(-1);
                expect(object.z.p.q).toBeInstanceOf(Object);
                expect(object.z.p.q.i).toBe(false);
            });

            test("Delete sub-properties", () => {
                expect(object).toHaveProperty("x");
                expect(object).toHaveProperty("y");
                expect(object).toHaveProperty("z");
                expect(object).toHaveProperty("w");

                delete (object as any).w;

                expect(object).toHaveProperty("x");
                expect(object).toHaveProperty("y");
                expect(object).toHaveProperty("z");
                expect(object).not.toHaveProperty("w");
            });

            test("Reassign sub-objects", () => {
                expect(object.x).toBeInstanceOf(Object);
                expect(object.x).toHaveProperty("a");
                expect(object.x).toHaveProperty("b");
                expect(object.x).toHaveProperty("c");
                expect(object.x).not.toHaveProperty("u");

                (object as any).x = {
                    u: "hello"
                }

                expect(object.x).not.toHaveProperty("a");
                expect(object.x).not.toHaveProperty("b");
                expect(object.x).not.toHaveProperty("c");
                expect(object.x).toHaveProperty("u");
                expect((object as any).x.u).toBe("hello");
            });
        });

        describe("Arrays", () => {
            const { proxy: object } = new WatchedObject({
                arr: [0]
            });

            test("Initial assignment", () => {
                expect(object.arr).toBeInstanceOf(Array);
                expect(object.arr[0]).toBe(0);
                expect(object.arr[1]).toBeUndefined();
                expect(object.arr).toHaveLength(1);
            })

            test("Array changing methods", () => {
                object.arr.push(1, 2);

                expect(object.arr).toBeInstanceOf(Array);
                expect(object.arr[0]).toBe(0);
                expect(object.arr[1]).toBe(1);
                expect(object.arr[2]).toBe(2);
                expect(object.arr).toHaveLength(3);

                object.arr.unshift(-2, -1);

                expect(object.arr).toBeInstanceOf(Array);
                expect(object.arr[0]).toBe(-2);
                expect(object.arr[1]).toBe(-1);
                expect(object.arr[2]).toBe(0);
                expect(object.arr[3]).toBe(1);
                expect(object.arr[4]).toBe(2);
                expect(object.arr).toHaveLength(5);

                object.arr.pop();
                object.arr.shift();

                expect(object.arr).toBeInstanceOf(Array);
                expect(object.arr[0]).toBe(-1);
                expect(object.arr[1]).toBe(0);
                expect(object.arr[2]).toBe(1);
                expect(object.arr).toHaveLength(3);

                object.arr.reverse();

                expect(object.arr).toBeInstanceOf(Array);
                expect(object.arr[0]).toBe(1);
                expect(object.arr[1]).toBe(0);
                expect(object.arr[2]).toBe(-1);
                expect(object.arr).toHaveLength(3);

                object.arr.splice(1, 1);

                expect(object.arr).toBeInstanceOf(Array);
                expect(object.arr[0]).toBe(1);
                expect(object.arr[1]).toBe(-1);
                expect(object.arr).toHaveLength(2);

                object.arr.sort();

                expect(object.arr).toBeInstanceOf(Array);

                expect(object.arr[0]).toBe(-1);
                expect(object.arr[1]).toBe(1);
                expect(object.arr).toHaveLength(2);
            });

            test("Assign indexes", () => {
                object.arr[0] = 42;
                object.arr[1] = -42;

                expect(object.arr).toBeInstanceOf(Array);
                expect(object.arr[0]).toBe(42);
                expect(object.arr[1]).toBe(-42);
                expect(object.arr).toHaveLength(2);
            });

            test("Reassignment", () => {
                object.arr = [1, 2, 4, 8, 16, 32, 64, 128];

                expect(object.arr).toBeInstanceOf(Array);
                expect(object.arr[0]).toBe(1);
                expect(object.arr[1]).toBe(2);
                expect(object.arr[2]).toBe(4);
                expect(object.arr[3]).toBe(8);
                expect(object.arr[4]).toBe(16);
                expect(object.arr[5]).toBe(32);
                expect(object.arr[6]).toBe(64);
                expect(object.arr[7]).toBe(128);
                expect(object.arr).toHaveLength(8);
            });
        });
    });

    describe("Events", () => {
        describe("Write", () => {
            type PrimitiveTestObject = {
                a: number,
                b: string,
                c: boolean,
                x: Record<string, any>,
                y: any[]
            };

            let watchedObject: WatchedObject<PrimitiveTestObject>;
            let object: PrimitiveTestObject;
            let watcher: ObjectWatcher;

            const firedEvents: WatchedObjectEvents["write"][] = [];

            beforeEach(() => {
                watchedObject = new WatchedObject({
                    a: 2,
                    b: "test",
                    c: true,
                    x: {
                        p: 0,
                        q: 1,
                        z: {
                            w: {
                                i: 2
                            }
                        }
                    },
                    y: [0]
                });
                object = watchedObject.proxy;
                watcher = watchedObject.watcher;

                watcher.on("write", event => {
                    firedEvents.push(event);
                });
            });

            afterEach(() => {
                watcher.removeAllListeners("write");
                firedEvents.splice(0, firedEvents.length);
            });

            describe("Primitives", () => {
                test("Changed", () => {
                    object.a ++;
                    object.b = "hello world";
                    object.c = false;

                    expect(firedEvents[0].key).toBe("a");
                    expect(firedEvents[0].newValue).toBe(3);
                    expect(firedEvents[0].oldValue).toBe(2);

                    expect(firedEvents[1].key).toBe("b");
                    expect(firedEvents[1].newValue).toBe("hello world");
                    expect(firedEvents[1].oldValue).toBe("test");

                    expect(firedEvents[2].key).toBe("c");
                    expect(firedEvents[2].newValue).toBe(false);
                    expect(firedEvents[2].oldValue).toBe(true);
                });

                test("Unchanged", () => {
                    object.a = 2
                    object.b = "test";
                    object.c = true;

                    expect(firedEvents[0].key).toBe("a");
                    expect(firedEvents[0].newValue).toBe(2);
                    expect(firedEvents[0].oldValue).toBe(2);

                    expect(firedEvents[1].key).toBe("b");
                    expect(firedEvents[1].newValue).toBe("test");
                    expect(firedEvents[1].oldValue).toBe("test");

                    expect(firedEvents[2].key).toBe("c");
                    expect(firedEvents[2].newValue).toBe(true);
                    expect(firedEvents[2].oldValue).toBe(true);
                });
            });

            describe("Objects", () => {
                test("Reassignment", () => {
                    object.x = {
                        i: 2
                    };

                    expect(firedEvents[0].key).toBe("x");

                    expect(firedEvents[0].newValue).not.toHaveProperty("p");
                    expect(firedEvents[0].newValue).not.toHaveProperty("q");
                    expect(firedEvents[0].newValue).toHaveProperty("i");
                    expect((firedEvents[0].newValue as any).i).toBe(2);

                    expect(firedEvents[0].oldValue).toHaveProperty("p");
                    expect(firedEvents[0].oldValue).toHaveProperty("q");
                    expect(firedEvents[0].oldValue).not.toHaveProperty("i");
                    expect((firedEvents[0].oldValue as any).p).toBe(0);
                    expect((firedEvents[0].oldValue as any).q).toBe(1);
                });

                test("Property assignment", () => {
                    object.x.p = 2;
                    object.x.z.w.i = 5;

                    expect(firedEvents[0].key).toBe("x.p");
                    expect(firedEvents[0].newValue).toBe(2);
                    expect(firedEvents[0].oldValue).toBe(0);

                    expect(firedEvents[1].key).toBe("x.z.w.i");
                    expect(firedEvents[1].newValue).toBe(5);
                    expect(firedEvents[1].oldValue).toBe(2);
                });

                test("Disable old proxies", () => {
                    const old = object.x;

                    object.x = {
                        i: 2
                    };

                    object.x.i = 3;

                    expect(firedEvents).toHaveLength(2);
                    expect(firedEvents[1].key).toBe("x.i");
                    expect(firedEvents[1].newValue).toBe(3);
                    expect(firedEvents[1].oldValue).toBe(2);


                    old.p = 1;

                    expect(firedEvents).toHaveLength(2);
                });
            });

            describe("Arrays", () => {
                test("Reassignment", () => {
                    object.y = [1, 2, 3];

                    expect(firedEvents[0].key).toBe("y");

                    expect((firedEvents[0].newValue as any[])).toHaveLength(3);
                    expect((firedEvents[0].newValue as any[])[0]).toBe(1);
                    expect((firedEvents[0].newValue as any[])[1]).toBe(2);
                    expect((firedEvents[0].newValue as any[])[2]).toBe(3);

                    expect((firedEvents[0].oldValue as any[])).toHaveLength(1);
                    expect((firedEvents[0].oldValue as any[])[0]).toBe(0);
                    expect((firedEvents[0].oldValue as any[])[1]).toBeUndefined();
                    expect((firedEvents[0].oldValue as any[])[2]).toBeUndefined();
                });

                test("Push", () => {
                    object.y.push(1);

                    expect(firedEvents[0].key).toBe("y.1");
                    expect(firedEvents[0].newValue).toBe(1);
                    expect(firedEvents[0].oldValue).toBeUndefined();

                    expect(firedEvents[1].key).toBe("y.length");
                    expect(firedEvents[1].newValue).toBe(2);
                    expect(firedEvents[1].oldValue).toBe(1);

                    expect(firedEvents).toHaveLength(2);
                });

                test("Index assignment", () => {
                    object.y[0] = 5;

                    expect(firedEvents[0].key).toBe("y.0");
                    expect(firedEvents[0].newValue).toBe(5);
                    expect(firedEvents[0].oldValue).toBe(0);

                    expect(firedEvents).toHaveLength(1);
                });
            })
        });

        describe("Delete", () => {
            const { proxy: object, watcher } = new WatchedObject({
                a: 2,
                b: 3,
                c: 5,
                x: {
                    y: {
                        z: {
                            w: 3
                        },
                        i: 0
                    }
                }
            });

            const firedEvents: WatchedObjectEvents["delete"][] = [];

            beforeEach(() => {
                watcher.on("delete", event => {
                    firedEvents.push(event);
                });
            });

            afterEach(() => {
                watcher.removeAllListeners("delete");
                firedEvents.splice(0, firedEvents.length);
            });

            test("First-level properties", () => {
                delete (object as any).a;
                delete (object as any).b;
                delete (object as any).c;

                expect(firedEvents[0].key).toBe("a");
                expect(firedEvents[0].oldValue).toBe(2);

                expect(firedEvents[1].key).toBe("b");
                expect(firedEvents[1].oldValue).toBe(3);

                expect(firedEvents[2].key).toBe("c");
                expect(firedEvents[2].oldValue).toBe(5);

                expect(firedEvents).toHaveLength(3);
            });

            test("Deep properties", () => {
                delete (object as any).x.y.z.w;
                delete (object as any).x.y.z;
                delete (object as any).x;

                expect(firedEvents[0].key).toBe("x.y.z.w");
                expect(firedEvents[0].oldValue).toBe(3);

                expect(firedEvents[1].key).toBe("x.y.z");
                expect(firedEvents[1].oldValue).toBeInstanceOf(Object);
                // expect(firedEvents[1].oldValue).not.toHaveProperty("w");

                expect(firedEvents[2].key).toBe("x");
                expect(firedEvents[2].oldValue).toBeInstanceOf(Object);
                expect(firedEvents[2].oldValue).toHaveProperty("y");
                expect((firedEvents[2].oldValue as any).y).toBeInstanceOf(Object);
                expect((firedEvents[2].oldValue as any).y).toHaveProperty("i");
                expect((firedEvents[2].oldValue as any).y.i).toBe(0);
                // expect((firedEvents[2].oldValue as any).y).not.toHaveProperty("z");

                expect(firedEvents).toHaveLength(3);
            });
        });
    })
});