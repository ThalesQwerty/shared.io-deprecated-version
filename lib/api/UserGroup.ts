import { User, Entity } from ".";
import { Client, ViewOutput } from "../connection";
import { Debouncer, KeyValue, Group } from "../utils";

export type BuiltinUserGroup =
    | "owners"
    | "viewers"
    | HiddenBuiltingUserGroup;

export type HiddenBuiltingUserGroup =
    | "nobody";
interface ReadParameters {
    entity: Entity,
    key: string,
    value: unknown
}

interface ListenParameters {
    entity: Entity,
    methodName: string,
    parameters: unknown[],
    returnedValue: unknown
}

export class UserGroup extends Group<User> {
    public static readonly OWNERS: BuiltinUserGroup = "owners";
    public static readonly VIEWERS: BuiltinUserGroup = "viewers";
    public static readonly NONE: BuiltinUserGroup = "nobody";
    public static readonly INHERIT = null;

    public get read() {
        return this._read.call.bind(this._read);
    }

    private _read = new Debouncer((changes: ReadParameters[]) => {
        if (this.empty) return;

        const output = changes.reduce((array, { entity, key, value }) => {
            const { path } = entity;
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

    public listen ({ entity, parameters, methodName, returnedValue }: ListenParameters) {
        if (this.empty) return;

        const { path } = entity;

        this.forEach(user => {
            user.client.send({
                type: "call",
                data: {
                    path,
                    method: methodName,
                    parameters,
                    returnedValue
                }
            })
        });
    };

    public clone(): UserGroup {
        return super.clone() as UserGroup;
    }
}