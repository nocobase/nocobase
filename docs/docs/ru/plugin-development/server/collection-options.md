## Параметры конфигурации коллекции

```ts
export type MigrationRule =
  | 'overwrite'
  | 'skip'
  | 'upsert'
  | 'schema-only'
  | 'insert-ignore';

export interface CollectionOptions {
  name: string;
  title?: string;
  migrationRules?: MigrationRule[];
  inherits?: string[] | string;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  autoGenId?: boolean;
  timestamps?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  indexes?: ModelIndexesOptions[];
}
```

### `name` - Название коллекции
- **Тип**: `string`
- **Обязательно**: ✅
- **Описание**: уникальный идентификатор коллекции, который должен быть уникальным во всем приложении.
- **Пример**:
```typescript
{
  name: 'users'  // Коллекция пользователей
}
```

### `title` - Заголовок коллекции
- **Тип**: `string`
- **Обязательно**: ❌
- **Описание**: отображаемый заголовок коллекции, используемый для отображения внешнего интерфейса.
- **Пример**:
```typescript
{
  name: 'users',
  title: 'User Management'  // Отображается как "User Management" в интерфейсе
}
```

### `migrationRules` - Правила миграции
- **Тип**: `MigrationRule[]`
- **Обязательно**: ❌
- **Описание**: правила обработки для переноса данных.
- **Пример**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Перезаписать существующие данные
  fields: [...]
}
```

### `inherits` - Наследование коллекций
- **Тип**: `string[] | string`
- **Обязательно**: ❌
- **Описание**: наследовать определения полей из других коллекций. Поддерживает наследование одной или нескольких коллекций.
- **Пример**:

```typescript
// Одиночное наследование
{
  name: 'admin_users',
  inherits: 'users',  // Наследовать все поля из коллекции users
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Множественное наследование
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Наследовать от нескольких коллекций
  fields: [...]
}
```

### `filterTargetKey` - Целевой ключ фильтрации
- **Тип**: `string | string[]`
- **Обязательно**: ❌
- **Описание**: целевой ключ, используемый для фильтрации запросов. Поддерживает один или несколько ключей.
- **Пример**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Фильтрация по идентификатору пользователя
  fields: [...]
}

// Несколько ключей фильтрации
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Фильтрация по идентификатору пользователя и идентификатору категории
  fields: [...]
}
```

### `fields` - Определения полей
- **Тип**: `FieldOptions[]`
- **Обязательно**: ❌
- **Значение по умолчанию**: `[]`
- **Описание**: массив определений полей для коллекции. Каждое поле содержит такую ​​информацию, как тип, имя и конфигурация.
- **Пример**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Username'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'Email'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Password'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Created At'
    }
  ]
}
```

### `model` - Пользовательская модель
- **Тип**: `string | ModelStatic<Model>`
- **Обязательно**: ❌
- **Описание**: укажите пользовательский класс модели Sequelize, который может быть либо именем класса, либо самим классом модели.
- **Пример**:
```typescript
// Указать имя класса модели в виде строки
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Использовать класс модели
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Пользовательский репозиторий
- **Тип**: `string | RepositoryType`
- **Обязательно**: ❌
- **Описание**: укажите собственный класс репозитория для обработки логики доступа к данным.
- **Пример**:
```typescript
// Указать имя класса репозитория в виде строки
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Использовать класс репозитория
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Автоматическая генерация идентификатора
- **Тип**: `boolean`
- **Обязательно**: ❌
- **Значение по умолчанию**: `true`
- **Описание**: нужно ли автоматически генерировать идентификатор первичного ключа.
- **Пример**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Автоматически генерировать идентификатор первичного ключа
  fields: [...]
}

// Отключить автоматическую генерацию ID (требуется ручное указание первичного ключа)
{
  name: 'external_data',
  autoGenId: false,
fields: [
  {
    type: 'string',
      name: 'id',
      primaryKey: true
    }
  ]
}
```

### `timestamps` - Включить временные метки
- **Тип**: `boolean`
- **Обязательно**: ❌
- **Значение по умолчанию**: `true`
- **Описание**: включить ли поля `createdAt` и `updatedAt`.
- **Пример**:
```typescript
{
  name: 'users',
  timestamps: true,  // Включить временные метки
  fields: [...]
}
```

### `createdAt` - Поле времени создания
- **Тип**: `boolean | string`
- **Обязательно**: ❌
- **Значение по умолчанию**: `true`
- **Описание**: конфигурация поля `createdAt`.
- **Пример**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Пользовательское имя для поля createdAt
  fields: [...]
}
```

### `updatedAt` - Поле времени обновления
- **Тип**: `boolean | string`
- **Обязательно**: ❌
- **Значение по умолчанию**: `true`
- **Описание**: конфигурация поля `updatedAt`.
- **Пример**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Пользовательское имя для поля updatedAt
  fields: [...]
}
```

### `deletedAt` - Поле мягкого удаления
- **Тип**: `boolean | string`
- **Обязательно**: ❌
- **Значение по умолчанию**: `false`
- **Описание**: конфигурация поля обратимого удаления.
- **Пример**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Включить мягкое удаление
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Режим мягкого удаления
- **Тип**: `boolean`
- **Обязательно**: ❌
- **Значение по умолчанию**: `false`
- **Описание**: включить ли режим обратимого удаления.
- **Пример**:
```typescript
{
  name: 'users',
  paranoid: true,  // Включить мягкое удаление
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Именование с подчеркиванием
- **Тип**: `boolean`
- **Обязательно**: ❌
- **Значение по умолчанию**: `false`
- **Описание**: использовать ли стиль именования с подчеркиванием.
- **Пример**:
```typescript
{
  name: 'users',
  underscored: true,  // Использовать стиль именования с подчёркиванием
  fields: [...]
}
```

### `indexes` - Конфигурация индексов
- **Тип**: `ModelIndexesOptions[]`
- **Обязательно**: ❌
- **Описание**: конфигурация индекса базы данных.
- **Пример**:
```typescript
{
  name: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username', 'status']
    }
  ],
  fields: [...]
}
```

## Конфигурация параметров поля

NocoBase поддерживает несколько типов полей, все из которых определены на основе типа объединения `FieldOptions`. Конфигурация поля включает в себя базовые свойства, свойства, специфичные для типа данных, свойства отношений и свойства внешнего интерфейса.

### Основные параметры поля

Все типы полей наследуются от `BaseFieldOptions`, обеспечивая общие возможности настройки полей:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Общие параметры
  name?: string;                    // Имя поля
  hidden?: boolean;                 // Скрытое
  validation?: ValidationOptions<T>; // Правила проверки

  // Общие свойства полей столбца
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Связано с фронтендом
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Пример**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Не разрешать значения null
  unique: true,           // Уникальное ограничение
  defaultValue: '',       // По умолчанию пустая строка
  index: true,            // Создать индекс
  comment: 'User login name'    // Комментарий в базе данных
}
```

### `name` - Имя поля

- **Тип**: `string`
- **Обязательно**: ❌
- **Описание**: имя столбца поля в базе данных, которое должно быть уникальным в пределах коллекции.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'username',  // Имя поля
  title: 'Username'
}
```

### `hidden` - Скрыть поле

- **Тип**: `boolean`
- **Значение по умолчанию**: `false`
- **Описание**: следует ли скрывать это поле по умолчанию в списках и формах.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Скрыть внутреннее ID поля
  title: 'Internal ID'
}
```

### `validation` - Правила проверки

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Тип проверки
  rules: FieldValidationRule<T>[];  // Массив правил проверки
  [key: string]: any;              // Другие параметры проверки
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Ключ правила
  name: FieldValidationRuleName<T>; // Имя правила
  args?: {                         // Аргументы правила
    [key: string]: any;
  };
  paramsType?: 'object';           // Тип параметров
}
```

- **Тип**: `ValidationOptions<T>`
- **Описание**: используйте Joi для определения правил проверки на стороне сервера.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'email',
  validation: {
    type: 'string',
    rules: [
      { key: 'email', name: 'email' },
      { key: 'required', name: 'required' }
    ]
  }
}
```

### `allowNull` - Разрешить значения Null

- **Тип**: `boolean`
- **Значение по умолчанию**: `true`
- **Описание**: определяет, позволяет ли база данных записывать значения `NULL`.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Не разрешать значения null
  title: 'Username'
}
```

### `defaultValue` - Значение по умолчанию

- **Тип**: `any`
- **Описание**: значение поля по умолчанию, используемое при создании записи без указания значения для этого поля.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // По умолчанию статус draft
  title: 'Status'
}
```

### `unique` - Уникальное значение

- **Тип**: `boolean | string`
- **Значение по умолчанию**: `false`
- **Описание**: должно ли значение быть уникальным. Строку можно использовать для указания имени ограничения.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // Email должен быть уникальным
  title: 'Email'
}
```

### `primaryKey` - Первичный ключ

- **Тип**: `boolean`
- **Значение по умолчанию**: `false`
- **Описание**: объявляет это поле первичным ключом.
- **Пример**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Установить как первичный ключ
  autoIncrement: true
}
```

### `autoIncrement` - Автоинкремент

- **Тип**: `boolean`
- **Значение по умолчанию**: `false`
- **Описание**: включает автоматическое приращение (применимо только к числовым полям).
- **Пример**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Автоинкремент
  primaryKey: true
}
```

### `field` - Имя столбца базы данных

- **Тип**: `string`
- **Описание**: указывает фактическое имя столбца базы данных (в соответствии с `field` в Sequelize).
- **Пример**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Имя столбца в базе данных
  title: 'User ID'
}
```

### `comment` - Комментарий к базе данных

- **Тип**: `string`
- **Описание**: комментарий к полю базы данных, используемый в целях документации.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'User login name, used for system login',  // Комментарий в базе данных
  title: 'Username'
}
```

### `title` - Отображаемый заголовок

- **Тип**: `string`
- **Описание**: отображаемый заголовок поля, обычно используемый во внешнем интерфейсе.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Username',  // Заголовок, отображаемый на фронтенде
  allowNull: false
}
```

### `description` - Описание поля

- **Тип**: `string`
- **Описание**: описательная информация о поле, помогающая пользователям понять его назначение.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'Email',
  description: 'Please enter a valid email address',  // Описание поля
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Компонент интерфейса

- **Тип**: `string`
- **Описание**: рекомендуемый компонент внешнего интерфейса для данного поля.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Content',
  interface: 'textarea',  // Рекомендуется использовать компонент textarea
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Интерфейсы типов полей

### `type: 'string'` - Строковое поле

- **Описание**: используется для хранения коротких текстовых данных. Поддерживает ограничения длины и автоматическую обрезку.
- **Тип базы данных**: `VARCHAR`
- **Особые свойства**:
  - `length`: ограничение длины строки.
  - `trim`: автоматически удалять начальные и конечные пробелы.

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Ограничение длины строки
  trim?: boolean;     // Автоматически удалять начальные и конечные пробелы
}
```

**Пример**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Username',
  length: 50,           // Максимум 50 символов
  trim: true,           // Автоматически удалять пробелы
    allowNull: false,
    unique: true,
    validation: {
      type: 'string',
      rules: [
        { key: 'min', name: 'min', args: { limit: 3 } },
      { key: 'max', name: 'max', args: { limit: 20 } }
    ]
  }
}
```

### `type: 'text'` - Текстовое поле

- **Описание**: используется для хранения длинных текстовых данных. Поддерживает различные типы текста в MySQL.
- **Тип базы данных**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Особые свойства**:
  - `length`: тип длины текста MySQL (`tiny`/`medium`/`long`).

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Тип длины текста MySQL
}
```

**Пример**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Content',
  length: 'medium',     // Использовать MEDIUMTEXT
  allowNull: true
}
```

### Числовые типы

### `type: 'integer'` - Целочисленное поле

- **Описание**: используется для хранения целочисленных данных. Поддерживает автоинкремент и первичный ключ.
- **Тип базы данных**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Наследует все параметры от типа Sequelize INTEGER
}
```

**Пример**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'ID',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - Большое целочисленное поле

- **Описание**: используется для хранения больших целочисленных данных с диапазоном, превышающим `integer`.
- **Тип базы данных**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Пример**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'User ID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Поле с плавающей запятой

- **Описание**: используется для хранения чисел одинарной точности с плавающей запятой.
- **Тип базы данных**: `FLOAT`
- **Особые свойства**:
  - `precision`: Общее количество цифр.
  - `scale`: количество десятичных знаков.

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Точность
  scale?: number;      // Масштаб (количество знаков после запятой)
}
```

**Пример**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Score',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Поле с плавающей запятой двойной точности

- **Описание**: используется для хранения чисел двойной точности с плавающей запятой, точность которых выше, чем `float`.
- **Тип базы данных**: `DOUBLE`
- **Особые свойства**:
  - `precision`: Общее количество цифр.
  - `scale`: количество десятичных знаков.

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;      // Масштаб (количество знаков после запятой)
}
```

**Пример**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Price',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Поле `real`

- **Описание**: используется для хранения действительных чисел; зависит от базы данных.
- **Тип базы данных**: `REAL`
- **Особые свойства**:
  - `precision`: Общее количество цифр.
  - `scale`: количество десятичных знаков.

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Пример**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Rate',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Десятичное поле

- **Описание**: используется для хранения точных десятичных чисел, подходит для финансовых расчетов.
- **Тип базы данных**: `DECIMAL`
- **Особые свойства**:
  - `precision`: Общее количество цифр.
  - `scale`: количество десятичных знаков.

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Точность (общее количество цифр)
  scale?: number;      // Масштаб (количество знаков после запятой)
}
```

**Пример**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Amount',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00,
  validation: {
    type: 'number',
    rules: [
      { key: 'min', name: 'min', args: { limit: 0 } }
    ]
  }
}
```

### Логические типы

### `type: 'boolean'` - Логическое поле

- **Описание**: используется для хранения значений true/false, обычно для состояний включения/выключения.
- **Тип базы данных**: `BOOLEAN` или `TINYINT(1)`.

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Пример**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Is Active',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Поле `radio`

- **Описание**: используется для хранения одного выбранного значения, обычно для двоичных вариантов.
- **Тип базы данных**: `BOOLEAN` или `TINYINT(1)`.

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Пример**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Is Default',
  defaultValue: false,
  allowNull: false
}
```

### Типы даты и времени

### `type: 'date'` - Поле даты

- **Описание**: используется для хранения данных даты без информации о времени.
- **Тип базы данных**: `DATE`
- **Особые свойства**:
  - `timezone`: включать ли информацию о часовом поясе.

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Включать ли информацию о часовом поясе
}
```

**Пример**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Birthday',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Поле времени

- **Описание**: используется для хранения данных времени без информации о дате.
- **Тип базы данных**: `TIME`
- **Особые свойства**:
  - `timezone`: включать ли информацию о часовом поясе.

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Пример**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Start Time',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Дата и время с часовым поясом

- **Описание**: используется для хранения данных о дате и времени с информацией о часовом поясе.
- **Тип базы данных**: `TIMESTAMP WITH TIME ZONE`
- **Особые свойства**:
  - `timezone`: включать ли информацию о часовом поясе.

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Пример**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Created At',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Дата и время без часового пояса

- **Описание**: используется для хранения данных о дате и времени без информации о часовом поясе.
- **Тип базы данных**: `TIMESTAMP` или `DATETIME`.
- **Особые свойства**:
  - `timezone`: включать ли информацию о часовом поясе.

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Пример**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Updated At',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Поле только даты

- **Описание**: используется для хранения данных, содержащих только дату, без времени.
- **Тип базы данных**: `DATE`
- **Пример**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Publish Date',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Поле временной метки Unix

- **Описание**: используется для хранения данных временных меток Unix.
- **Тип базы данных**: `BIGINT`
- **Особые свойства**:
  - `epoch`: Время эпохи.

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Время эпохи
}
```

**Пример**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Last Login At',
  allowNull: true,
  epoch: 0
}
```

### Типы JSON

### `type: 'json'` - Поле JSON

- **Описание**: используется для хранения данных в формате JSON, поддерживая сложные структуры данных.
- **Тип базы данных**: `JSON` или `TEXT`.
- **Пример**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadata',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Поле JSONB

- **Описание**: используется для хранения данных в формате JSONB (специфично для PostgreSQL), который поддерживает индексирование и запросы.
- **Тип базы данных**: `JSONB` (PostgreSQL)
- **Пример**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Configuration',
  allowNull: true,
  defaultValue: {}
}
```

### Типы массивов

### `type: 'array'` - Поле массива

- **Описание**: используется для хранения данных массива, поддерживает различные типы элементов.
- **Тип базы данных**: `JSON` или `ARRAY`.
- **Особые свойства**:
  - `dataType`: тип хранилища (`json`/`array`).
  - `elementType`: тип элемента (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`).

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Тип хранилища
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Тип элемента
}
```

**Пример**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Tags',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Поле-множество

- **Описание**: используется для хранения наборов данных, которые аналогичны массиву, но с ограничением уникальности.
- **Тип базы данных**: `JSON` или `ARRAY`.
- **Особые свойства**:
  - `dataType`: тип хранилища (`json`/`array`).
  - `elementType`: тип элемента (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`).

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Пример**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Categories',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Типы идентификаторов

### `type: 'uuid'` - Поле UUID

- **Описание**: используется для хранения уникальных идентификаторов в формате UUID.
- **Тип базы данных**: `UUID` или `VARCHAR(36)`.
- **Особые свойства**:
  - `autoFill`: автоматически заполняет значение.

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Автозаполнение
}
```

**Пример**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'ID',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - Поле Nanoid

- **Описание**: используется для хранения коротких уникальных идентификаторов в формате Nanoid.
- **Тип базы данных**: `VARCHAR`
- **Особые свойства**:
  - `size`: Длина идентификатора.
  - `customAlphabet`: собственный набор символов.
  - `autoFill`: автоматически заполняет значение.

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Длина идентификатора
  customAlphabet?: string;  // Пользовательский набор символов
  autoFill?: boolean;
}
```

**Пример**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Short ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Пользовательское поле UID

- **Описание**: используется для хранения уникальных идентификаторов в специальном формате.
- **Тип базы данных**: `VARCHAR`
- **Особые свойства**:
  - `prefix`: префикс идентификатора.
  - `pattern`: шаблон проверки.

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Префикс
  pattern?: string; // Шаблон проверки
}
```

**Пример**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Code',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Поле Snowflake ID

- **Описание**: используется для хранения уникальных идентификаторов, сгенерированных алгоритмом Snowflake.
- **Тип базы данных**: `BIGINT`
- **Пример**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### Функциональные поля

### `type: 'password'` - Поле пароля

- **Описание**: используется для хранения зашифрованных данных пароля.
- **Тип базы данных**: `VARCHAR`
- **Особые свойства**:
  - `length`: длина хеша.
  - `randomBytesSize`: размер случайных байтов.

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Длина хеша
  randomBytesSize?: number;  // Размер случайных байтов
}
```

**Пример**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Password',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Поле шифрования

- **Описание**: используется для хранения зашифрованных конфиденциальных данных.
- **Тип базы данных**: `VARCHAR`
- **Пример**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Secret',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Виртуальное поле

- **Описание**: используется для хранения рассчитанных виртуальных данных, которые не хранятся в базе данных.
- **Тип базы данных**: Нет (виртуальное поле).
- **Пример**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Full Name'
}
```

### `type: 'context'` - Поле контекста

- **Описание**: используется для чтения данных из контекста времени выполнения (например, текущей информации о пользователе).
- **Тип базы данных**: определяется `dataType`.
- **Особые свойства**:
  - `dataIndex`: путь к индексу данных.
  - `dataType`: тип данных.
  - `createOnly`: устанавливается только при создании.

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Путь к индексу данных
  dataType?: string;   // Тип данных
  createOnly?: boolean; // Устанавливается только при создании
}
```

**Пример**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'Current User ID',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Поля отношений

### `type: 'belongsTo'` - Отношение принадлежности

- **Описание**: представляет отношение «многие к одному», при котором текущая запись принадлежит другой записи.
- **Тип базы данных**: поле внешнего ключа.
- **Особые свойства**:
  - `target`: имя целевой коллекции.
  - `foreignKey`: имя поля внешнего ключа.
  - `targetKey`: имя целевого ключевого поля в целевой коллекции.
  - `onDelete`: каскадное действие при удалении.
  - `onUpdate`: каскадное действие при обновлении.
  - `constraints`: включить ли ограничения внешнего ключа.

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Имя целевой коллекции
  foreignKey?: string;  // Имя поля внешнего ключа
  targetKey?: string;   // Имя целевого ключа в целевой коллекции
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Включить ли ограничения внешнего ключа
}
```

**Пример**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Author',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Отношение к-одному

- **Описание**: представляет связь «один к одному», при которой текущая запись имеет одну связанную запись.
- **Тип базы данных**: поле внешнего ключа.
- **Особые свойства**:
  - `target`: имя целевой коллекции.
  - `foreignKey`: имя поля внешнего ключа.
  - `sourceKey`: имя поля исходного ключа в исходной коллекции.
  - `onDelete`: каскадное действие при удалении.
  - `onUpdate`: каскадное действие при обновлении.
  - `constraints`: включить ли ограничения внешнего ключа.

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Имя поля исходного ключа
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Пример**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'User Profile',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Отношение ко-многим

- **Описание**: представляет связь «один-ко-многим», при которой текущая запись имеет несколько связанных записей.
- **Тип базы данных**: поле внешнего ключа.
- **Особые свойства**:
  - `target`: имя целевой коллекции.
  - `foreignKey`: имя поля внешнего ключа.
  - `sourceKey`: имя поля исходного ключа в исходной коллекции.
  - `sortBy`: поле сортировки.
  - `sortable`: можно ли сортировать поле.
  - `onDelete`: каскадное действие при удалении.
  - `onUpdate`: каскадное действие при обновлении.
  - `constraints`: включить ли ограничения внешнего ключа.

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Поле сортировки
  sortable?: boolean; // Можно ли сортировать
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Пример**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Posts',
  target: 'articles',
  foreignKey: 'authorId',
  sourceKey: 'id',
    sortBy: ['createdAt'],
  sortable: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'belongsToMany'` - Отношение многие ко многим

- **Описание**: представляет связь «многие ко многим», соединяющую две коллекции через соединительную таблицу.
- **Тип базы данных**: Соединительная таблица.
- **Особые свойства**:
  - `target`: имя целевой коллекции.
  - `through`: имя таблицы соединений.
  - `foreignKey`: имя поля внешнего ключа.
  - `otherKey`: другой внешний ключ в соединительной таблице.
  - `sourceKey`: имя поля исходного ключа в исходной коллекции.
  - `targetKey`: имя целевого ключевого поля в целевой коллекции.
  - `onDelete`: каскадное действие при удалении.
  - `onUpdate`: каскадное действие при обновлении.
  - `constraints`: включить ли ограничения внешнего ключа.

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Имя соединительной таблицы
  foreignKey?: string;
  otherKey?: string;  // Второй внешний ключ в соединительной таблице
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Пример**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Tags',
  target: 'article_tags',
  through: 'article_tag_relations',
  foreignKey: 'articleId',
  otherKey: 'tagId',
  sourceKey: 'id',
  targetKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```