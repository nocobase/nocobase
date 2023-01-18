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

The execution content that is triggered when a field is added to data table. Typically used to add data table event listeners and other processings.

The corresponding `super.bind()` method needs to be called first when inheriting.

**Signature**

* `bind()`

### `unbind()`

The execution content that is triggered when a field is removed from data table. Typically used to remove data table event listeners and other processings.

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

Moreover, server-side field types are mainly used for solving the problems of database storage and some algorithms, they are barely relevant to the  field display types and the use of components in front-end. The front-end field types can be found in the corresponding tutorials.

### `'boolean'`

逻辑值类型。

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

整型（32 位）。

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

长整型（64 位）。

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

双精度浮点型（64 位）。

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

实数类型（仅 PG 适用）。

### `'decimal'`

十进制小数类型。

### `'string'`

字符串类型。相当于大部分数据库的 `VARCHAR` 类型。

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

文本类型。相当于大部分数据库的 `TEXT` 类型。

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

密码类型（NocoBase 扩展）。基于 Node.js 原生的 crypto 包的 `scrypt` 方法进行密码加密。

**Example**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // 长度，默认 64
      randomBytesSize: 8 // 随机字节长度，默认 8
    }
  ]
});
```

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `number` | 64 | 字符长度 |
| `randomBytesSize` | `number` | 8 | 随机字节大小 |

### `'date'`

日期类型。

### `'time'`

时间类型。

### `'array'`

数组类型（仅 PG 适用）。

### `'json'`

JSON 类型。

### `'jsonb'`

JSONB 类型（仅 PG 适用，其他会被兼容为 `'json'` 类型）。

### `'uuid'`

UUID 类型。

### `'uid'`

UID 类型（NocoBase 扩展）。短随机字符串标识符类型。

### `'formula'`

公式类型（NocoBase 扩展）。可配置基于 [mathjs](https://www.npmjs.com/package/mathjs) 的数学公式计算，公式中可以引用同一条记录中其他列的数值参与计算。

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

单选类型（NocoBase 扩展）。全表最多有一行数据的该字段值为 `true`，其他都为 `false` 或 `null`。

**Example**

整个系统只有一个被标记为 root 的用户，任意另一个用户的 root 值被改为 `true` 之后，其他所有 root 为 `true` 的记录均会被修改为 `false`：

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

排序类型（NocoBase 扩展）。基于整型数字进行排序，为新记录自动生成新序号，当移动数据时进行序号重排。

数据表如果定义了 `sortable` 选项，也会自动生成对应字段。

**Example**

文章基于所属用户可排序：

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
      scopeKey: 'userId' // 以 userId 相同值分组的数据进行排序
    }
  ]
});
```

### `'virtual'`

虚拟类型。不实际储存数据，仅用于特殊 getter/setter 定义时使用。

### `'belongsTo'`

多对一关联类型。外键储存在自身表，与 hasOne/hasMany 相对。

**Example**

任意文章属于某个作者：

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // 不配置默认为 name 复数名称的表名
      foreignKey: 'authorId', // 不配置默认为 <name> + Id 的格式
      sourceKey: 'id' // 不配置默认为 target 表的 id
    }
  ]
});
```

### `'hasOne'`

一对一关联类型。外键储存在关联表，与 belongsTo 相对。

**Example**

任意用户都有一份个人资料：

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // 可省略
    }
  ]
})
```

### `'hasMany'`

一对多关联类型。外键储存在关联表，与 belongsTo 相对。

**Example**

任意用户可以拥有多篇文章：

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

多对多关联类型。使用中间表储存双方外键，如不指定已存在的表为中间表的话，将会自动创建中间表。

**Example**

任意文章可以加任意多个标签，任意标签也可以被任意多篇文章添加：

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // 同名可省略
      through: 'postsTags', // 中间表不配置将自动生成
      foreignKey: 'postId', // 自身表在中间表的外键
      sourceKey: 'id', // 自身表的主键
      otherKey: 'tagId' // 关联表在中间表的外键
    }
  ]
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // 同一组关系指向同一张中间表
    }
  ]
});
```
![image](https://user-images.githubusercontent.com/63629092/212546611-cbd3bcec-d32a-4522-b640-9604a3bd60bd.png)
