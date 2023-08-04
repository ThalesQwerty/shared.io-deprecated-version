import { EntityInputIndexes, EntityKey, EntityMethodKey } from "../api";
import { Client } from "../connection";
import { UserGroup, EntityTree, Group } from "../data";
import { CustomEventEmitter } from "../events";
import { KeyValue } from "../utils";
import { Channel } from "./Channel";
import { Entity } from "./Entity";

export interface UserEvents {

}

export class User<UserData extends KeyValue = KeyValue> extends CustomEventEmitter<UserEvents> {
    /**
     * A locked user group containing only this user.
     */
    public get asGroup() {
        return this._asGroup ??= new UserGroup(this).lock()
    }
    private _asGroup: UserGroup | undefined;

    /**
     * A tree containing the channels where this user currently is
     */
    public readonly joinedChannels = new EntityTree<Channel>();

    /**
     * A tree containing all the entities this user owns
     */
    public readonly ownedEntities = new EntityTree();

    /**
     * All clients associated with this group
     */
    public readonly clients = new Group<Client>();

    public readonly profile: Partial<UserData> = {};

    /**
     * All the groups this user has been added to
     */
    public readonly groups = {
        /**
         * All groups this user is currently in
         */
        current: new Group<UserGroup>(),

        /**
         * All groups this user has been in before, but not currently in anymore
         */
        previous: new Group<UserGroup>()
    };

    constructor(client?: Client) {
        super();

        this.clients.on("add", ({ item: newClient }) => {
            newClient.user = this;
        });

        this.clients.on("remove", ({ item: removedClient }) => {
            if (removedClient.user === this) removedClient.user = undefined;
        });

        this.groups.current.on("add", ({ item: group }) => {
            this.groups.previous.remove(group);
        });

        this.groups.current.on("remove", ({ item: group }) => {
            this.groups.previous.add(group);
        });

        if (client) this.clients.add(client);
    }

    /**
     * Sends a JSON message to this user
     */
    send(...params: Parameters<Client["send"]>) {
        return this.clients.forEach(client => client.send(...params));
    }

    /**
     * Verifies whether an user belongs to a given user group
     */
    belongsTo(userGroup: UserGroup) {
        return this.groups.current.has(userGroup) ? true
            : this.groups.previous.has(userGroup) ? false
            : userGroup.has(this);
    }

    /**
     * Attempts to find an entity that's visible to this user, given some indexes
     * @param indexes Must contain:
     * - The type and the ID of the entity
     * - If it belongs to a channel, the type and the ID of the channel it belongs to
     * - Whether or not this user owns the entity
     * - Whether or not the entity is a channel and this user belongs to it
     * @returns The found entity, or `undefined`.
     */
    findEntity(indexes: EntityInputIndexes) {
        if (indexes.isOwned) {
            return this.ownedEntities.find(indexes.type, indexes.id);
        }
        else if (indexes.hasJoined) {
            return this.joinedChannels.find(indexes.type, indexes.id);
        }
        else if (indexes.channel) {
            return this.joinedChannels.findRecursive([indexes.channel.type, indexes.channel.id], [indexes.type, indexes.id]);
        }
        else {
            return undefined;
        }
    }

    /**
     * Verifies whether or not this user is allowed to execute an INPUT or OUTPUT action on a property of a given entity
     * @param action Writing values and calling functions are considered `"input"` actions, while reading values and listening to function calls are considered `"output"` actions
     * @param entity The entity that will suffer the attempt
     * @param key The name of the wanted property or method from the entity
     */
    can<EntityType extends Entity = Entity>(action: "input" | "output", entity: EntityType, key: EntityKey<EntityType>) {
        const user = this;
        const allowedGroup = entity.policy[key]?.[action];
        if (!allowedGroup) return false;

        return user.belongsTo(allowedGroup);
    }

    /**
     * Attempts to join a channel
     * @param channel
     * @returns `true` if user successfully joined the channel, `false` otherwise.
     */
    join(channel: Channel): boolean {
        this.call(channel, "join", [this]);
        return this.belongsTo(channel.users);
    }

    /**
     * Attempts to leave a channel
     * @param channel
     * @returns `true` if user successfully left the channel, `false` otherwise.
     */
    leave(channel: Channel): boolean {
        this.call(channel, "leave", [this]);
        return !this.belongsTo(channel.users);
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
        parameters: EntityType[Key] extends (...args: any[]) => any ? Parameters<EntityType[Key]> : never[],
        client?: Client
    ) {
        if (this.can("input", entity, methodName)) {
            const methodSchema = entity.schema.getMethod(methodName);
            if (!methodSchema) return;

            const newParameters: unknown[] = [];

            let parameterIndex = 0;
            for (const parameterSchema of methodSchema.parameters) {
                if (parameterSchema.isUser) {
                    newParameters.push(this);
                }
                else if (parameterSchema.isClient) {
                    newParameters.push(client);
                }
                else {
                    newParameters.push(parameters[parameterIndex]);
                    parameterIndex ++;
                }
            }

            (entity as any)[methodName](...newParameters);
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
}