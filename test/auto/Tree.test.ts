import { Tree, TreeNode } from "../../lib/utils";

describe("Tree", () => {
    test("Root", () => {
        const tree = new Tree(0);

        expect(tree.root.value).toBe(0);
        expect(tree.find("")).toBe(tree.root);
        expect(tree.get("")).toBe(0);
        expect(tree.set("", 1)).toBe(1);
        expect(tree.root.value).toBe(1);
        expect(tree.get("")).toBe(1);
        expect(tree.remove("")).toBeUndefined();
        expect(Object.keys(tree.root.children)).toHaveLength(0);
    });

    test("Children", () => {
        const tree = new Tree(0);

        tree.set("a.b.c", 5);
        tree.set("a", 1);

        expect(tree.get("a.b.c")).toBe(5);
        expect(Object.keys(tree.find("a.b.c")!.children)).toHaveLength(0);

        expect(tree.get("a.b")).toBeUndefined();
        expect(tree.find("a.b")).toBeTruthy();
        expect(Object.keys(tree.find("a.b")!.children)).toHaveLength(1);

        expect(tree.find("a.x")).toBeUndefined();

        expect(tree.get("a")).toBe(1);
        expect(tree.find("a")).toBeTruthy();
        expect(Object.keys(tree.find("a")!.children)).toHaveLength(1);

        expect(tree.find("y")).toBeUndefined();

        expect(Object.keys(tree.root.children)).toHaveLength(1);
    });

    test("Siblings", () => {
        const tree = new Tree(0);

        tree.set("a.b.c", 5);
        tree.set("a.n.m", 2);
        tree.set("a.n", 7);

        tree.set("x.y.z", 1);
        tree.set("x.y.w", -1);

        expect(tree.get("a.b.c")).toBe(5);
        expect(Object.keys(tree.find("a.b.c")!.children)).toHaveLength(0);

        expect(tree.get("a.b")).toBeUndefined();
        expect(tree.find("a.b")).toBeTruthy();
        expect(Object.keys(tree.find("a.b")!.children)).toHaveLength(1);

        expect(tree.get("a.n")).toBe(7);
        expect(Object.keys(tree.find("a.n")!.children)).toHaveLength(1);

        expect(tree.get("a.n.m")).toBe(2);
        expect(Object.keys(tree.find("a.n.m")!.children)).toHaveLength(0);

        expect(tree.get("a")).toBeUndefined();
        expect(tree.find("a")).toBeTruthy();
        expect(Object.keys(tree.find("a")!.children)).toHaveLength(2);

        expect(tree.get("x.y.z")).toBe(1);
        expect(Object.keys(tree.find("x.y.z")!.children)).toHaveLength(0);

        expect(tree.get("x.y")).toBeUndefined();
        expect(tree.find("x.y")).toBeTruthy();
        expect(Object.keys(tree.find("x.y")!.children)).toHaveLength(2);

        expect(tree.get("x")).toBeUndefined();
        expect(tree.find("x")).toBeTruthy();
        expect(Object.keys(tree.find("x")!.children)).toHaveLength(1);

        expect(tree.get("x.y.w")).toBe(-1);
        expect(Object.keys(tree.find("x.y.w")!.children)).toHaveLength(0);

        expect(tree.get("x.y.i")).toBeUndefined();
        expect(tree.find("x.y.i")).toBeUndefined();

        expect(Object.keys(tree.root.children)).toHaveLength(2);
    });

    test("Find or append", () => {
        const tree = new Tree(0);
        tree.set("a", 5);

        const oldNode = tree.find("a");
        const newNode = new TreeNode(1);

        expect(oldNode).toBeDefined();
        expect(oldNode?.value).toBe(5);
        expect(tree.find("b")).toBeUndefined();
        expect(tree.findOrAppend("a", newNode)).toBe(oldNode);
        expect(tree.findOrAppend("b", newNode)).toBe(newNode);
        expect(tree.find("b")).toBe(newNode);
        expect(tree.get("b")).toBe(1);
    });
});