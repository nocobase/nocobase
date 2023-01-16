# Collection

## Overview

`Collection` is used to define the data model in the system, such as model name, fields, indexes, associations, and other information. It is usually called through the `collection` method of the `Database` instance as a proxy entry.

```javascript
const { Database } = require('@nocobase/database')

// Create database instance
const db = new Database({...}); 

// Define data model
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

Refer to [Fields](/api/database/field.md) for more field types.

## Constructor

**Signature**

* `constructor(options: CollectionOptions, context: CollectionContext)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.name` | `string` | - | Identifier of the collection |
| `options.tableName?` | `string` | - | Database table name, the value of `options.name` is used if not set |
| `options.fields?` | `FieldOptions[]` | - | Definition of fields, refer to [Field](./field) for details |
| `options.model?` | `string \| ModelStatic<Model>` | - | Model type of Sequelize; in case `string` is used, this model name needs to be registered in the db before being called |
| `options.repository?` | `string \| RepositoryType` | - | Data repository type; in case `string` is used, this repository type needs to be registered in the db before being called |
| `options.sortable?` | `string \| boolean \| { name?: string; scopeKey?: string }` | - | Configure which fields are sortable; not sortable by default |
| `options.autoGenId?` | `boolean` | `true` | Whether to automatically generate unique primary key; `true` by default |
| `context.database` | `Database` | - | The context database in which it resides |

**Example**

Create a table <i>posts</i>:

```ts
const posts = new Collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'double',
      name: 'price',
    }
  ]
}, {
  // An existing database instance
  database: db
});
```

## Instance Member

### `options`

Initial parameters for data table configuration, which are consistent with the `options` parameter of the constructor.

### `context`

The contextual environment to which the current data table belongs, currently mainly the database instance.

### `name`

Name of the data table.

### `db`

The database instance to which it belongs.

### `filterTargetKey`

Name of the field that is used as the primary key.

### `isThrough`

Whether it is an intermediate table.

### `model`

Match the Model type of Sequelize.

### `repository`

Data repository instance.

## Field Configuration Method

### `getField()`

Get a field object whose corresponding name has been defined in the data table.

**Signature**

* `getField(name: string): Field`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Name of the field |

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
});

const field = posts.getField('title');
```

### `setField()`

Set a field to the data table.

**Signature**

* `setField(name: string, options: FieldOptions): Field`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Name of the field |
| `options` | `FieldOptions` | - | Configuration of the field, refer to [Field](./field) for details |

**Example**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Set multiple fields to the data table.

**Signature**

* `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `fields` | `FieldOptions[]` | - | Configuration of the fields, refer to [Field](./field) for details |
| `resetFields` | `boolean` | `true` | Whether to reset existing fields |

**Example**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' }
]);
```

### `removeField()`

Remove a field object whose corresponding name has been defined in the data table.

**Signature**

* `removeField(name: string): void | Field`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Name of the field |

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
});

posts.removeField('title');
```

### `resetFields()`

Reset (Empty) fields of the data table.

**Signature**

* `resetFields(): void`

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
});

posts.resetFields();
```

### `hasField()`

Check if the data table has defined a field object with the corresponding name.

**Signature**

* `hasField(name: string): boolean`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | - | Name of the field |

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
});

posts.hasField('title'); // true
```

### `findField()`

Find field objects in the data table that match the conditions.

**Signature**

* `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `predicate` | `(field: Field) => boolean` | - | The condition |

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
});

posts.findField(field => field.name === 'title');
```

### `forEachField()`

Iterate over field objects in the data table.

**Signature**

* `forEachField(callback: (field: Field) => void): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `callback` | `(field: Field) => void` | - | Callback function |

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
});

posts.forEachField(field => console.log(field.name));
```

## Index Configuration Method

### `addIndex()`

Add data table index.

**Signature**

* `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `index` | `string \| string[]` | - | Names of fields to be indexed |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | - | Full configuration |

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
});

posts.addIndex({
  fields: ['title'],
  unique: true
});
```

### `removeIndex()`

Remove data table index.

**Signature**

* `removeIndex(fields: string[])`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `fields` | `string[]` | - | Names of fields to remove indexes |

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true
    }
  ]
});

posts.removeIndex(['title']);
```

## Table Configuration Method

### `remove()`

Remove data table.

**Signature**

* `remove(): void`

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
});

posts.remove();
```

## Database Operation Method

### `sync()`

Synchronize the definitions in data table to the database. In addition to the default `Model.sync` logic in Sequelize, the data tables corresponding to the relational fields will also be handled together.

**Signature**

* `sync(): Promise<void>`

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
});

await posts.sync();
```

### `existsInDb()`

Check whether the data table exists in the database.

**Signature**

* `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options?.transaction` | `Transaction` | - | Transaction instance |

**Example**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ]
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**Signature**

* `removeFromDb(): Promise<void>`

**Example**

```ts
const books = db.collection({
  name: 'books'
});

//  Synchronize the table books to the database
await db.sync();

// Remove the table books from the database
await books.removeFromDb();
```
