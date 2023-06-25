import { User } from ".";
import { Client, ViewOutput } from "../connection";
import { Debouncer, KeyValue, Group } from "../utils";

export class UserGroup extends Group<User> {
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
        return this.emitStateChanges.call;
    }
}