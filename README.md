# @ts-core/swagger

Фреймворк-независимые TypeScript-декораторы для Swagger/OpenAPI метаданных, совместимые с `@nestjs/swagger`.

## Проблема

В NestJS-проектах `@nestjs/swagger` предоставляет декораторы `@ApiProperty()` и `@ApiPropertyOptional()` для DTO-классов. Но если вы разделяете DTO между бэкендом (NestJS) и фронтендом (Angular, React и т.д.), импорт `@nestjs/swagger` на фронтенде тянет за собой всё дерево зависимостей NestJS.

## Решение

`@ts-core/swagger` предоставляет легковесные, автономные реализации декораторов `ApiProperty` и `ApiPropertyOptional`, которые:

- Записывают метаданные с теми же ключами, что и `@nestjs/swagger` (`swagger/apiModelPropertiesArray`, `swagger/apiModelProperties`)
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
import { ApiProperty, ApiPropertyOptional } from '@ts-core/swagger';

enum UserStatus {
    Active = 'active',
    Inactive = 'inactive',
}

class CreateUserDto {
    @ApiProperty({ description: 'Имя пользователя' })
    name: string;

    @ApiProperty({ enum: UserStatus, description: 'Статус пользователя' })
    status: UserStatus;

    @ApiProperty({ type: [String], description: 'Список ролей' })
    roles: string[];

    @ApiPropertyOptional({ example: 'user@example.com' })
    email?: string;
}
```

## API

### `ApiProperty(options?)`

Помечает свойство как обязательное в OpenAPI-схеме.

### `ApiPropertyOptional(options?)`

Помечает свойство как необязательное (`required: false`) в OpenAPI-схеме.

### Опции

| Опция         | Тип       | Описание                                                 |
|---------------|-----------|----------------------------------------------------------|
| `type`        | `any`     | Тип свойства. Используйте `[Type]` для массивов         |
| `enum`        | `any`     | Enum-объект или массив значений                          |
| `isArray`     | `boolean` | Явно пометить как массив                                 |
| `description` | `string`  | Описание свойства                                        |
| `example`     | `any`     | Пример значения                                          |

Любые дополнительные опции (например, `oneOf`, `additionalProperties`) передаются в метаданные как есть.

## Как это работает

Декораторы сохраняют метаданные через `Reflect.defineMetadata()`, используя те же ключи, которые ожидает `@nestjs/swagger`:

- `swagger/apiModelPropertiesArray` — список имён декорированных свойств на прототипе класса
- `swagger/apiModelProperties` — метаданные для каждого свойства (type, enum, description и т.д.)

Это означает, что на стороне NestJS `@nestjs/swagger` читает эти метаданные прозрачно — никакой адаптер или плагин не нужен.

## Ссылки

- [npm](https://www.npmjs.com/package/@ts-core/swagger)
- [GitHub](https://github.com/ManhattanDoctor/ts-core-swagger)

## Автор

Renat Gubaev — [renat.gubaev@gmail.com](mailto:renat.gubaev@gmail.com)

## Лицензия

ISC
