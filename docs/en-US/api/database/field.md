# Field

## Overview

Data table field management class (abstract class). It is also the base class for all field types, and any other field types are implemented by inheriting from this class.

Refer to [Extended Field Types](/development/guide/collections-fields#extended-field-types) to see how to customize fields.

## Constructor

It is usually not called directly by the developer, but mainly through the `db.collection({ fields: [] })` method as a proxy entry.

Extended field is implemented mainly by inheriting the `Field` abstract class and registering it to a Database instance.

**Signature**

* `constructor(options: FieldOptions, context: FieldContext)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `FieldOptions` | - | Field configuration object |
| `options.name` | `string` | - | Field name |
| `options.type` | `string` | - | Field type, corresponding to the name of the field type registered in the db |
| `context` | `FieldContext` | - | Field context object |
| `context.database` | `Database` | - | Database instance |
| `context.collection` | `Collection` | - | Data table instance |

## Instance Member

### `name`

Field name.

### `type`

Field type.

### `dataType`

Data type of the field.

### `options`

Configuration parameters to initialize the field.

### `context`

Field context object.

## Configuration Method

### `on()`

Quick definition method based on data table events. It is equivalent to `db.on(this.collection.name + '.' + eventName, listener)`.

It is usually not necessary to override this method when inheriting.

**Signature**

* `on(eventName: string, listener: (...args: any[]) => void)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `eventName` | `string` | - | Event name |
| `listener` | `(...args: any[]) => void` | - | Event listener |

### `off()`

Quick removal method based on data table events. It is equivalent to `db.off(this.collection.name + '.' + eventName, listener)`.

It is usually not necessary to override this method when inheriting.

**Signature**

* `off(eventName: string, listener: (...args: any[]) => void)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `eventName` | `string` | - | Event name |
| `listener` | `(...args: any[]) => void` | - | Event listener |

### `bind()`

The execution content that is triggered when a field is added to data table. Typically used to add data table event listeners and other processing.

The corresponding `super.bind()` method needs to be called first when inheriting.

**Signature**

* `bind()`

### `unbind()`

The execution content that is triggered when a field is removed from data table. Typically used to remove data table event listeners and other processing.

The corresponding `super.unbind()` method needs to be called first when inheriting.

**Signature**

* `unbind()`

### `get()`

Get the values of a configuration item of the field.

**Signature**

* `get(key: string): any`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `key` | `string` | - | Name of the configuration item |

**Example**

```ts
const field = db.collection('users').getField('name');

// Get and return the values of the configuration item 'name'
console.log(field.get('name'));
```

### `merge()`

Merge the values of a configuration item of the field.

**Signature**

* `merge(options: { [key: string]: any }): void`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `{ [key: string]: any }` | - | The configuration item to merge |

**Example**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Add an index configuration 
  index: true
});
```

### `remove()`

Remove a field from data table (from memory only).

**Example**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// really remove from db
await books.sync();
```

## Database Method

### `removeFromDb()`

Remove a field from the database.

**Signature**

* `removeFromDb(options?: Transactionable): Promise<void>`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.transaction?` | `Transaction` | - | Transaction instance |

### `existsInDb()`

Check if a field exists in the database.

**Signature**

* `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `options.transaction?` | `Transaction` | - | Transaction instance |

## Built-in Field Types

NocoBase has some built-in common field types, the corresponding type name can be used directly to specify the type of field upon definition. Fields of different types are configured differently, please refer to the list below.

The configuration items of all field types are passed through to Sequelize in addition to those described below. Therefore, all field configuration items supported by Sequelize can be used here (e.g. `allowNull`, `defaultValue`, etc.).

Moreover, server-side field types are mainly used for solving the problems of database storage and some algorithms, they are barely relevant to the field display types and the use of components in front-end. The front-end field types can be found in the corresponding tutorials.

### `'boolean'`

Boolean type.

**Example**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published'
    }
  ]
});
```

### `'integer'`

Integer type (32 bits).

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages'
    }
  ]
});
```

### `'bigInt'`

Long integer type (64 bits).

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words'
    }
  ]
});
```

### `'double'`

Double-precision floating-point format (64 bits).

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price'
    }
  ]
});
```

### `'real'`

Real type (PG only).

### `'decimal'`

Decimal type.

### `'string'`

String type. Equivalent to the `VARCHAR` type for most databases.

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title'
    }
  ]
});
```

### `'text'`

Text type. Equivalent to the `TEXT` type for most databases.

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content'
    }
  ]
});
```

### `'password'`

Password type (NocoBase extension). Password encryption based on the `scrypt` method of Node.js native crypto packages.

**Example**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Length, default is 64
      randomBytesSize: 8 // Length of random bytes, default is 8
    }
  ]
});
```

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `number` | 64 | Length of characters |
| `randomBytesSize` | `number` | 8 | Length of random bytes |

### `'date'`

Date type.

### `'time'`

Time type.

### `'array'`

Array type (PG only).

### `'json'`

JSON type.

### `'jsonb'`

JSONB type (PG only, others will be compatible with the `'json'` type).

### `'uuid'`

UUID type.

### `'uid'`

UID type (NocoBase extension). Short random string identifier type.

### `'formula'`

Formula type (NocoBase extension). Mathematical formula calculation can be configured based on [mathjs](https://www.npmjs.com/package/mathjs), and the formula can refer to the values of other columns in the same record to participate in the calculation.

**Example**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price'
    },
    {
      type: 'integer',
      name: 'quantity'
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity'
    }
  ]
});
```

### `'radio'`

Radio type (NocoBase extension). The field value is 'true' for at most one row of data for the full table, all others are 'false' or 'null'.

**Example**

There is only one user marked as <i>root</i> in the entire system, once the <i>root</i> value of any other user is changed to `true`, all other records with <i>root</i> of `true` will be changed to `false`:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    }
  ]
});
```

### `'sort'`

Sorting type (NocoBase extension). Sorting based on integer numbers, automatically generating new serial numbers for new records, and rearranging serial numbers when moving data.

If data table has the `sortable` option defined, the corresponding fields will be generated automatically.

**Example**

Posts are sortable based on the users they belong to.

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
      scopeKey: 'userId' // Sort data grouped by the values of userId
    }
  ]
});
```

### `'virtual'`

Virtual type. No Data is actually stored, it is used only when special getter/setter is defined.

### `'belongsTo'`

Many-to-one association type. Foreign key is stored in its own table, as opposed to `'hasOne'`/`'hasMany'`.

**Example**

Any post belongs to an author:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Default table name is the plural form of <name>
      foreignKey: 'authorId', // Default is '<name> + Id'
      sourceKey: 'id' // Default is id of the <target> table
    }
  ]
});
```

### `'hasOne'`

One-to-one association type. Foreign key is stored in the association table, as opposed to `'belongsTo'`.

**Example**

Any user has a profile:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Can be omitted
    }
  ]
})
```

### `'hasMany'`

One-to-many association type. The foreign key is stored in the association table, as opposed to `'belongsTo'`.

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
      sourceKey: 'id'
    }
  ]
});
```

### `'belongsToMany'`

Many-to-many association type. Intermediate table is used to store both foreign keys. If no existing table is specified as intermediate table, it will be created automatically.

**Example**

Any post can have multiple tags added to it, and any tag can be added to multiple posts:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Can be omitted if name is the same
      through: 'postsTags', // Intermediate table will be generated automatically if not specified
      foreignKey: 'postId', // Foreign key in the intermediate table referring to the table itself
      sourceKey: 'id', // Primary key of the table itself
      otherKey: 'tagId' // Foreign key in the intermediate table referring to the association table
    }
  ]
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Refer to the same intermediate table in the same set of relation
    }
  ]
});
```
