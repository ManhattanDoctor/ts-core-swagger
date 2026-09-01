# @ts-core/swagger

> Фреймворк-независимые TypeScript-декораторы для Swagger/OpenAPI метаданных, совместимые с `@nestjs/swagger`

[![npm version](https://img.shields.io/npm/v/@ts-core/swagger.svg)](https://www.npmjs.com/package/@ts-core/swagger)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Пакет повторяет декораторы `@nestjs/swagger`, но не тянет за собой сам NestJS. Метаданные пишутся теми же ключами, поэтому NestJS читает их как свои и строит OpenAPI-схему без адаптеров и плагинов. Один и тот же DTO-класс живёт и на сервере, и в браузере.

## Содержание

- [Описание](#описание)
  - [Основные возможности](#основные-возможности)
- [Установка](#установка)
  - [Зависимости](#зависимости)
  - [Настройка TypeScript](#настройка-typescript)
- [Быстрый старт](#быстрый-старт)
- [Декораторы свойств](#декораторы-свойств)
  - [ApiProperty](#apiproperty)
  - [ApiPropertyOptional](#apipropertyoptional)
  - [ApiHideProperty](#apihideproperty)
- [Декораторы классов](#декораторы-классов)
  - [ApiExtraModels](#apiextramodels)
  - [ApiSchema](#apischema)
- [Утилиты](#утилиты)
  - [getSchemaPath](#getschemapath)
  - [refs](#refs)
- [Как это работает](#как-это-работает)
  - [Ключи метаданных](#ключи-метаданных)
  - [Определение типа](#определение-типа)
  - [Обработка перечислений](#обработка-перечислений)
  - [Неизвестные опции](#неизвестные-опции)
- [Общие DTO для сервера и клиента](#общие-dto-для-сервера-и-клиента)
- [Разработка](#разработка)
  - [Требования](#требования)
  - [Сборка проекта](#сборка-проекта)
  - [Структура проекта](#структура-проекта)
- [История изменений](#история-изменений)
- [Лицензия](#лицензия)
- [Автор](#автор)
- [Ссылки](#ссылки)
- [Поддержка](#поддержка)

## Описание

В NestJS-проекте DTO-классы размечаются декораторами `@nestjs/swagger`. Пока классы живут на сервере, это удобно. Проблема начинается, когда те же классы нужны клиенту: импорт `@nestjs/swagger` тянет в сборку фронтенда всё дерево зависимостей NestJS, хотя нужны из него только несколько декораторов, записывающих метаданные.

`@ts-core/swagger` закрывает ровно эту задачу. Он реализует те же декораторы самостоятельно, зависит только от `reflect-metadata` и пишет метаданные ключами, которые ожидает `@nestjs/swagger`. Серверная часть продолжает генерировать документацию как раньше — она не отличает эти метаданные от своих.

### Основные возможности

- **Ноль зависимостей от фреймворка** — только `reflect-metadata` в peer-зависимостях, ни NestJS, ни Express
- **Совместимость по метаданным** — те же ключи `swagger/*`, что и у `@nestjs/swagger`, генерация схемы работает без изменений
- **Общие DTO** — один класс используется сервером и клиентом, дублировать описания не нужно
- **Вывод типа из кода** — если тип не указан явно, берётся из `design:type`, проставленного компилятором
- **Разбор перечислений** — строковые и числовые enum приводятся к списку значений, массивы enum разворачиваются в `items`
- **Сквозная передача опций** — `oneOf`, `additionalProperties` и прочие поля уходят в метаданные как есть
- **Двойная сборка** — пакет поставляется в CommonJS и ES Modules

## Установка

```bash
npm install @ts-core/swagger
```

### Зависимости

`reflect-metadata` объявлен peer-зависимостью. В NestJS-проектах он уже стоит, в остальных окружениях его нужно поставить отдельно:

```bash
npm install reflect-metadata
```

Импортировать его вручную не требуется — пакет делает это сам.

### Настройка TypeScript

Декораторы и вывод типов работают только при включённых флагах:

```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

Без `emitDecoratorMetadata` компилятор не запишет `design:type`, и тип свойства придётся указывать явно.

## Быстрый старт

```typescript
import { ApiProperty, ApiPropertyOptional, ApiExtraModels, ApiHideProperty, refs } from '@ts-core/swagger';

enum UserStatus {
    Active = 'active',
    Inactive = 'inactive'
}

class Address {
    @ApiProperty({ description: 'Город' })
    city: string;
}

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

    @ApiPropertyOptional({ oneOf: refs(Address), description: 'Адрес' })
    address?: Address;

    @ApiHideProperty()
    internalField: string;
}
```

Дальше на стороне NestJS ничего не меняется: контроллер объявляет `CreateUserDto` как тело запроса, `SwaggerModule` собирает документ и показывает описанные свойства.

## Декораторы свойств

### ApiProperty

```typescript
ApiProperty(options?: IApiPropertyOptions): PropertyDecorator
```

Помечает свойство как обязательное в OpenAPI-схеме.

Опции:

| Опция | Тип | Описание |
|---|---|---|
| `type` | `any` | Тип свойства; `[Type]` понимается как массив |
| `enum` | `any` | Объект перечисления или массив значений |
| `isArray` | `boolean` | Явная пометка массива |
| `description` | `string` | Описание свойства |
| `example` | `any` | Пример значения |

```typescript
class ProductDto {
    @ApiProperty({ description: 'Наименование' })
    title: string;

    @ApiProperty({ type: Number, example: 199.9 })
    price: number;

    @ApiProperty({ type: [String] })
    tags: string[];
}
```

### ApiPropertyOptional

```typescript
ApiPropertyOptional(options?: IApiPropertyOptions): PropertyDecorator
```

То же самое, но свойство помечается как необязательное — в метаданные добавляется `required: false`.

```typescript
class ProductDto {
    @ApiPropertyOptional({ description: 'Описание товара' })
    description?: string;
}
```

### ApiHideProperty

```typescript
ApiHideProperty(): PropertyDecorator
```

Убирает свойство из схемы: имя удаляется из списка декорированных полей, и генератор его не видит. Полезно для служебных полей, которые не должны попадать в документацию.

```typescript
class UserDto {
    @ApiProperty()
    login: string;

    @ApiHideProperty()
    passwordHash: string;
}
```

## Декораторы классов

### ApiExtraModels

```typescript
ApiExtraModels(...models: Function[]): ClassDecorator
```

Регистрирует модели, которые должны попасть в документацию, даже если ни один контроллер не объявляет их напрямую. Нужен, когда на модель ссылаются только через `$ref` — например, внутри `oneOf`.

```typescript
@ApiExtraModels(Address, Company)
class CustomerDto {
    @ApiProperty({ oneOf: refs(Address, Company) })
    owner: Address | Company;
}
```

Вызовы накапливаются: несколько декораторов на одном классе дополняют список, а не заменяют его.

### ApiSchema

```typescript
ApiSchema(options?: IApiSchemaOptions): ClassDecorator
```

Задаёт параметры самой схемы — имя, под которым класс попадёт в документ, и её описание.

| Опция | Тип | Описание |
|---|---|---|
| `name` | `string` | Имя схемы в документе |
| `description` | `string` | Описание схемы |

```typescript
@ApiSchema({ name: 'User', description: 'Учётная запись пользователя' })
class UserResponseDto {
    @ApiProperty()
    id: string;
}
```

## Утилиты

### getSchemaPath

```typescript
getSchemaPath(model: string | Function): string
```

Возвращает путь `$ref` к модели. Принимает и класс, и его имя строкой.

```typescript
getSchemaPath(Address);   // '#/components/schemas/Address'
getSchemaPath('Address'); // '#/components/schemas/Address'
```

### refs

```typescript
refs(...models: (string | Function)[]): Array<{ $ref: string }>
```

Собирает массив ссылок — то, что ожидают `oneOf`, `anyOf` и `allOf`.

```typescript
refs(Address, CreateUserDto);
// [
//   { $ref: '#/components/schemas/Address' },
//   { $ref: '#/components/schemas/CreateUserDto' }
// ]
```

## Как это работает

Декораторы ничего не генерируют сами — они складывают метаданные через `Reflect.defineMetadata()`. Читает их уже `@nestjs/swagger` на стороне сервера, когда строит документ.

### Ключи метаданных

| Ключ | Где хранится | Содержимое |
|---|---|---|
| `swagger/apiModelPropertiesArray` | прототип класса | Список декорированных свойств, имена с префиксом `:` |
| `swagger/apiModelProperties` | свойство | Метаданные свойства: тип, перечисление, описание, пример |
| `swagger/apiExtraModels` | класс | Дополнительные модели для документации |
| `swagger/apiSchema` | класс | Имя и описание схемы |

Имена ключей и формат совпадают с теми, что использует `@nestjs/swagger`, — на этом и держится совместимость.

### Определение типа

Тип свойства выбирается по трём правилам, в порядке убывания приоритета:

1. Явно переданный `type`. Запись `[Type]` разворачивается в `type: Type` и `isArray: true`.
2. Тип, выведенный из `enum`: `string` или `number` — в зависимости от значений.
3. Отложенное чтение `design:type` — метаданных, которые компилятор проставляет при `emitDecoratorMetadata`. Значение берётся не сразу, а функцией, поэтому циклические ссылки между классами не ломают загрузку модулей.

### Обработка перечислений

Объект перечисления приводится к списку значений. Числовые enum в TypeScript компилируются с обратной связью ключей и значений, поэтому из них отбираются только числа. Массив enum разворачивается в `type: 'array'` с вложенным `items`:

```typescript
enum Role {
    Admin = 'admin',
    User = 'user'
}

class AccountDto {
    @ApiProperty({ enum: Role })
    role: Role;
    // enum: ['admin', 'user'], type: 'string'

    @ApiProperty({ enum: Role, isArray: true })
    roles: Role[];
    // type: 'array', items: { type: 'string', enum: ['admin', 'user'] }
}
```

### Неизвестные опции

Всё, что не входит в список известных полей (`description`, `type`, `enum`, `isArray`, `example`, `required`), передаётся в метаданные без изменений. Так работают `oneOf`, `additionalProperties`, `format`, `minimum` и любые другие ключи OpenAPI.

## Общие DTO для сервера и клиента

Основной сценарий — вынести DTO в общий пакет, который подключают обе стороны:

```typescript
// @project/common — пакет, общий для сервера и клиента
import { ApiProperty } from '@ts-core/swagger';

export class LoginDto {
    @ApiProperty({ description: 'Логин' })
    login: string;

    @ApiProperty({ description: 'Пароль' })
    password: string;
}
```

```typescript
// сервер: NestJS читает метаданные и строит схему
@Controller('auth')
export class AuthController {
    @Post('login')
    async login(@Body() params: LoginDto): Promise<void> {}
}
```

```typescript
// клиент: тот же класс, сборка не тянет NestJS
let params = new LoginDto();
params.login = 'user';
```

## Разработка

### Требования

- Node.js >= 14
- TypeScript >= 4.0 с включёнными `experimentalDecorators` и `emitDecoratorMetadata`

### Сборка проекта

```bash
# Установка зависимостей
npm install

# Сборка (создаёт dist/cjs и dist/esm)
make build

# Очистка
make clean

# Публикация с повышением patch-версии
make publish_patch
```

### Структура проекта

```
ts-core-swagger/
├── src/
│   ├── swagger.ts          # декораторы, утилиты, работа с метаданными
│   └── public-api.ts       # публичный API пакета
├── Makefile                # сборка и публикация
├── tsconfig.json           # общая конфигурация
├── tsconfig.cjs.json       # сборка CommonJS
├── tsconfig.esm.json       # сборка ES Modules
├── package.json
└── README.md
```

## История изменений

### 11.0.6

- `ApiSchema` — имя и описание схемы в документе
- Числовые перечисления разбираются корректно: обратные ключи отбрасываются
- Массивы перечислений разворачиваются в `items` вместо плоского `enum`
- Тип по `design:type` читается отложенно, что снимает проблему циклических ссылок между DTO

### 11.0.1

- Первый выпуск: `ApiProperty`, `ApiPropertyOptional`, `ApiHideProperty`, `ApiExtraModels`, `getSchemaPath`, `refs`

## Лицензия

ISC

## Автор

**Ренат Губаев**
- Email: renat.gubaev@gmail.com
- GitHub: [@ManhattanDoctor](https://github.com/ManhattanDoctor)

## Ссылки

- [GitHub Repository](https://github.com/ManhattanDoctor/ts-core-swagger)
- [NPM Package](https://www.npmjs.com/package/@ts-core/swagger)
- [Issue Tracker](https://github.com/ManhattanDoctor/ts-core-swagger/issues)
- [Документация @nestjs/swagger](https://docs.nestjs.com/openapi/introduction)

## Поддержка

Если вы нашли баг или у вас есть предложение по улучшению, пожалуйста, создайте issue в [GitHub Issues](https://github.com/ManhattanDoctor/ts-core-swagger/issues).
