import 'reflect-metadata';

interface IApiPropertyOptions {
    [key: string]: any;
    type?: any;
    enum?: any;
    isArray?: boolean;
    example?: any;
    description?: string;
}

function getEnumValues(item: any): any[] {
    if (Array.isArray(item)) {
        return item;
    }
    let values = Object.values(item);
    let hasNumericKey = Object.keys(item).some(k => !isNaN(Number(k)));
    return hasNumericKey ? values.filter(v => typeof v === 'number') : values;
}

function getEnumType(values: Array<any>): 'string' | 'number' {
    return values.every(v => typeof v === 'number') ? 'number' : 'string';
}

const KNOWN_KEYS = ['description', 'type', 'enum', 'isArray', 'example', 'required'];

function createDecorator(options: IApiPropertyOptions = {}, required?: boolean): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        let properties: string[] = [...(Reflect.getMetadata('swagger/apiModelPropertiesArray', target) || [])];
        let key = `:${String(propertyKey)}`;
        if (!properties.includes(key)) {
            properties.push(key);
        }
        Reflect.defineMetadata('swagger/apiModelPropertiesArray', properties, target);

        // Normalize type: [X] → type: X, isArray: true
        let type = options.type;
        let isArray = options.isArray;
        if (Array.isArray(type)) {
            isArray = true;
            type = type[0];
        }

        let metadata: Record<string, any> = {};

        // Pass through extra options (oneOf, additionalProperties, etc.)
        for (let k of Object.keys(options)) {
            if (!KNOWN_KEYS.includes(k)) {
                metadata[k] = options[k];
            }
        }

        // Process enum: convert object to value array, derive type
        if (options.enum !== undefined) {
            let enumValues = getEnumValues(options.enum);
            if (isArray) {
                metadata.type = 'array';
                metadata.items = { type: getEnumType(enumValues), enum: enumValues };
                metadata.isArray = true;
            } else {
                metadata.enum = enumValues;
                metadata.type = getEnumType(enumValues);
            }
        }

        // Fallback type: explicit > enum-derived > design:type
        if (type !== undefined && !metadata.type) {
            metadata.type = type;
        } else if (!metadata.type) {
            let _target = target;
            let _key = propertyKey;
            metadata.type = () => Reflect.getMetadata('design:type', _target, _key);
        }

        if (isArray && !metadata.isArray) {
            metadata.isArray = isArray;
        }
        if (options.description !== undefined) {
            metadata.description = options.description;
        }
        if (options.example !== undefined) {
            metadata.example = options.example;
        }
        if (required === false) {
            metadata.required = false;
        }

        Reflect.defineMetadata('swagger/apiModelProperties', metadata, target, propertyKey);
    };
}

export function ApiProperty(options?: IApiPropertyOptions): PropertyDecorator {
    return createDecorator(options);
}

export function ApiPropertyOptional(options?: IApiPropertyOptions): PropertyDecorator {
    return createDecorator(options, false);
}

export function ApiExtraModels(...models: Function[]): ClassDecorator {
    return (target: Function) => {
        let existing: Function[] = Reflect.getMetadata('swagger/apiExtraModels', target) || [];
        Reflect.defineMetadata('swagger/apiExtraModels', [...existing, ...models], target);
    };
}

export function ApiHideProperty(): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        let properties: string[] = [...(Reflect.getMetadata('swagger/apiModelPropertiesArray', target) || [])];
        let key = `:${String(propertyKey)}`;
        let index = properties.indexOf(key);
        if (index !== -1) {
            properties.splice(index, 1);
        }
        Reflect.defineMetadata('swagger/apiModelPropertiesArray', properties, target);
    };
}

export interface IApiSchemaOptions {
    name?: string;
    description?: string;
}

export function ApiSchema(options?: IApiSchemaOptions): ClassDecorator {
    return (target: Function) => {
        let existing = Reflect.getMetadata('swagger/apiSchema', target) || [];
        Reflect.defineMetadata('swagger/apiSchema', [...existing, options], target);
    };
}

export function getSchemaPath(model: string | Function): string {
    let name = typeof model === 'string' ? model : model.name;
    return `#/components/schemas/${name}`;
}

export function refs(...models: (string | Function)[]): Array<{ $ref: string }> {
    return models.map(model => ({ $ref: getSchemaPath(model) }));
}
