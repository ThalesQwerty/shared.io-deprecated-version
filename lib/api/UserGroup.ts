import { User, Entity } from ".";
import { Client, ViewOutput } from "../connection";
import { Debouncer, KeyValue, Group } from "../utils";

export type BuiltinUserGroup =
    | "owner"
    | "*"
    | "";
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
    public static readonly OWNERS: BuiltinUserGroup = "owner";
    public static readonly VIEWERS: BuiltinUserGroup = "*";
    public static readonly NONE: BuiltinUserGroup = "";
    public static readonly INHERIT = null;

    /**
     * Built-in empty user group. Cannot be altered.
     */
    public static readonly none = new UserGroup().lock();

    /**
     * Forcefully converts an unknown value into an user group.
     *
     * - If the value is already an user group, simply returns it.
     * - If the value is a group or an array, creates a new user group with its values
     * - If the value is a user, returns a locked user group containing only that user
     * - If all above fails, returns a locked empty user group
     * @param value
     * @returns
     */
    static force(value: unknown) {
        return value instanceof UserGroup ? value
            : value instanceof Group ? new UserGroup(...value.array)
            : value instanceof Array ? new UserGroup(...value)
            : value instanceof User ? value.asGroup
            : UserGroup.none;
    }

    /**
     * Reads a property from an entity
     */
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