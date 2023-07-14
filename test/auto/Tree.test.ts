import { Tree } from "../../lib/utils";

describe("Tree", () => {
    test("Root", () => {
        const tree = new Tree<number>(0);

        expect(tree.root.value).toBe(0);
        expect(tree.node("")).toBe(tree.root);
        expect(tree.get("")).toBe(0);
        expect(tree.set("", 1)).toBe(1);
        expect(tree.get("")).toBe(1);
        expect(tree.unset("")).toBe(false);
        expect(Object.keys(tree.root.children)).toHaveLength(0);
    });

    test("Children", () => {
        const tree = new Tree<number>(0);

        tree.set("a.b.c", 5);
        tree.set("a", 1);

        expect(tree.get("a.b.c")).toBe(5);
        expect(Object.keys(tree.node("a.b.c").children)).toHaveLength(0);

        expect(tree.get("a.b")).toBeUndefined();
        expect(tree.node("a.b")).toBeTruthy();
        expect(Object.keys(tree.node("a.b").children)).toHaveLength(1);

        expect(tree.node("a.x")).toBeUndefined();

        expect(tree.get("a")).toBe(1);
        expect(tree.node("a")).toBeTruthy();
        expect(Object.keys(tree.node("a").children)).toHaveLength(1);

        expect(tree.node("y")).toBeUndefined();

        expect(Object.keys(tree.root.children)).toHaveLength(1);
    });

    test("Siblings", () => {
        const tree = new Tree<number>(0);

        tree.set("a.b.c", 5);
        tree.set("a.n.m", 2);
        tree.set("a.n", 7);

        tree.set("x.y.z", 1);
        tree.set("x.y.w", -1);

        expect(tree.get("a.b.c")).toBe(5);
        expect(Object.keys(tree.node("a.b.c").children)).toHaveLength(0);

        expect(tree.get("a.b")).toBeUndefined();
        expect(tree.node("a.b")).toBeTruthy();
        expect(Object.keys(tree.node("a.b").children)).toHaveLength(1);

        expect(tree.get("a.n")).toBe(7);
        expect(Object.keys(tree.node("a.n").children)).toHaveLength(1);

        expect(tree.get("a.n.m")).toBe(2);
        expect(Object.keys(tree.node("a.n.m").children)).toHaveLength(0);

        expect(tree.get("a")).toBeUndefined();
        expect(tree.node("a")).toBeTruthy();
        expect(Object.keys(tree.node("a").children)).toHaveLength(2);

        expect(tree.get("x.y.z")).toBe(1);
        expect(Object.keys(tree.node("x.y.z").children)).toHaveLength(0);

        expect(tree.get("x.y")).toBeUndefined();
        expect(tree.node("x.y")).toBeTruthy();
        expect(Object.keys(tree.node("x.y").children)).toHaveLength(2);

        expect(tree.get("x")).toBeUndefined();
        expect(tree.node("x")).toBeTruthy();
        expect(Object.keys(tree.node("x").children)).toHaveLength(1);

        expect(tree.get("x.y.w")).toBe(-1);
        expect(Object.keys(tree.node("x.y.w").children)).toHaveLength(0);

        expect(tree.get("x.y.i")).toBeUndefined();
        expect(tree.node("x.y.i")).toBeUndefined();

        expect(Object.keys(tree.root.children)).toHaveLength(2);
    });
});