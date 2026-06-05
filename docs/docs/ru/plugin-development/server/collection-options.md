:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

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
- **Обязательный**: ✅
- **Описание**: Уникальный идентификатор для коллекции, который должен быть уникальным во всем приложении.
- **Пример**:
```typescript
{
  name: 'users'  // Коллекция пользователей
}
```

### `title` - Заголовок коллекции
- **Тип**: `string`
- **Обязательный**: ❌
- **Описание**: Отображаемый заголовок коллекции, используемый для отображения в пользовательском интерфейсе.
- **Пример**:
```typescript
{
  name: 'users',
  title: 'Управление пользователями'  // В интерфейсе отображается как "Управление пользователями"
}
```

### `migrationRules` - Правила миграции
- **Тип**: `MigrationRule[]`
- **Обязательный**: ❌
- **Описание**: Правила обработки данных при миграции.
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
- **Обязательный**: ❌
- **Описание**: Наследует определения полей из других коллекций. Поддерживает наследование от одной или нескольких коллекций.
- **Пример**:

```typescript
// Единичное наследование
{
  name: 'admin_users',
  inherits: 'users',  // Наследует все поля из коллекции пользователей
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
  inherits: ['users', 'admin_users'],  // Наследует от нескольких коллекций
  fields: [...]
}
```

### `filterTargetKey` - Ключ для фильтрации
- **Тип**: `string | string[]`
- **Обязательный**: ❌
- **Описание**: Целевой ключ, используемый для фильтрации запросов. Поддерживает один или несколько ключей.
- **Пример**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Фильтрация по ID пользователя
  fields: [...]
}

// Несколько ключей для фильтрации
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Фильтрация по ID пользователя и ID категории
  fields: [...]
}
```

### `fields` - Определения полей
- **Тип**: `FieldOptions[]`
- **Обязательный**: ❌
- **Значение по умолчанию**: `[]`
- **Описание**: Массив определений полей для коллекции. Каждое поле включает такую информацию, как тип, имя и конфигурация.
- **Пример**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Имя пользователя'
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
      title: 'Пароль'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Время создания'
    }
  ]
}
```

### `model` - Пользовательская модель
- **Тип**: `string | ModelStatic<Model>`
- **Обязательный**: ❌
- **Описание**: Укажите пользовательский класс модели Sequelize, это может быть как имя класса, так и сам класс модели.
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
- **Обязательный**: ❌
- **Описание**: Укажите пользовательский класс репозитория для обработки логики доступа к данным.
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

### `autoGenId` - Автоматическая генерация ID
- **Тип**: `boolean`
- **Обязательный**: ❌
- **Значение по умолчанию**: `true`
- **Описание**: Определяет, нужно ли автоматически генерировать ID первичного ключа.
- **Пример**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Автоматически генерировать ID первичного ключа
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
- **Обязательный**: ❌
- **Значение по умолчанию**: `true`
- **Описание**: Определяет, следует ли включать поля `createdAt` и `updatedAt`.
- **Пример**:
```typescript
{
  name: 'users',
  timestamps: true,  // Включить временные метки
  fields: [...]
}
```

### `createdAt` - Поле "Время создания"
- **Тип**: `boolean | string`
- **Обязательный**: ❌
- **Значение по умолчанию**: `true`
- **Описание**: Конфигурация для поля `createdAt`.
- **Пример**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Пользовательское имя для поля createdAt
  fields: [...]
}
```

### `updatedAt` - Поле "Время обновления"
- **Тип**: `boolean | string`
- **Обязательный**: ❌
- **Значение по умолчанию**: `true`
- **Описание**: Конфигурация для поля `updatedAt`.
- **Пример**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Пользовательское имя для поля updatedAt
  fields: [...]
}
```

### `deletedAt` - Поле "Мягкое удаление"
- **Тип**: `boolean | string`
- **Обязательный**: ❌
- **Значение по умолчанию**: `false`
- **Описание**: Конфигурация для поля мягкого удаления.
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
- **Обязательный**: ❌
- **Значение по умолчанию**: `false`
- **Описание**: Определяет, следует ли включать режим мягкого удаления.
- **Пример**:
```typescript
{
  name: 'users',
  paranoid: true,  // Включить мягкое удаление
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Именование в стиле snake_case
- **Тип**: `boolean`
- **Обязательный**: ❌
- **Значение по умолчанию**: `false`
- **Описание**: Определяет, следует ли использовать стиль именования с подчеркиваниями (snake_case).
- **Пример**:
```typescript
{
  name: 'users',
  underscored: true,  // Использовать стиль именования с подчеркиваниями
  fields: [...]
}
```

### `indexes` - Конфигурация индексов
- **Тип**: `ModelIndexesOptions[]`
- **Обязательный**: ❌
- **Описание**: Конфигурация индексов базы данных.
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

## Конфигурация параметров полей

NocoBase поддерживает различные типы полей, все они определяются на основе объединенного типа `FieldOptions`. Конфигурация поля включает базовые свойства, свойства, специфичные для типа данных, свойства отношений и свойства для рендеринга на фронтенде.

### Базовые опции полей

Все типы полей наследуются от `BaseFieldOptions`, предоставляя общие возможности конфигурации полей:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Общие параметры
  name?: string;                    // Имя поля
  hidden?: boolean;                 // Скрыто ли поле
  validation?: ValidationOptions<T>; // Правила валидации

  // Общие свойства поля-столбца
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Связанное с фронтендом
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
  allowNull: false,        // Не допускать NULL значений
  unique: true,           // Уникальное ограничение
  defaultValue: '',       // Значение по умолчанию — пустая строка
  index: true,            // Создать индекс
  comment: 'Имя пользователя для входа'    // Комментарий в базе данных
}
```

### `name` - Имя поля

- **Тип**: `string`
- **Обязательный**: ❌
- **Описание**: Имя столбца поля в базе данных, которое должно быть уникальным в пределах коллекции.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'username',  // Имя поля
  title: 'Имя пользователя'
}
```

### `hidden` - Скрытое поле

- **Тип**: `boolean`
- **Значение по умолчанию**: `false`
- **Описание**: Определяет, следует ли скрывать это поле по умолчанию в списках и формах.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Скрыть поле внутреннего ID
  title: 'Внутренний ID'
}
```

### `validation` - Правила валидации

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Тип валидации
  rules: FieldValidationRule<T>[];  // Массив правил валидации
  [key: string]: any;              // Другие опции валидации
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Ключ правила
  name: FieldValidationRuleName<T>; // Имя правила
  args?: {                         // Аргументы правила
    [key: string]: any;
  };
  paramsType?: 'object';           // Тип параметра
}
```

- **Тип**: `ValidationOptions<T>`
- **Описание**: Используйте Joi для определения правил валидации на стороне сервера.
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

### `allowNull` - Разрешить NULL значения

- **Тип**: `boolean`
- **Значение по умолчанию**: `true`
- **Описание**: Определяет, разрешает ли база данных запись значений `NULL`.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Не допускать NULL значений
  title: 'Имя пользователя'
}
```

### `defaultValue` - Значение по умолчанию

- **Тип**: `any`
- **Описание**: Значение по умолчанию для поля, которое используется, если при создании записи значение для этого поля не указано.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // По умолчанию статус "черновик"
  title: 'Статус'
}
```

### `unique` - Уникальное ограничение

- **Тип**: `boolean | string`
- **Значение по умолчанию**: `false`
- **Описание**: Определяет, должно ли значение быть уникальным. Строка может использоваться для указания имени ограничения.
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
- **Описание**: Объявляет это поле первичным ключом.
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
- **Описание**: Включает автоинкремент (применимо только к числовым полям).
- **Пример**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Автоматическое увеличение
  primaryKey: true
}
```

### `field` - Имя столбца в базе данных

- **Тип**: `string`
- **Описание**: Указывает фактическое имя столбца в базе данных (соответствует полю `field` в Sequelize).
- **Пример**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Имя столбца в базе данных
  title: 'ID пользователя'
}
```

### `comment` - Комментарий в базе данных

- **Тип**: `string`
- **Описание**: Комментарий для поля базы данных, используемый для документации.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Имя пользователя для входа в систему',  // Комментарий в базе данных
  title: 'Имя пользователя'
}
```

### `title` - Отображаемый заголовок

- **Тип**: `string`
- **Описание**: Отображаемый заголовок для поля, обычно используемый в пользовательском интерфейсе.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Имя пользователя',  // Заголовок, отображаемый на фронтенде
  allowNull: false
}
```

### `description` - Описание поля

- **Тип**: `string`
- **Описание**: Описательная информация о поле, помогающая пользователям понять его назначение.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'Email',
  description: 'Пожалуйста, введите действительный адрес электронной почты',  // Описание поля
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Компонент интерфейса

- **Тип**: `string`
- **Описание**: Рекомендуемый компонент пользовательского интерфейса для поля на фронтенде.
- **Пример**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Содержимое',
  interface: 'textarea',  // Рекомендуется использовать компонент текстового поля (textarea)
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Интерфейсы типов полей

### `type: 'string'` - Строковое поле

- **Описание**: Используется для хранения коротких текстовых данных. Поддерживает ограничения длины и автоматическое удаление пробелов.
- **Тип базы данных**: `VARCHAR`
- **Специфические свойства**:
  - `length`: Ограничение длины строки
  - `trim`: Автоматически ли удалять начальные и конечные пробелы

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Ограничение длины строки
  trim?: boolean;     // Автоматически ли удалять начальные и конечные пробелы
}
```

**Пример**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Имя пользователя',
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

- **Описание**: Используется для хранения длинных текстовых данных. Поддерживает различные типы текста в MySQL.
- **Тип базы данных**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Специфические свойства**:
  - `length`: Тип длины текста MySQL (`tiny`/`medium`/`long`)

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
  title: 'Содержимое',
  length: 'medium',     // Использовать MEDIUMTEXT
  allowNull: true
}
```

### Числовые типы

### `type: 'integer'` - Целочисленное поле

- **Описание**: Используется для хранения целочисленных данных. Поддерживает автоинкремент и первичный ключ.
- **Тип базы данных**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Наследует все опции из типа Sequelize INTEGER
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

### `type: 'bigInt'` - Поле большого целого числа

- **Описание**: Используется для хранения больших целочисленных данных, диапазон которых шире, чем у `integer`.
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
  title: 'ID пользователя',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Поле с плавающей точкой

- **Описание**: Используется для хранения чисел с плавающей точкой одинарной точности.
- **Тип базы данных**: `FLOAT`
- **Специфические свойства**:
  - `precision`: Точность (общее количество цифр)
  - `scale`: Количество знаков после запятой

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Точность
  scale?: number;      // Количество знаков после запятой
}
```

**Пример**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Оценка',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Поле с плавающей точкой двойной точности

- **Описание**: Используется для хранения чисел с плавающей точкой двойной точности, которые имеют более высокую точность, чем `float`.
- **Тип базы данных**: `DOUBLE`
- **Специфические свойства**:
  - `precision`: Точность (общее количество цифр)
  - `scale`: Количество знаков после запятой

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Пример**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Цена',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Вещественное поле

- **Описание**: Используется для хранения вещественных чисел; зависит от базы данных.
- **Тип базы данных**: `REAL`
- **Специфические свойства**:
  - `precision`: Точность (общее количество цифр)
  - `scale`: Количество знаков после запятой

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
  title: 'Курс',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Десятичное поле с точной точностью

- **Описание**: Используется для хранения точных десятичных чисел, подходит для финансовых расчетов.
- **Тип базы данных**: `DECIMAL`
- **Специфические свойства**:
  - `precision`: Точность (общее количество цифр)
  - `scale`: Количество знаков после запятой

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Точность (общее количество цифр)
  scale?: number;      // Количество знаков после запятой
}
```

**Пример**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Сумма',
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

### Булевы типы

### `type: 'boolean'` - Булево поле

- **Описание**: Используется для хранения значений истина/ложь, обычно для состояний включения/выключения.
- **Тип базы данных**: `BOOLEAN` или `TINYINT(1)`

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
  title: 'Активно ли',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Поле "Радиокнопка"

- **Описание**: Используется для хранения одного выбранного значения, обычно для бинарного выбора.
- **Тип базы данных**: `BOOLEAN` или `TINYINT(1)`

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
  title: 'По умолчанию ли',
  defaultValue: false,
  allowNull: false
}
```

### Типы даты и времени

### `type: 'date'` - Поле даты

- **Описание**: Используется для хранения данных даты без информации о времени.
- **Тип базы данных**: `DATE`
- **Специфические свойства**:
  - `timezone`: Включать ли информацию о часовом поясе

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
  title: 'Дата рождения',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Поле времени

- **Описание**: Используется для хранения данных времени без информации о дате.
- **Тип базы данных**: `TIME`
- **Специфические свойства**:
  - `timezone`: Включать ли информацию о часовом поясе

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
  title: 'Время начала',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Поле даты и времени с часовым поясом

- **Описание**: Используется для хранения данных даты и времени с информацией о часовом поясе.
- **Тип базы данных**: `TIMESTAMP WITH TIME ZONE`
- **Специфические свойства**:
  - `timezone`: Включать ли информацию о часовом поясе

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
  title: 'Время создания',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Поле даты и времени без часового пояса

- **Описание**: Используется для хранения данных даты и времени без информации о часовом поясе.
- **Тип базы данных**: `TIMESTAMP` или `DATETIME`
- **Специфические свойства**:
  - `timezone`: Включать ли информацию о часовом поясе

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
  title: 'Время обновления',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Поле только для даты

- **Описание**: Используется для хранения данных, содержащих только дату, без времени.
- **Тип базы данных**: `DATE`
- **Пример**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Дата публикации',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Поле временной метки Unix

- **Описание**: Используется для хранения данных временной метки Unix.
- **Тип базы данных**: `BIGINT`
- **Специфические свойства**:
  - `epoch`: Эпоха (начало отсчета времени)

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Эпоха
}
```

**Пример**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Время последнего входа',
  allowNull: true,
  epoch: 0
}
```

### Типы JSON

### `type: 'json'` - Поле JSON

- **Описание**: Используется для хранения данных в формате JSON, поддерживая сложные структуры данных.
- **Тип базы данных**: `JSON` или `TEXT`
- **Пример**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Метаданные',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Поле JSONB

- **Описание**: Используется для хранения данных в формате JSONB (специфично для PostgreSQL), который поддерживает индексирование и запросы.
- **Тип базы данных**: `JSONB` (PostgreSQL)
- **Пример**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Конфигурация',
  allowNull: true,
  defaultValue: {}
}
```

### Типы массивов

### `type: 'array'` - Поле массива

- **Описание**: Используется для хранения данных массива, поддерживая различные типы элементов.
- **Тип базы данных**: `JSON` или `ARRAY`
- **Специфические свойства**:
  - `dataType`: Тип хранения (`json`/`array`)
  - `elementType`: Тип элемента (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Тип хранения
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Тип элемента
}
```

**Пример**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Теги',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Поле набора

- **Описание**: Используется для хранения данных набора, который похож на массив, но имеет ограничение уникальности.
- **Тип базы данных**: `JSON` или `ARRAY`
- **Специфические свойства**:
  - `dataType`: Тип хранения (`json`/`array`)
  - `elementType`: Тип элемента (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`)

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
      title: 'Категории',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Типы идентификаторов

### `type: 'uuid'` - Поле UUID

- **Описание**: Используется для хранения уникальных идентификаторов в формате UUID.
- **Тип базы данных**: `UUID` или `VARCHAR(36)`
- **Специфические свойства**:
  - `autoFill`: Автоматическое заполнение

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Автоматическое заполнение
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

- **Описание**: Используется для хранения коротких уникальных идентификаторов в формате Nanoid.
- **Тип базы данных**: `VARCHAR`
- **Специфические свойства**:
  - `size`: Длина ID
  - `customAlphabet`: Пользовательский набор символов
  - `autoFill`: Автоматическое заполнение

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Длина ID
  customAlphabet?: string;  // Пользовательский набор символов
  autoFill?: boolean;
}
```

**Пример**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Короткий ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Пользовательское поле UID

- **Описание**: Используется для хранения уникальных идентификаторов в пользовательском формате.
- **Тип базы данных**: `VARCHAR`
- **Специфические свойства**:
  - `prefix`: Префикс
  - `pattern`: Шаблон валидации

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Префикс
  pattern?: string; // Шаблон валидации
}
```

**Пример**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Код',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Поле Snowflake ID

- **Описание**: Используется для хранения уникальных идентификаторов, сгенерированных алгоритмом Snowflake.
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

- **Описание**: Используется для хранения зашифрованных данных пароля.
- **Тип базы данных**: `VARCHAR`
- **Специфические свойства**:
  - `length`: Длина хеша
  - `randomBytesSize`: Размер случайных байтов

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
  title: 'Пароль',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Поле шифрования

- **Описание**: Используется для хранения зашифрованных конфиденциальных данных.
- **Тип базы данных**: `VARCHAR`
- **Пример**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Секрет',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Виртуальное поле

- **Описание**: Используется для хранения вычисляемых виртуальных данных, которые не сохраняются в базе данных.
- **Тип базы данных**: Нет (виртуальное поле)
- **Пример**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Полное имя'
}
```

### `type: 'context'` - Поле контекста

- **Описание**: Используется для чтения данных из контекста выполнения (например, информации о текущем пользователе).
- **Тип базы данных**: Определяется по `dataType`.
- **Специфические свойства**:
  - `dataIndex`: Путь к индексу данных
  - `dataType`: Тип данных
  - `createOnly`: Устанавливать только при создании

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Путь к индексу данных
  dataType?: string;   // Тип данных
  createOnly?: boolean; // Устанавливать только при создании
}
```

**Пример**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID текущего пользователя',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Поля отношений

### `type: 'belongsTo'` - Отношение "принадлежит к"

- **Описание**: Представляет отношение "многие к одному", где текущая запись принадлежит другой записи.
- **Тип базы данных**: Поле внешнего ключа
- **Специфические свойства**:
  - `target`: Имя целевой коллекции
  - `foreignKey`: Имя поля внешнего ключа
  - `targetKey`: Имя ключевого поля в целевой коллекции
  - `onDelete`: Каскадное действие при удалении
  - `onUpdate`: Каскадное действие при обновлении
  - `constraints`: Включить ли ограничения внешнего ключа

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Имя целевой коллекции
  foreignKey?: string;  // Имя поля внешнего ключа
  targetKey?: string;   // Имя ключевого поля в целевой коллекции
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
  title: 'Автор',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Отношение "имеет один"

- **Описание**: Представляет отношение "один к одному", где текущая запись имеет одну связанную запись.
- **Тип базы данных**: Поле внешнего ключа
- **Специфические свойства**:
  - `target`: Имя целевой коллекции
  - `foreignKey`: Имя поля внешнего ключа
  - `sourceKey`: Имя ключевого поля в исходной коллекции
  - `onDelete`: Каскадное действие при удалении
  - `onUpdate`: Каскадное действие при обновлении
  - `constraints`: Включить ли ограничения внешнего ключа

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Имя ключевого поля в исходной коллекции
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
  title: 'Профиль пользователя',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Отношение "имеет много"

- **Описание**: Представляет отношение "один ко многим", где текущая запись имеет несколько связанных записей.
- **Тип базы данных**: Поле внешнего ключа
- **Специфические свойства**:
  - `target`: Имя целевой коллекции
  - `foreignKey`: Имя поля внешнего ключа
  - `sourceKey`: Имя ключевого поля в исходной коллекции
  - `sortBy`: Поле для сортировки
  - `sortable`: Возможность сортировки
  - `onDelete`: Каскадное действие при удалении
  - `onUpdate`: Каскадное действие при обновлении
  - `constraints`: Включить ли ограничения внешнего ключа

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Поле для сортировки
  sortable?: boolean; // Возможность сортировки
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
  title: 'Список статей',
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

### `type: 'belongsToMany'` - Отношение "многие ко многим"

- **Описание**: Представляет отношение "многие ко многим", соединяя две коллекции через промежуточную таблицу.
- **Тип базы данных**: Промежуточная таблица
- **Специфические свойства**:
  - `target`: Имя целевой коллекции
  - `through`: Имя промежуточной таблицы
  - `foreignKey`: Имя поля внешнего ключа
  - `otherKey`: Другой внешний ключ в промежуточной таблице
  - `sourceKey`: Имя ключевого поля в исходной коллекции
  - `targetKey`: Имя ключевого поля в целевой коллекции
  - `onDelete`: Каскадное действие при удалении
  - `onUpdate`: Каскадное действие при обновлении
  - `constraints`: Включить ли ограничения внешнего ключа

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Имя промежуточной таблицы
  foreignKey?: string;
  otherKey?: string;  // Другой внешний ключ в промежуточной таблице
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
  title: 'Теги',
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