# Collection

## Overview

`Collection` is used to define data models in the system, such as model names, fields, indexes, associations, and other information.
It is generally called through the `collection` method of a `Database` instance as a proxy entry.

```javascript
const { Database } = require('@nocobase/database')

// Create a database instance
const db = new Database({...});

// Define a data model
db.collection({
  name: 'users',
  // Define model fields
  fields: [
    // Scalar field
    {
      name: 'name',
      type: 'string',
    },

    // Association field
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

For more field types, please refer to [Fields](/api/database/field).

## Constructor

**Signature**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parameters**

| Parameter | Type | Default | Description |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name` | `string` | - | collection identifier |
| `options.tableName?` | `string` | - | Database table name. If not provided, the value of `options.name` will be used. |
| `options.fields?` | `FieldOptions[]` | - | Field definitions. See [Field](./field) for details. |
| `options.model?` | `string \| ModelStatic<Model>` | - | Sequelize Model type. If a `string` is used, the model name must have been previously registered on the db. |
| `options.repository?` | `string \| RepositoryType` | - | Repository type. If a `string` is used, the repository type must have been previously registered on the db. |
| `options.sortable?` | `string \| boolean \| { name?: string; scopeKey?: string }` | - | Sortable field configuration. Not sortable by default. |
| `options.autoGenId?` | `boolean` | `true` | Whether to automatically generate a unique primary key. Defaults to `true`. |
| `context.database` | `Database` | - | The database in the current context. |

**Example**

Create a posts collection:

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
    // Existing database instance
    database: db,
  },
);
```

## Instance Members

### `options`

Initial configuration parameters for the collection. Same as the `options` parameter of the constructor.

### `context`

The context to which the current collection belongs, currently mainly the database instance.

### `name`

Collection name.

### `db`

The database instance it belongs to.

### `filterTargetKey`

The field name used as the primary key.

### `isThrough`

Whether it is a through collection.

### `model`

Matches the Sequelize Model type.

### `repository`

Repository instance.

## Field Configuration Methods

### `getField()`

Gets the field object with the corresponding name defined in the collection.

**Signature**

- `getField(name: string): Field`

**Parameters**

| Parameter | Type | Default | Description |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Field name |

**Example**

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

Sets a field for the collection.

**Signature**

- `setField(name: string, options: FieldOptions): Field`

**Parameters**

| Parameter | Type | Default | Description |
| --------- | -------------- | ------ | ------------------------------- |
| `name` | `string` | - | Field name |
| `options` | `FieldOptions` | - | Field configuration. See [Field](./field) for details. |

**Example**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Sets multiple fields for the collection in batch.

**Signature**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parameters**

| Parameter | Type | Default | Description |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields` | `FieldOptions[]` | - | Field configuration. See [Field](./field) for details. |
| `resetFields` | `boolean` | `true` | Whether to reset existing fields. |

**Example**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Removes the field object with the corresponding name defined in the collection.

**Signature**

- `removeField(name: string): void | Field`

**Parameters**

| Parameter | Type | Default | Description |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Field name |

**Example**

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

Resets (clears) the fields of the collection.

**Signature**

- `resetFields(): void`

**Example**

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

Checks if a field object with the corresponding name is defined in the collection.

**Signature**

- `hasField(name: string): boolean`

**Parameters**

| Parameter | Type | Default | Description |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Field name |

**Example**

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

Finds a field object in the collection that meets the criteria.

**Signature**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parameters**

| Parameter | Type | Default | Description |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | - | Search criteria |

**Example**

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

Iterates over the field objects in the collection.

**Signature**

- `forEachField(callback: (field: Field) => void): void`

**Parameters**

| Parameter | Type | Default | Description |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | - | Callback function |

**Example**

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

## Index Configuration Methods

### `addIndex()`

Adds an index to the collection.

**Signature**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parameters**

| Parameter | Type | Default | Description |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]` | - | Field name(s) to be indexed. |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | - | Full configuration. |

**Example**

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

Removes an index from the collection.

**Signature**

- `removeIndex(fields: string[])`

**Parameters**

| Parameter | Type | Default | Description |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | - | Combination of field names for the index to be removed. |

**Example**

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

## Collection Configuration Methods

### `remove()`

Deletes the collection.

**Signature**

- `remove(): void`

**Example**

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

## Database Operation Methods

### `sync()`

Syncs the collection definition to the database. In addition to the default logic of `Model.sync` in Sequelize, it also processes collections corresponding to association fields.

**Signature**

- `sync(): Promise<void>`

**Example**

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

Checks if the collection exists in the database.

**Signature**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameters**

| Parameter | Type | Default | Description |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | - | Transaction instance |

**Example**

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

**Signature**

- `removeFromDb(): Promise<void>`

**Example**

```ts
const books = db.collection({
  name: 'books',
});

// Sync the books collection to the database
await db.sync();

// Remove the books collection from the database
await books.removeFromDb();
```