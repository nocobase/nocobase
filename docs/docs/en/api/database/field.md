# Field

## Overview

Collection field management class (abstract class). It is also the base class for all field types. Any other field type is implemented by inheriting this class.

For how to customize fields, please refer to [Extend Field Types]

## Constructor

It is usually not called directly by developers, but mainly through the `db.collection({ fields: [] })` method as a proxy entry.

When extending a field, it is mainly implemented by inheriting the `Field` abstract class and then registering it into the Database instance.

**Signature**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parameters**

| Parameter | Type | Default | Description |
| -------------------- | -------------- | ------ | ---------------------------------------- |
| `options` | `FieldOptions` | - | Field configuration object |
| `options.name` | `string` | - | Field name |
| `options.type` | `string` | - | Field type, corresponding to the name of the field type registered in the db |
| `context` | `FieldContext` | - | Field context object |
| `context.database` | `Database` | - | Database instance |
| `context.collection` | `Collection` | - | Collection instance |

## Instance Members

### `name`

Field name.

### `type`

Field type.

### `dataType`

Field database storage type.

### `options`

Field initialization configuration parameters.

### `context`

Field context object.

## Configuration Methods

### `on()`

A shortcut definition method based on collection events. Equivalent to `db.on(this.collection.name + '.' + eventName, listener)`.

It is usually not necessary to override this method when inheriting.

**Signature**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parameters**

| Parameter | Type | Default | Description |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string` | - | Event name |
| `listener` | `(...args: any[]) => void` | - | Event listener |

### `off()`

A shortcut removal method based on collection events. Equivalent to `db.off(this.collection.name + '.' + eventName, listener)`.

It is usually not necessary to override this method when inheriting.

**Signature**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parameters**

| Parameter | Type | Default | Description |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string` | - | Event name |
| `listener` | `(...args: any[]) => void` | - | Event listener |

### `bind()`

The content to be executed when a field is added to a collection. It is usually used to add collection event listeners and other processing.

When inheriting, you need to call the corresponding `super.bind()` method first.

**Signature**

- `bind()`

### `unbind()`

The content to be executed when a field is removed from a collection. It is usually used to remove collection event listeners and other processing.

When inheriting, you need to call the corresponding `super.unbind()` method first.

**Signature**

- `unbind()`

### `get()`

Gets the value of a field's configuration item.

**Signature**

- `get(key: string): any`

**Parameters**

| Parameter | Type | Default | Description |
| ------ | -------- | ------ | ---------- |
| `key` | `string` | - | Configuration item name |

**Example**

```ts
const field = db.collection('users').getField('name');

// Get the value of the field name configuration item, returns 'name'
console.log(field.get('name'));
```

### `merge()`

Merges the values of a field's configuration items.

**Signature**

- `merge(options: { [key: string]: any }): void`

**Parameters**

| Parameter | Type | Default | Description |
| --------- | ------------------------ | ------ | ------------------ |
| `options` | `{ [key: string]: any }` | - | The configuration item object to be merged |

**Example**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Add an index configuration
  index: true,
});
```

### `remove()`

Removes the field from the collection (only from memory).

**Example**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// really remove from db
await books.sync();
```

## Database Methods

### `removeFromDb()`

Removes the field from the database.

**Signature**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parameters**

| Parameter | Type | Default | Description |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | - | Transaction instance |

### `existsInDb()`

Determines if the field exists in the database.

**Signature**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameters**

| Parameter | Type | Default | Description |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | - | Transaction instance |

## List of Built-in Field Types

NocoBase has some commonly used field types built-in, and you can directly use the corresponding type name to specify the type when defining fields for a collection. Different types of fields have different parameter configurations, please refer to the list below for details.

All configuration items for field types, except for those introduced below, will be passed through to Sequelize, so all field configuration items supported by Sequelize can be used here (such as `allowNull`, `defaultValue`, etc.).

In addition, the server-side field types mainly solve the problems of database storage and some algorithms, and are basically unrelated to the front-end field display types and components used. For front-end field types, please refer to the corresponding tutorial instructions.

### `'boolean'`

Boolean value type.

**Example**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

Integer type (32-bit).

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

Big integer type (64-bit).

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

Double-precision floating-point type (64-bit).

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

Real number type (only for PG).

### `'decimal'`

Decimal number type.

### `'string'`

String type. Equivalent to the `VARCHAR` type in most databases.

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

Text type. Equivalent to the `TEXT` type in most databases.

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

Password type (NocoBase extension). Encrypts passwords based on the `scrypt` method of Node.js's native crypto package.

**Example**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Length, default 64
      randomBytesSize: 8, // Random byte length, default 8
    },
  ],
});
```

**Parameters**

| Parameter | Type | Default | Description |
| ----------------- | -------- | ------ | ------------ |
| `length` | `number` | 64 | Character length |
| `randomBytesSize` | `number` | 8 | Random byte size |

### `'date'`

Date type.

### `'time'`

Time type.

### `'array'`

Array type (only for PG).

### `'json'`

JSON type.

### `'jsonb'`

JSONB type (only for PG, others will be compatible as `'json'` type).

### `'uuid'`

UUID type.

### `'uid'`

UID type (NocoBase extension). Short random string identifier type.

### `'formula'`

Formula type (NocoBase extension). Allows configuring mathematical formula calculations based on [mathjs](https://www.npmjs.com/package/mathjs). The formula can reference the values of other columns in the same record for calculation.

**Example**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

Radio type (NocoBase extension). At most one row of data in the entire collection can have this field's value as `true`; all others will be `false` or `null`.

**Example**

There is only one user marked as root in the entire system. After the root value of any other user is changed to `true`, all other records with root as `true` will be changed to `false`:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

Sort type (NocoBase extension). Sorts based on integer numbers, automatically generates a new sequence number for new records, and reorders the sequence numbers when data is moved.

If a collection defines the `sortable` option, a corresponding field will also be automatically generated.

**Example**

Posts can be sorted based on the user they belong to:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // Sort data grouped by the same userId value
    },
  ],
});
```

### `'virtual'`

Virtual type. Does not actually store data, only used for special getter/setter definitions.

### `'belongsTo'`

Many-to-one association type. The foreign key is stored in its own table, as opposed to hasOne/hasMany.

**Example**

Any post belongs to an author:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // If not configured, it defaults to the plural form of the name as the collection name
      foreignKey: 'authorId', // If not configured, it defaults to the `<name> + Id` format
      sourceKey: 'id', // If not configured, it defaults to the id of the target collection
    },
  ],
});
```

### `'hasOne'`

One-to-one association type. The foreign key is stored in the associated collection, as opposed to belongsTo.

**Example**

Every user has a profile:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Can be omitted
    },
  ],
});
```

### `'hasMany'`

One-to-many association type. The foreign key is stored in the associated collection, as opposed to belongsTo.

**Example**

Any user can have multiple posts:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

Many-to-many association type. Uses a through collection to store the foreign keys of both sides. If an existing collection is not specified as the through collection, a through collection will be created automatically.

**Example**

Any post can have multiple tags, and any tag can be added to multiple posts:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Can be omitted if the name is the same
      through: 'postsTags', // The through collection will be automatically generated if not configured
      foreignKey: 'postId', // The foreign key of the source collection in the through collection
      sourceKey: 'id', // The primary key of the source collection
      otherKey: 'tagId', // The foreign key of the target collection in the through collection
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // The same group of relationships points to the same through collection
    },
  ],
});
```