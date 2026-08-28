# Collection - Коллекция

## Обзор

`Коллекция` используется для определения моделей данных в системе, таких как имена моделей, поля, индексы, связи и другая информация.
Обычно она вызывается через метод `collection` экземпляра `Database` в качестве прокси-записи.

```javascript
const { Database } = require('@nocobase/database')

// Создать экземпляр базы данных
const db = new Database({...});

// Определить модель данных
db.collection({
  name: 'users',
  // Определить поля модели
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

Дополнительные типы полей см. в разделе [Поля](/api/database/field).

## Конструктор

**Сигнатура**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name` | `string` | - | идентификатор коллекции |
| `options.tableName?` | `string` | - | Имя таблицы базы данных. Если не указано, будет использоваться значение `options.name`. |
| `options.fields?` | `FieldOptions[]` | - | Определения полей. Подробности см. в разделе [Поле](./field). |
| `options.model?` | `string \| ModelStatic<Model>` | - | Тип модели секвелизации. Если используется `string`, название модели должно быть предварительно зарегистрировано в базе данных. |
| `options.repository?` | `string \| RepositoryType` | - | Тип репозитория. Если используется `string`, тип репозитория должен быть предварительно зарегистрирован в базе данных. |
| `options.sortable?` | `string \| boolean \| { name?: string; scopeKey?: string }` | - | Сортируемая конфигурация полей. По умолчанию не сортируется. |
| `options.autoGenId?` | `boolean` | `true` | Следует ли автоматически генерировать уникальный первичный ключ. По умолчанию `true`. |
| `context.database` | `Database` | - | База данных в текущем контексте. |

**Пример**

Создайте коллекцию постов:

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

Параметры начальной конфигурации коллекции. То же, что параметр `options` конструктора.

### `context`

Контекст, к которому принадлежит текущая коллекция, в настоящее время в основном экземпляр базы данных.

### `name`

Название коллекции.

### `db`

Экземпляр базы данных, которому он принадлежит.

### `filterTargetKey`

Имя поля, используемое в качестве первичного ключа.

### `isThrough`

Является ли это промежуточной коллекцией.

### `model`

Соответствует типу модели Sequelize.

### `repository`

Экземпляр репозитория.

## Методы настройки полей

### `getField()`

Получает объект поля с соответствующим именем, определенным в коллекции.

**Сигнатура**

- `getField(name: string): Field`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Имя поля |

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

| Параметр | Тип | По умолчанию | Описание |
| --------- | -------------- | ------ | ------------------------------- |
| `name` | `string` | - | Имя поля |
| `options` | `FieldOptions` | - | Конфигурация поля. Подробности см. в разделе [Поле](./field). |

**Пример**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Пакетно устанавливает несколько полей для коллекции.

**Сигнатура**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields` | `FieldOptions[]` | - | Конфигурация поля. Подробности см. в разделе [Поле](./field). |
| `resetFields` | `boolean` | `true` | Сбрасывать ли существующие поля. |

**Пример**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Удаляет объект поля с соответствующим именем, определенным в коллекции.

**Сигнатура**

- `removeField(name: string): void | Field`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Имя поля |

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

| Параметр | Тип | По умолчанию | Описание |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Имя поля |

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

posts.hasField('title'); // истинный
```

### `findField()`

Находит объект поля в коллекции, соответствующий критериям.

**Сигнатура**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | - | Критерии поиска |

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

| Параметр | Тип | По умолчанию | Описание |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | - | Функция обратного вызова |

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

## Методы настройки индекса

### `addIndex()`

Добавляет индекс в коллекцию.

**Сигнатура**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]` | - | Имена полей, которые будут индексироваться. |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | - | Полная конфигурация. |

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

| Параметр | Тип | По умолчанию | Описание |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | - | Комбинация имен полей для удаляемого индекса. |

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

## Методы настройки коллекции

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

Синхронизирует определение коллекции с базой данных. В дополнение к логике `Model.sync` по умолчанию в Sequelize он также обрабатывает коллекции, соответствующие полям связи.

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

| Параметр | Тип | По умолчанию | Описание |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | - | Экземпляр транзакции |

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

console.log(existed); // ЛОЖЬ
```

### `removeFromDb()`

**Сигнатура**

- `removeFromDb(): Promise<void>`

**Пример**

```ts
const books = db.collection({
  name: 'books',
});

// Синхронизировать коллекцию книг с базой данных
await db.sync();

// Удалить коллекцию книг из базы данных
await books.removeFromDb();
```