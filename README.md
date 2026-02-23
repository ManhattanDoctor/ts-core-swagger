# @ts-core/swagger

Фреймворк-независимые TypeScript-декораторы для Swagger/OpenAPI метаданных, совместимые с `@nestjs/swagger`.

## Проблема

В NestJS-проектах `@nestjs/swagger` предоставляет декораторы для DTO-классов. Но если вы разделяете DTO между бэкендом (NestJS) и фронтендом (Angular, React и т.д.), импорт `@nestjs/swagger` на фронтенде тянет за собой всё дерево зависимостей NestJS.

## Решение

`@ts-core/swagger` предоставляет легковесные, автономные реализации декораторов и утилит, которые:

- Записывают метаданные с теми же ключами, что и `@nestjs/swagger`
- Работают и на бэкенде, и на фронтенде без каких-либо фреймворк-зависимостей
- Полностью совместимы с `@nestjs/swagger` — NestJS читает метаданные и генерирует OpenAPI-схему как обычно

## Установка

```bash
npm install @ts-core/swagger
```

`reflect-metadata` является peer-зависимостью. В NestJS-проектах он уже установлен. Для других окружений установите его вручную:

```bash
npm install reflect-metadata
```

## Использование

```typescript
import {
    ApiProperty,
    ApiPropertyOptional,
    ApiExtraModels,
    ApiHideProperty,
    ApiSchema,
    getSchemaPath,
    refs,
} from '@ts-core/swagger';

enum UserStatus {
    Active = 'active',
    Inactive = 'inactive',
}

class Address {
    @ApiProperty({ description: 'Город' })
    city: string;
}

@ApiSchema({ name: 'User', description: 'Модель пользователя' })
@ApiExtraModels(Address)
class CreateUserDto {
    @ApiProperty({ description: 'Имя пользователя' })
    name: string;

    @ApiProperty({ enum: UserStatus, description: 'Статус пользователя' })
    status: UserStatus;

    @ApiProperty({ type: [String], description: 'Список ролей' })
    roles: string[];

    @ApiPropertyOptional({ example: 'user@example.com' })
    email?: string;

    @ApiPropertyOptional({
        oneOf: refs(Address),
        description: 'Адрес',
    })
    address?: Address;

    @ApiHideProperty()
    internalField: string;
}
```

## API

### Декораторы свойств

#### `ApiProperty(options?)`

Помечает свойство как обязательное в OpenAPI-схеме.

#### `ApiPropertyOptional(options?)`

Помечает свойство как необязательное (`required: false`) в OpenAPI-схеме.

##### Опции

| Опция         | Тип       | Описание                                                 |
|---------------|-----------|----------------------------------------------------------|
| `type`        | `any`     | Тип свойства. Используйте `[Type]` для массивов         |
| `enum`        | `any`     | Enum-объект или массив значений                          |
| `isArray`     | `boolean` | Явно пометить как массив                                 |
| `description` | `string`  | Описание свойства                                        |
| `example`     | `any`     | Пример значения                                          |

Любые дополнительные опции (например, `oneOf`, `additionalProperties`) передаются в метаданные как есть.

#### `ApiHideProperty()`

Скрывает свойство из OpenAPI-схемы. Удаляет свойство из списка декорированных полей.

### Декораторы классов

#### `ApiExtraModels(...models)`

Регистрирует дополнительные модели, которые должны быть включены в OpenAPI-документацию, даже если они не используются напрямую в контроллерах.

#### `ApiSchema(options?)`

Задаёт кастомное имя и описание для схемы класса.

| Опция         | Тип      | Описание                    |
|---------------|----------|-----------------------------|
| `name`        | `string` | Имя схемы в OpenAPI         |
| `description` | `string` | Описание схемы              |

### Утилиты

#### `getSchemaPath(model)`

Возвращает путь `$ref` к модели в OpenAPI-схеме.

```typescript
getSchemaPath(Address); // '#/components/schemas/Address'
getSchemaPath('Address'); // '#/components/schemas/Address'
```

#### `refs(...models)`

Возвращает массив `{ $ref }` объектов. Удобно для `oneOf`, `anyOf`, `allOf`.

```typescript
refs(Address, CreateUserDto);
// [
//   { $ref: '#/components/schemas/Address' },
//   { $ref: '#/components/schemas/CreateUserDto' },
// ]
```

## Как это работает

Декораторы сохраняют метаданные через `Reflect.defineMetadata()`, используя те же ключи, которые ожидает `@nestjs/swagger`:

| Ключ                              | Описание                                       |
|-----------------------------------|-------------------------------------------------|
| `swagger/apiModelPropertiesArray` | Список декорированных свойств на прототипе      |
| `swagger/apiModelProperties`      | Метаданные свойства (type, enum, description)   |
| `swagger/apiExtraModels`          | Дополнительные модели для документации          |
| `swagger/apiSchema`               | Кастомное имя и описание схемы класса           |

На стороне NestJS `@nestjs/swagger` читает эти метаданные прозрачно — никакой адаптер или плагин не нужен.

## Ссылки

- [npm](https://www.npmjs.com/package/@ts-core/swagger)
- [GitHub](https://github.com/ManhattanDoctor/ts-core-swagger)

## Автор

Renat Gubaev — [renat.gubaev@gmail.com](mailto:renat.gubaev@gmail.com)

## Лицензия

ISC
