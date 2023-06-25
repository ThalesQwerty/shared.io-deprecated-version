import { WatchedObject, WatchedObjectEvents } from "../../lib/utils";

describe("WatchedObject", () => {
    describe("Properties", () => {
        describe("Primitives", () => {
            const obj = new WatchedObject({
                a: 42,
                b: "test",
                c: false,
                d: null,
                e: undefined
            });

            test("Initial assignment", () => {
                expect(obj).toBeInstanceOf(Object);
                expect(obj.a).toBe(42);
                expect(obj.b).toBe("test");
                expect(obj.c).toBe(false);
                expect(obj.d).toBe(null);
                expect(obj.e).toBe(undefined);
                expect(obj).toHaveProperty("d");
                expect(obj).toHaveProperty("e");
                expect(obj).not.toHaveProperty("f");
            });

            test("Reassign property", () => {
                obj.a++;
                obj.b = "";
                obj.c = true;

                expect(obj).toBeInstanceOf(Object);
                expect(obj.a).toBe(43);
                expect(obj.b).toBe("");
                expect(obj.c).toBe(true);
                expect(obj.d).toBe(null);
                expect(obj.e).toBe(undefined);
                expect(obj).toHaveProperty("d");
                expect(obj).toHaveProperty("e");
                expect(obj).not.toHaveProperty("f");
            });

            test("Assign new property", () => {
                (obj as any).f = 0;

                expect(obj).toBeInstanceOf(Object);
                expect(obj).toHaveProperty("d");
                expect(obj).toHaveProperty("e");
                expect(obj).toHaveProperty("f");
            });

            test("Delete property", () => {
                delete (obj as any).a;
                delete (obj as any).d;

                expect(obj).toBeInstanceOf(Object);
                expect(obj).not.toHaveProperty("a");
                expect(obj).toHaveProperty("b");
                expect(obj).toHaveProperty("c");
                expect(obj).not.toHaveProperty("d");
                expect(obj).toHaveProperty("e");
                expect(obj).toHaveProperty("f");
            });
        });

        describe("Objects", () => {

            const obj = new WatchedObject({
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
                expect(obj.x).toBeInstanceOf(Object);
                expect(obj.x.a).toBe(42);
                expect(obj.x.b).toBe("test");
                expect(obj.x.c).toBe(false);

                expect(obj.y).toBeInstanceOf(Object);
                expect(obj.y.d).toBe(null);
                expect(obj.y.e).toBe(undefined);

                expect(obj.z).toBeInstanceOf(Object);

                expect(obj.z.p).toBeInstanceOf(Object);
                expect(obj.z.p.n).toBe(0);
                expect(obj.z.p.m).toBe("1");

                expect(obj.z.p.q).toBeInstanceOf(Object);
                expect(obj.z.p.q.i).toBe(true);

                expect(obj.w).toBeInstanceOf(Object);
            });

            test("Reassign properties", () => {
                obj.x.a++;
                obj.x.b = "";
                obj.x.c = true;

                expect(obj.x).toBeInstanceOf(Object);
                expect(obj.x.a).toBe(43);
                expect(obj.x.b).toBe("");
                expect(obj.x.c).toBe(true);
            });

            test("Reassign sub-properties", () => {
                obj.z.p.m += "2";
                obj.z.p.n--;
                obj.z.p.q.i = false;

                expect(obj.z).toBeInstanceOf(Object);
                expect(obj.z.p).toBeInstanceOf(Object);
                expect(obj.z.p.m).toBe("12");
                expect(obj.z.p.n).toBe(-1);
                expect(obj.z.p.q).toBeInstanceOf(Object);
                expect(obj.z.p.q.i).toBe(false);
            });

            test("Delete sub-properties", () => {
                expect(obj).toHaveProperty("x");
                expect(obj).toHaveProperty("y");
                expect(obj).toHaveProperty("z");
                expect(obj).toHaveProperty("w");

                delete (obj as any).w;

                expect(obj).toHaveProperty("x");
                expect(obj).toHaveProperty("y");
                expect(obj).toHaveProperty("z");
                expect(obj).not.toHaveProperty("w");
            });

            test("Reassign sub-objects", () => {
                expect(obj.x).toBeInstanceOf(Object);
                expect(obj.x).toHaveProperty("a");
                expect(obj.x).toHaveProperty("b");
                expect(obj.x).toHaveProperty("c");
                expect(obj.x).not.toHaveProperty("u");

                (obj as any).x = {
                    u: "hello"
                }

                expect(obj.x).not.toHaveProperty("a");
                expect(obj.x).not.toHaveProperty("b");
                expect(obj.x).not.toHaveProperty("c");
                expect(obj.x).toHaveProperty("u");
                expect((obj as any).x.u).toBe("hello");
            });
        });

        describe("Arrays", () => {
            const obj = new WatchedObject({
                arr: [0]
            });

            test("Initial assignment", () => {
                expect(obj.arr).toBeInstanceOf(Array);
                expect(obj.arr[0]).toBe(0);
                expect(obj.arr[1]).toBeUndefined();
                expect(obj.arr).toHaveLength(1);
            })

            test("Array changing methods", () => {
                obj.arr.push(1, 2);

                expect(obj.arr).toBeInstanceOf(Array);
                expect(obj.arr[0]).toBe(0);
                expect(obj.arr[1]).toBe(1);
                expect(obj.arr[2]).toBe(2);
                expect(obj.arr).toHaveLength(3);

                obj.arr.unshift(-2, -1);

                expect(obj.arr).toBeInstanceOf(Array);
                expect(obj.arr[0]).toBe(-2);
                expect(obj.arr[1]).toBe(-1);
                expect(obj.arr[2]).toBe(0);
                expect(obj.arr[3]).toBe(1);
                expect(obj.arr[4]).toBe(2);
                expect(obj.arr).toHaveLength(5);

                obj.arr.pop();
                obj.arr.shift();

                expect(obj.arr).toBeInstanceOf(Array);
                expect(obj.arr[0]).toBe(-1);
                expect(obj.arr[1]).toBe(0);
                expect(obj.arr[2]).toBe(1);
                expect(obj.arr).toHaveLength(3);

                obj.arr.reverse();

                expect(obj.arr).toBeInstanceOf(Array);
                expect(obj.arr[0]).toBe(1);
                expect(obj.arr[1]).toBe(0);
                expect(obj.arr[2]).toBe(-1);
                expect(obj.arr).toHaveLength(3);

                obj.arr.splice(1, 1);

                expect(obj.arr).toBeInstanceOf(Array);
                expect(obj.arr[0]).toBe(1);
                expect(obj.arr[1]).toBe(-1);
                expect(obj.arr).toHaveLength(2);

                obj.arr.sort();

                expect(obj.arr).toBeInstanceOf(Array);

                expect(obj.arr[0]).toBe(-1);
                expect(obj.arr[1]).toBe(1);
                expect(obj.arr).toHaveLength(2);
            });

            test("Assign indexes", () => {
                obj.arr[0] = 42;
                obj.arr[1] = -42;

                expect(obj.arr).toBeInstanceOf(Array);
                expect(obj.arr[0]).toBe(42);
                expect(obj.arr[1]).toBe(-42);
                expect(obj.arr).toHaveLength(2);
            });

            test("Reassignment", () => {
                obj.arr = [1, 2, 4, 8, 16, 32, 64, 128];

                expect(obj.arr).toBeInstanceOf(Array);
                expect(obj.arr[0]).toBe(1);
                expect(obj.arr[1]).toBe(2);
                expect(obj.arr[2]).toBe(4);
                expect(obj.arr[3]).toBe(8);
                expect(obj.arr[4]).toBe(16);
                expect(obj.arr[5]).toBe(32);
                expect(obj.arr[6]).toBe(64);
                expect(obj.arr[7]).toBe(128);
                expect(obj.arr).toHaveLength(8);
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

            let obj: WatchedObject<PrimitiveTestObject>;

            const firedEvents: WatchedObjectEvents["write"][] = [];

            beforeEach(() => {
                obj = new WatchedObject({
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
                obj.on("write", event => {
                    firedEvents.push(event);
                });
            });

            afterEach(() => {
                obj.removeAllListeners("write");
                firedEvents.splice(0, firedEvents.length);
            });

            describe("Primitives", () => {
                test("Changed", () => {
                    obj.a ++;
                    obj.b = "hello world";
                    obj.c = false;

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
                    obj.a = 2
                    obj.b = "test";
                    obj.c = true;

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
                    obj.x = {
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
                    obj.x.p = 2;
                    obj.x.z.w.i = 5;

                    expect(firedEvents[0].key).toBe("x.p");
                    expect(firedEvents[0].newValue).toBe(2);
                    expect(firedEvents[0].oldValue).toBe(0);

                    expect(firedEvents[1].key).toBe("x.z.w.i");
                    expect(firedEvents[1].newValue).toBe(5);
                    expect(firedEvents[1].oldValue).toBe(2);
                });

                test("Disable old proxies", () => {
                    const old = obj.x;

                    obj.x = {
                        i: 2
                    };

                    obj.x.i = 3;

                    expect(firedEvents[1].key).toBe("x.i");
                    expect(firedEvents[1].newValue).toBe(3);
                    expect(firedEvents[1].oldValue).toBe(2);
                    expect(firedEvents).toHaveLength(2);

                    old.p = 1;

                    expect(firedEvents).toHaveLength(2);
                });
            });

            describe("Arrays", () => {
                test("Reassignment", () => {
                    obj.y = [1, 2, 3];

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
                    obj.y.push(1);

                    expect(firedEvents[0].key).toBe("y.1");
                    expect(firedEvents[0].newValue).toBe(1);
                    expect(firedEvents[0].oldValue).toBeUndefined();

                    expect(firedEvents[1].key).toBe("y.length");
                    expect(firedEvents[1].newValue).toBe(2);
                    expect(firedEvents[1].oldValue).toBe(1);

                    expect(firedEvents).toHaveLength(2);
                });

                test("Index assignment", () => {
                    obj.y[0] = 5;

                    expect(firedEvents[0].key).toBe("y.0");
                    expect(firedEvents[0].newValue).toBe(5);
                    expect(firedEvents[0].oldValue).toBe(0);

                    expect(firedEvents).toHaveLength(1);
                });
            })
        });

        describe("Delete", () => {
            const obj = new WatchedObject({
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

            const firedEvents: WatchedObjectEvents["deleteKey"][] = [];

            beforeEach(() => {
                obj.on("deleteKey", event => {
                    firedEvents.push(event);
                });
            });

            afterEach(() => {
                obj.removeAllListeners("deleteKey");
                firedEvents.splice(0, firedEvents.length);
            });

            test("First-level properties", () => {
                delete (obj as any).a;
                delete (obj as any).b;
                delete (obj as any).c;

                expect(firedEvents[0].key).toBe("a");
                expect(firedEvents[0].oldValue).toBe(2);

                expect(firedEvents[1].key).toBe("b");
                expect(firedEvents[1].oldValue).toBe(3);

                expect(firedEvents[2].key).toBe("c");
                expect(firedEvents[2].oldValue).toBe(5);

                expect(firedEvents).toHaveLength(3);
            });

            test("Deep properties", () => {
                delete (obj as any).x.y.z.w;
                delete (obj as any).x.y.z;
                delete (obj as any).x;

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