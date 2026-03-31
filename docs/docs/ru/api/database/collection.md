:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Коллекция

## Обзор

`Коллекция` используется для определения моделей данных в системе, таких как имена моделей, поля, индексы, связи и другая информация.
Обычно она вызывается через метод `collection` экземпляра `Database` в качестве точки входа-прокси.

```javascript
const { Database } = require('@nocobase/database')

// Создаем экземпляр базы данных
const db = new Database({...});

// Определяем модель данных
db.collection({
  name: 'users',
  // Определяем поля модели
  fields: [
    // Скалярное поле
    {
      name: 'name',
      type: 'string',
    },

    // Поле связи
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Больше типов полей смотрите в разделе [Поля](/api/database/field).

## Конструктор

**Сигнатура**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Параметры**

| Параметр              | Тип                                                         | Значение по умолчанию | Описание                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| `options.name`        | `string`                                                    | -      | Идентификатор коллекции                                                                    |
| `options.tableName?`  | `string`                                                    | -      | Имя таблицы в базе данных. Если не указано, будет использоваться значение `options.name`. |
| `options.fields?`     | `FieldOptions[]`                                            | -      | Определения полей. Подробности смотрите в разделе [Поле](./field).                         |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | Тип модели Sequelize. Если используется `string`, имя модели должно быть предварительно зарегистрировано в базе данных. |
| `options.repository?` | `string \| RepositoryType`                                  | -      | Тип репозитория. Если используется `string`, тип репозитория должен быть предварительно зарегистрирован в базе данных. |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | Конфигурация поля для сортировки данных. По умолчанию сортировка не применяется.          |
| `options.autoGenId?`  | `boolean`                                                   | `true` | Автоматически генерировать уникальный первичный ключ. По умолчанию `true`.                |
| `context.database`    | `Database`                                                  | -      | Экземпляр базы данных в текущем контексте.                                                 |

**Пример**

Создание коллекции постов:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // Существующий экземпляр базы данных
    database: db,
  },
);
```

## Члены экземпляра

### `options`

Начальные параметры конфигурации коллекции. Совпадают с параметром `options` конструктора.

### `context`

Контекст, к которому принадлежит текущая коллекция; в настоящее время это в основном экземпляр базы данных.

### `name`

Имя коллекции.

### `db`

Экземпляр базы данных, к которому она принадлежит.

### `filterTargetKey`

Имя поля, используемого в качестве первичного ключа.

### `isThrough`

Является ли это промежуточной коллекцией.

### `model`

Соответствует типу модели Sequelize.

### `repository`

Экземпляр репозитория.

## Методы конфигурации полей

### `getField()`

Получает объект поля с соответствующим именем, определенный в коллекции.

**Сигнатура**

- `getField(name: string): Field`

**Параметры**

| Параметр | Тип     | Значение по умолчанию | Описание     |
| -------- | -------- | ------ | -------- |
| `name`   | `string` | -      | Имя поля |

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

Устанавливает поле для коллекции.

**Сигнатура**

- `setField(name: string, options: FieldOptions): Field`

**Параметры**

| Параметр  | Тип            | Значение по умолчанию | Описание                                                           |
| --------- | -------------- | ------ | ------------------------------------------------------------------ |
| `name`    | `string`       | -      | Имя поля                                                           |
| `options` | `FieldOptions` | -      | Конфигурация поля. Подробности смотрите в разделе [Поле](./field). |

**Пример**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Массово устанавливает несколько полей для коллекции.

**Сигнатура**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Параметры**

| Параметр      | Тип              | Значение по умолчанию | Описание                                                           |
| ------------- | ---------------- | ------ | ------------------------------------------------------------------ |
| `fields`      | `FieldOptions[]` | -      | Конфигурация полей. Подробности смотрите в разделе [Поле](./field). |
| `resetFields` | `boolean`        | `true` | Сбрасывать ли существующие поля.                                   |

**Пример**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Удаляет объект поля с соответствующим именем, определенный в коллекции.

**Сигнатура**

- `removeField(name: string): void | Field`

**Параметры**

| Параметр | Тип     | Значение по умолчанию | Описание     |
| -------- | -------- | ------ | -------- |
| `name`   | `string` | -      | Имя поля |

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

Сбрасывает (очищает) поля коллекции.

**Сигнатура**

- `resetFields(): void`

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

Проверяет, определен ли в коллекции объект поля с соответствующим именем.

**Сигнатура**

- `hasField(name: string): boolean`

**Параметры**

| Параметр | Тип     | Значение по умолчанию | Описание     |
| -------- | -------- | ------ | -------- |
| `name`   | `string` | -      | Имя поля |

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

Находит в коллекции объект поля, соответствующий заданным критериям.

**Сигнатура**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Параметры**

| Параметр    | Тип                         | Значение по умолчанию | Описание       |
| ----------- | --------------------------- | ------ | -------------- |
| `predicate` | `(field: Field) => boolean` | -      | Критерии поиска |

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

Перебирает объекты полей в коллекции.

**Сигнатура**

- `forEachField(callback: (field: Field) => void): void`

**Параметры**

| Параметр   | Тип                      | Значение по умолчанию | Описание           |
| ---------- | ------------------------ | ------ | ------------------ |
| `callback` | `(field: Field) => void` | -      | Функция обратного вызова |

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## Методы конфигурации индексов

### `addIndex()`

Добавляет индекс к коллекции.

**Сигнатура**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Параметры**

| Параметр | Тип                                                          | Значение по умолчанию | Описание                                 |
| -------- | ------------------------------------------------------------ | ------ | ---------------------------------------- |
| `index`  | `string \| string[]`                                         | -      | Имя(имена) поля(полей) для индексирования. |
| `index`  | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | Полная конфигурация.                     |

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

Удаляет индекс из коллекции.

**Сигнатура**

- `removeIndex(fields: string[])`

**Параметры**

| Параметр | Тип        | Значение по умолчанию | Описание                                 |
| -------- | ---------- | ------ | ---------------------------------------- |
| `fields` | `string[]` | -      | Комбинация имен полей для удаляемого индекса. |

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## Методы конфигурации коллекции

### `remove()`

Удаляет коллекцию.

**Сигнатура**

- `remove(): void`

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## Методы работы с базой данных

### `sync()`

Синхронизирует определение коллекции с базой данных. Помимо стандартной логики `Model.sync` в Sequelize, этот метод также обрабатывает коллекции, соответствующие полям связей.

**Сигнатура**

- `sync(): Promise<void>`

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

Проверяет, существует ли коллекция в базе данных.

**Сигнатура**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Параметры**

| Параметр               | Тип           | Значение по умолчанию | Описание           |
| ---------------------- | ------------- | ------ | ------------------ |
| `options?.transaction` | `Transaction` | -      | Экземпляр транзакции |

**Пример**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**Сигнатура**

- `removeFromDb(): Promise<void>`

**Пример**

```ts
const books = db.collection({
  name: 'books',
});

// Синхронизируем коллекцию книг с базой данных
await db.sync();

// Удаляем коллекцию книг из базы данных
await books.removeFromDb();
```