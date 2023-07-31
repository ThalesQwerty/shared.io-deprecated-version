import { User, Entity } from ".";
import { ViewOutput } from "../connection";
import { Debouncer,Group } from "../utils";

export type BuiltinUserGroup =
    | "owner"
    | "viewers"
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

type SubjectiveChanges = ViewOutput["data"]["changes"][number];
type SubjectiveProperty<T = unknown> = (user: User) => T;

type ObjectiveChanges = SubjectiveChanges & {
    entity: Entity,
    subjectiveKeys: string[]
};

export class UserGroup extends Group<User> {
    public static readonly OWNERS: BuiltinUserGroup = "owner";
    public static readonly VIEWERS: BuiltinUserGroup = "viewers";
    public static readonly NONE: BuiltinUserGroup = "nobody";
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
            : value instanceof Group ? new UserGroup(...value.asArray)
            : value instanceof Array ? new UserGroup(...value)
            : value instanceof User ? value.asGroup
            : UserGroup.none;
    }

    /**
     * Reads a property from an entity
     */
    public get read() {
        return this._read.call.bind(this);
    }

    private _read = new Debouncer((changes: ReadParameters[]) => {
        if (this.empty) return;

        let hasAnySubjectiveKey = false;

        const objectiveOutputList = changes.reduce((array, { entity, key, value }) => {
            const path = entity.path.join("/");
            const currentItem = array.find(item => item.path === path);
            const isComputed = typeof value === "function";

            if (isComputed) hasAnySubjectiveKey = true;

            if (currentItem) {
                currentItem.diff[key] = value;
                if (isComputed) currentItem.subjectiveKeys.push(key);
            } else {
                array.push({
                    path,
                    entity,
                    diff: {
                        [key]: value
                    },
                    subjectiveKeys: isComputed ? [key] : []
                });
            }

            return array;
        }, [] as ObjectiveChanges[]);

        hasAnySubjectiveKey = false; // to-do: remove this later

        this.forEach(user => {
            const staticOutputList = hasAnySubjectiveKey ? objectiveOutputList.map(item => item.subjectiveKeys.reduce<SubjectiveChanges>(
                (output, currentKey) => {
                    const method = output.diff[currentKey] as SubjectiveProperty;

                    const generated = {
                        ...output,
                        diff: {
                            ...output.diff,
                            [currentKey]: method.call(item.entity, user)
                        }
                    };

                    return generated;
                },
            item)) : objectiveOutputList;

            user.client.send({
                type: "view",
                data: {
                    changes: staticOutputList
                }
            })
        });
    });

    public listen ({ entity, parameters, methodName, returnedValue }: ListenParameters) {
        if (this.empty) return;

        const path = entity.path.join("/");

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