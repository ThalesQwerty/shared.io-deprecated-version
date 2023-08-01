import { EntityKey, EntityMethodKey } from "../api";
import { Client } from "../connection";
import { UserGroup, EntityTree } from "../data";
import { CustomEventEmitter } from "../events";
import { Channel } from "./Channel";
import { Entity } from "./Entity";

export interface UserEvents {

}

export class User extends CustomEventEmitter<UserEvents> {
    /**
     * A locked user group containing only this user.
     */
    public get asGroup() {
        return this._asGroup ??= new UserGroup(this).lock()
    }
    private _asGroup: UserGroup|undefined;

    /**
     * A tree containing the channels where this user currently is
     */
    public readonly joinedChannels = new EntityTree<Channel>();

    /**
     * A tree containing all the entities this user owns
     */
    public readonly ownedEntities = new EntityTree();

    /**
     * Verifies whether or not this user is allowed to execute an INPUT or OUTPUT action on a property of a given entity
     * @param action Writing values and calling functions are considered `"input"` actions, while reading values and listening to function calls are considered `"output"` actions
     * @param entity The entity that will suffer the attempt
     * @param property The name of the wanted property or method from the entity
     */
    can<EntityType extends Entity = Entity>(action: "input"|"output", entity: EntityType, property: EntityKey<EntityType>) {
        const user = this;
        const allowedGroup = entity.policy[property]?.[action];
        if (!allowedGroup) return false;

        return allowedGroup.has(user);
    }

    /**
     * Attempts to join a channel
     * @param channel
     * @returns `true` if user successfully joined the channel, `false` otherwise.
     */
    join (channel: Channel): boolean {
        this.call(channel, "join", [this]);
        return channel.users.has(this);
    }

    /**
     * Attempts to leave a channel
     * @param channel
     * @returns `true` if user successfully left the channel, `false` otherwise.
     */
    leave (channel: Channel): boolean {
        this.call(channel, "leave", [this]);
        return !channel.users.has(this);
    }

    /**
     * Attempts to write a new value into an entity's property
     * @param entity
     * @param key
     * @param newValue
     * @returns `true` if value has been sucessfully written, `false` otherwise.
     */
    write<EntityType extends Entity, Key extends EntityMethodKey<EntityType>>(
        entity: EntityType,
        key: Key,
        newValue: EntityType[Key]
    ) {
        if (this.can("input", entity, key as EntityKey<EntityType>)) {
            (entity as any)[key] = newValue;
        }
    }

    /**
     * Attempts to call an entity's method
     * @param entity
     * @param methodName
     * @param value
     * @returns `true` if method has been sucessfully called, `false` otherwise.
     */
    call<EntityType extends Entity, Key extends EntityMethodKey<EntityType>>(
        entity: EntityType,
        methodName: Key,
        parameters: EntityType[Key] extends (...args: any[]) => any ? Parameters<EntityType[Key]> : never[]
    ) {
        if (this.can("input", entity, methodName)) {
            (entity as any)[methodName](...parameters, this);
        }
    }

    /**
     * Attempts to read values from an entity
     * @param entity
     * @param key
     * @param value
     * @returns `true` if value has been sucessfully written, `false` otherwise.
     */
    read<EntityType extends Entity, Key extends EntityKey<EntityType>>(
        entity: EntityType,
        key: Key
    ) {
        if (this.can("input", entity, key)) {
            return (entity as any)[key] as EntityType[Key];
        }

        return undefined;
    }

    /**
     * Listens to a function call
     * @param entity
     * @param key
     * @param value
     * @returns `true` if value has been sucessfully written, `false` otherwise.
     */
    listen<EntityType extends Entity, Key extends EntityKey<EntityType>>(
        entity: EntityType,
        methodName: Key,
        parameters: EntityType[Key] extends (...args: any[]) => any ? Parameters<EntityType[Key]> : never,
        returnedValue: EntityType[Key] extends (...args: any[]) => any ? ReturnType<EntityType[Key]> : never,
    ) {
        // to-do
    }

    constructor (public readonly client: Client) {
        super();
    }
}