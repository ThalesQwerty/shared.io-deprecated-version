import { Entity } from "./models";

export { Server, Client } from "./connection";
export { UserGroup } from "./data";
export { Entity, Channel, User } from "./models";

const { input, output, hidden, action, event, shared } = Entity.decorators();

export {
    input, output, hidden, action, event, shared
};