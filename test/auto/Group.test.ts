import { Group } from "../../lib/utils";

describe("Group", () => {
    test("Class methods", () => {
        const group = new Group(1, 2, 3);
        const array: typeof group.array = [];

        expect(group).toBeTruthy();
        expect(group.array).toEqual([1, 2, 3]);
        expect(group.count).toBe(3);
        expect(group.has(0)).toBe(false);
        expect(group.has(1)).toBe(true);
        expect(group.has(2)).toBe(true);
        expect(group.has(3)).toBe(true);
        expect(group.has(4)).toBe(false);

        group.forEach(item => {
            array.push(item);
        });
        expect(array).toEqual(group.array);

        group.add(1);
        group.add(4);
        group.remove(2);

        expect(group).toBeTruthy();
        expect(group.array).toEqual([1, 3, 4]);
        expect(group.count).toBe(3);
    });

    test("Union", () => {
        const a = new Group(1, 2, 3);
        const b = new Group(3, 4, 5);
        const c = new Group(4, 5, 6, 7);
        const d = new Group(0, 3, 7);

        const x = a.or(b, c, d);

        expect(x.hasAll(...a.array)).toBe(true);
        expect(x.hasAll(...b.array)).toBe(true);
        expect(x.hasAll(...c.array)).toBe(true);
        expect(x.hasAll(...d.array)).toBe(true);
        expect(x.count).toBe(8);
        expect(x.hasOnly(0, 1, 2, 3, 4, 5, 6, 7)).toBe(true);

        a.clear();
        b.add(5);
        c.add(10);
        d.remove(0);

        expect(x.count).toBe(6);
        expect(x.hasOnly(3, 4, 5, 6, 7, 10)).toBe(true);
    });

    test("Intersection", () => {
        const a = new Group(1, 2, 3, 4, 5);
        const b = new Group(2, 3, 4, 5, 6);
        const c = new Group(3, 4, 5, 6, 7);
        const d = new Group(4, 5, 6, 7, 8);

        const x = a.and(b, c, d);

        expect(x.count).toBe(2);
        expect(x.hasOnly(4, 5)).toBe(true);

        a.add(6);
        d.add(3);

        expect(x.count).toBe(4);
        expect(x.hasOnly(3, 4, 5, 6)).toBe(true);

        b.remove(4);
        c.remove(5);

        expect(x.count).toBe(2);
        expect(x.hasOnly(3, 6)).toBe(true);
    });

    test("Difference", () => {
        const a = new Group(1, 2, 3, 4, 5, 6, 7, 8);
        const b = new Group(3, 4, 5);

        const x = a.but(b);

        expect(x.hasAny(...b.array)).toBe(false);
        expect(x.count).toBe(5);
        expect(x.hasOnly(1, 2, 6, 7, 8)).toBe(true);

        b.remove(4);

        expect(x.hasAny(...b.array)).toBe(false);
        expect(x.count).toBe(6);
        expect(x.hasOnly(1, 2, 4, 6, 7, 8)).toBe(true);

        b.add(7);

        expect(x.hasAny(...b.array)).toBe(false);
        expect(x.count).toBe(5);
        expect(x.hasOnly(1, 2, 4, 6, 8)).toBe(true);

        a.add(0);

        expect(x.hasAny(...b.array)).toBe(false);
        expect(x.count).toBe(6);
        expect(x.hasOnly(0, 1, 2, 4, 6, 8)).toBe(true);
    });

    test("Symmetric difference", () => {
        const a = new Group(1, 2, 3, 4, 5);
        const b = new Group(2, 3, 4, 5, 6);
        const c = new Group(3, 4, 5, 6, 7);
        const d = new Group(4, 5, 6, 7, 8);

        const x = a.xor(b, c, d);

        expect(x.count).toBe(6);
        expect(x.hasOnly(1, 2, 3, 6, 7, 8)).toBe(true);

        a.add(6);
        d.add(3);

        expect(x.count).toBe(4);
        expect(x.hasOnly(1, 2, 7, 8)).toBe(true);

        b.remove(4);
        c.remove(5);

        expect(x.count).toBe(6);
        expect(x.hasOnly(1, 2, 4, 5, 7, 8)).toBe(true);
    });
})