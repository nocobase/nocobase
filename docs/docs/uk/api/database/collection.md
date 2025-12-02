:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Колекція

## Огляд

`Колекція` використовується для визначення моделей даних у системі, таких як назви моделей, поля, індекси, асоціації та інша інформація.
Зазвичай її викликають через метод `collection` екземпляра `Database` як проксі-точку входу.

```javascript
const { Database } = require('@nocobase/database')

// Створіть екземпляр бази даних
const db = new Database({...});

// Визначте модель даних
db.collection({
  name: 'users',
  // Визначте поля моделі
  fields: [
    // Скалярне поле
    {
      name: 'name',
      type: 'string',
    },

    // Поле асоціації
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Більше типів полів дивіться у розділі [Поля](/api/database/field).

## Конструктор

**Підпис**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Параметри**

| Параметр              | Тип                                                         | За замовчуванням | Опис                                                                                   |
| --------------------- | ----------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -                | ідентифікатор колекції                                                                 |
| `options.tableName?`  | `string`                                                    | -                | Назва таблиці бази даних. Якщо не вказано, буде використано значення `options.name`.   |
| `options.fields?`     | `FieldOptions[]`                                            | -                | Визначення полів. Детальніше дивіться у розділі [Поле](./field).                       |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -                | Тип моделі Sequelize. Якщо використовується `string`, назва моделі повинна бути попередньо зареєстрована в базі даних. |
| `options.repository?` | `string \| RepositoryType`                                  | -                | Тип репозиторію. Якщо використовується `string`, тип репозиторію повинен бути попередньо зареєстрований в базі даних. |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -                | Конфігурація поля для сортування. За замовчуванням не сортується.                     |
| `options.autoGenId?`  | `boolean`                                                   | `true`           | Чи автоматично генерувати унікальний первинний ключ. За замовчуванням `true`.          |
| `context.database`    | `Database`                                                  | -                | База даних у поточному контексті.                                                      |

**Приклад**

Створіть колекцію публікацій:

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
    // Існуючий екземпляр бази даних
    database: db,
  },
);
```

## Члени екземпляра

### `options`

Початкові параметри конфігурації для колекції. Збігаються з параметром `options` конструктора.

### `context`

Контекст, до якого належить поточна колекція, наразі це переважно екземпляр бази даних.

### `name`

Назва колекції.

### `db`

Екземпляр бази даних, до якого вона належить.

### `filterTargetKey`

Назва поля, що використовується як первинний ключ.

### `isThrough`

Чи є це проміжною колекцією.

### `model`

Відповідає типу моделі Sequelize.

### `repository`

Екземпляр репозиторію.

## Методи конфігурації полів

### `getField()`

Отримує об'єкт поля з відповідною назвою, визначений у колекції.

**Підпис**

- `getField(name: string): Field`

**Параметри**

| Параметр | Тип      | За замовчуванням | Опис      |
| -------- | -------- | ---------------- | --------- |
| `name`   | `string` | -                | Назва поля |

**Приклад**

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

Встановлює поле для колекції.

**Підпис**

- `setField(name: string, options: FieldOptions): Field`

**Параметри**

| Параметр  | Тип            | За замовчуванням | Опис                               |
| --------- | -------------- | ---------------- | ---------------------------------- |
| `name`    | `string`       | -                | Назва поля                         |
| `options` | `FieldOptions` | -                | Конфігурація поля. Детальніше дивіться у розділі [Поле](./field). |

**Приклад**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Встановлює кілька полів для колекції пакетом.

**Підпис**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Параметри**

| Параметр      | Тип              | За замовчуванням | Опис                               |
| ------------- | ---------------- | ---------------- | ---------------------------------- |
| `fields`      | `FieldOptions[]` | -                | Конфігурація полів. Детальніше дивіться у розділі [Поле](./field). |
| `resetFields` | `boolean`        | `true`           | Чи скидати існуючі поля.           |

**Приклад**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Видаляє об'єкт поля з відповідною назвою, визначений у колекції.

**Підпис**

- `removeField(name: string): void | Field`

**Параметри**

| Параметр | Тип      | За замовчуванням | Опис      |
| -------- | -------- | ---------------- | --------- |
| `name`   | `string` | -                | Назва поля |

**Приклад**

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

Скидає (очищає) поля колекції.

**Підпис**

- `resetFields(): void`

**Приклад**

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

Перевіряє, чи визначено об'єкт поля з відповідною назвою в колекції.

**Підпис**

- `hasField(name: string): boolean`

**Параметри**

| Параметр | Тип      | За замовчуванням | Опис      |
| -------- | -------- | ---------------- | --------- |
| `name`   | `string` | -                | Назва поля |

**Приклад**

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

Знаходить об'єкт поля в колекції, який відповідає критеріям.

**Підпис**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Параметри**

| Параметр    | Тип                         | За замовчуванням | Опис            |
| ----------- | --------------------------- | ---------------- | --------------- |
| `predicate` | `(field: Field) => boolean` | -                | Критерії пошуку |

**Приклад**

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

Перебирає об'єкти полів у колекції.

**Підпис**

- `forEachField(callback: (field: Field) => void): void`

**Параметри**

| Параметр   | Тип                      | За замовчуванням | Опис                  |
| ---------- | ------------------------ | ---------------- | --------------------- |
| `callback` | `(field: Field) => void` | -                | Функція зворотного виклику |

**Приклад**

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

## Методи конфігурації індексів

### `addIndex()`

Додає індекс до колекції.

**Підпис**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Параметри**

| Параметр | Тип                                                          | За замовчуванням | Опис                                     |
| -------- | ------------------------------------------------------------ | ---------------- | ---------------------------------------- |
| `index`  | `string \| string[]`                                         | -                | Назва(и) поля(ів) для індексування.      |
| `index`  | `{ fields: string[], unique?: boolean, [key: string]: any }` | -                | Повна конфігурація.                      |

**Приклад**

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

Видаляє індекс з колекції.

**Підпис**

- `removeIndex(fields: string[])`

**Параметри**

| Параметр | Тип        | За замовчуванням | Опис                                     |
| -------- | ---------- | ---------------- | ---------------------------------------- |
| `fields` | `string[]` | -                | Комбінація назв полів для індексу, який потрібно видалити. |

**Приклад**

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

## Методи конфігурації колекції

### `remove()`

Видаляє колекцію.

**Підпис**

- `remove(): void`

**Приклад**

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

## Методи операцій з базою даних

### `sync()`

Синхронізує визначення колекції з базою даних. Окрім стандартної логіки `Model.sync` у Sequelize, вона також обробляє колекції, що відповідають полям асоціацій.

**Підпис**

- `sync(): Promise<void>`

**Приклад**

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

Перевіряє, чи існує колекція в базі даних.

**Підпис**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Параметри**

| Параметр               | Тип           | За замовчуванням | Опис               |
| ---------------------- | ------------- | ---------------- | ------------------ |
| `options?.transaction` | `Transaction` | -                | Екземпляр транзакції |

**Приклад**

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

**Підпис**

- `removeFromDb(): Promise<void>`

**Приклад**

```ts
const books = db.collection({
  name: 'books',
});

// Синхронізуйте колекцію книг з базою даних
await db.sync();

// Видаліть колекцію книг з бази даних
await books.removeFromDb();
```