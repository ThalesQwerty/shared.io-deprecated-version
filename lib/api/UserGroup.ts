import { User } from ".";
import { Client, ViewOutput } from "../connection";
import { Debouncer, KeyValue, Group } from "../utils";

export type BuiltinUserGroup =
    | "owners"
    | "viewers";

export class UserGroup extends Group<User> {
    public static readonly OWNERS: BuiltinUserGroup = "owners";
    public static readonly VIEWERS: BuiltinUserGroup = "viewers";

    private emitStateChanges = new Debouncer((changes: { path: string, key: string, value: unknown }[]) => {
        const output = changes.reduce((array, { path, key, value }) => {
            const currentItem = array.find(item => item.path === path);

            if (currentItem) {
                currentItem.diff[key] = value;
            } else {
                array.push({
                    path,
                    diff: {
                        [key]: value
                    }
                });
            }

            return array;
        }, [] as ViewOutput["data"]["changes"]);

        this.forEach(user => {
            user.client.send({
                type: "view",
                data: {
                    changes: output
                }
            })
        });
    });

    public get output() {
        return this.emitStateChanges.call.bind(this.emitStateChanges);
    }

    public clone() {
        return super.clone() as UserGroup;
    }
}