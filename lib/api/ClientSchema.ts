import { DECORATORS } from ".";
import { BuiltinUserGroup } from "../data";
import { Channel, Entity } from "../models";
import { KeyValue } from "../utils";
import { Schema } from "./Schema";

export function generateClientSchema(entities: (typeof Entity)[]) {
    if (!entities.length) return "";

    const entityTypes = entities.map(entity => entity.name);

    const abstractClasses: string[] = [];
    const unionTypes: string[] = [];

    const entityAbstractClass = `export abstract class Entity {
        get type() {
            return this.constructor.name;
        }

        readonly id: string;
        readonly owned: boolean;
        readonly channel: string;

        constructor(owned: boolean = false, channel: string = "", id: string = "") {
            this.owned = owned;
            this.channel = channel;
            this.id = id;
        }

        delete() {}
    }`;

    const channelAbstractClass = `export abstract class Channel extends Entity {
        readonly joined: boolean = false;

        join() {}
        leave() {}
    }`;

    for (const typeName of entityTypes) {
        const schema = Schema.findOrCreateByName(typeName);
        const extendedSchema = schema.extended();

        const groupAliases = schema.listGroupAliases();

        const builtinGroups: Partial<KeyValue<boolean, BuiltinUserGroup>> = {
            viewers: true
        };

        const groupCombination = groupAliases.reduce((obj, name) => ({
            ...obj,
            [name]: false
        }), builtinGroups as KeyValue<boolean>);
        const combinationAmount = Math.pow(2, groupAliases.length);

        const userBelongsTo = (groupName: string) => {
            const isNegated = DECORATORS.not(groupName)[0] !== "!";
            const fixedGroupName = isNegated ? DECORATORS.not(groupName) : groupName;

            const groupAlias = extendedSchema.reverseAliasMap[fixedGroupName] ?? fixedGroupName;
            const belongsToGroup = groupCombination[groupAlias];

            return isNegated ? !belongsToGroup : belongsToGroup;
        }

        const typeDeclaration = `export type ${schema.type}`;
        const variations: string[] = [];

        // create union type

        for (let i = 0; i < combinationAmount; i++) {
            const binary = i.toString(2).padStart(groupAliases.length, '0');

            for (let j = 0; j < groupAliases.length; j++) {
                const name = groupAliases[j];
                groupCombination[name] = binary[j] === "1";
            }

            const propertyDeclarations = Object.values(extendedSchema.properties).map(property => {
                const { outputGroupName, inputGroupName } = property;
                const isVisible = userBelongsTo(outputGroupName) || userBelongsTo(inputGroupName);
                if (!isVisible) return "";

                const readonly = userBelongsTo(inputGroupName) ? "" : "readonly ";
                return `${readonly}${property.alias}: ${groupAliases.includes(property.alias) ? userBelongsTo(property.alias) : property.type};`
            });
            const methodDeclarations = Object.values(extendedSchema.methods).map(method => {
                const { actionGroupName, eventGroupName } = method;
                const isVisible = userBelongsTo(actionGroupName);// || userBelongsTo(eventGroupName);
                if (!isVisible) return "";

                const parameterDeclarations = Object.values(method.parameters).map(parameter => {
                    return `${parameter.name}: ${parameter.required}`;
                });

                return `${method.alias}: (${parameterDeclarations.join(", ")}) => ${method.returnType}`
            });

            variations.push(`{
                ${propertyDeclarations.join(`
                `)}
                ${methodDeclarations.join(`
                `)}
            }`);
        }

        unionTypes.push(`${typeDeclaration} = ${schema.extends ? `${schema.extends.type} & ` : ""}${variations.join(`
        |`)}`);

        // create abstract class

        switch (schema.type) {
            case "Entity":
                abstractClasses.push(entityAbstractClass);
                break;
            case "Channel":
                abstractClasses.push(channelAbstractClass);
                break;
            default:
                const classDeclaration = `export abstract class ${schema.type}${schema.extends ? ` extends ${schema.extends.type}` : ""}`;

                const propertyDeclarations = Object.values(schema.properties).map(property => {
                    return `${property.alias}: ${property.type} = undefined as any;`
                });

                const methodDeclarations = Object.values(schema.methods).map(method => {
                    const parameterDeclarations = Object.values(method.parameters).map(parameter => {
                        return `${parameter.name}: ${parameter.required}`;
                    });

                    return `abstract ${method.alias}(${parameterDeclarations.join(", ")}): ${method.returnType};`
                });

                abstractClasses.push(`${classDeclaration} {
                    ${propertyDeclarations.join(`
                    `)}
                    ${methodDeclarations.join(`
                    `)}
                }`);
                break;
        }
    }

    return `
        export namespace Classes {
            ${abstractClasses.join(`
            `)}
        }

        export namespace Types {
            ${unionTypes.join(`
            `)}
        }
    `;
}