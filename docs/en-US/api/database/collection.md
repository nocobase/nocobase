# Collection

## 概览

`Collection` 用于定义系统中的数据模型，如模型名称、字段、索引、关联等信息。
一般通过 `Database` 实例的 `collection` 方法作为代理入口调用。

```javascript
const { Database } = require('@nocobase/database')

// 创建数据库实例
const db = new Database({...}); 

// 定义数据模型
db.collection({
  name: 'users',
  // 定义模型字段
  fields: [
    // 标量字段  
    {
      name: 'name',
      type: 'string',
    },
    
    // 关联字段
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

更多字段类型请参考 [Fields](/api/database/field.md)。

## 构造函数

**签名**

* `constructor(options: CollectionOptions, context: CollectionContext)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.name` | `string` | - | collection 标识 |
| `options.tableName?` | `string` | - | 数据库表名，如不传则使用 `options.name` 的值 |
| `options.fields?` | `FieldOptions[]` | - | 字段定义，详见 [Field](./field) |
| `options.model?` | `string \| ModelCtor<Model>` | - | Sequelize 的 Model 类型，如果使用的是 `string`，则需要调用之前在 db 上注册过该模型名称 |
| `options.repository?` | `string \| RepositoryType` | - | 数据仓库类型，如果使用 `string`，则需要调用之前在 db 上注册过该仓库类型 |
| `options.sortable?` | `string \| boolean \| { name?: string; scopeKey?: string }` | - | 数据可排序字段配置，默认不排序 |
| `options.autoGenId?` | `boolean` | `true` | 是否自动生成唯一主键，默认为 `true` |
| `context.database` | `Database` | - | 所在的上下文环境数据库 |

**示例**

创建一张文章表：

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
  // 已存在的数据库实例
  database: db
});
```

## 实例成员

### `options`

数据表配置初始参数。与构造函数的 `options` 参数一致。

### `context`

当前数据表所属的上下文环境，目前主要是数据库实例。

### `name`

数据表名称。

### `db`

所属数据库实例。

### `filterTargetKey`

作为主键的字段名。

### `isThrough`

是否为中间表。

### `model`

匹配 Sequelize 的 Model 类型。

### `repository`

数据仓库实例。

## 字段配置方法

### `getField()`

获取数据表已定义对应名称的字段对象。

**签名**

* `getField(name: string): Field`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 字段名称 |

**示例**

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

对数据表设置字段。

**签名**

* `setField(name: string, options: FieldOptions): Field`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 字段名称 |
| `options` | `FieldOptions` | - | 字段配置，详见 [Field](./field) |

**示例**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

对数据表批量设置多个字段。

**签名**

* `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `fields` | `FieldOptions[]` | - | 字段配置，详见 [Field](./field) |
| `resetFields` | `boolean` | `true` | 是否重置已存在的字段 |

**示例**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' }
]);
```

### `removeField()`

移除数据表已定义对应名称的字段对象。

**签名**

* `removeField(name: string): void | Field`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 字段名称 |

**示例**

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

重置（清空）数据表的字段。

**签名**

* `resetFields(): void`

**示例**

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

判断数据表是否已定义对应名称的字段对象。

**签名**

* `hasField(name: string): boolean`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `name` | `string` | - | 字段名称 |

**示例**

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

查找数据表中符合条件的字段对象。

**签名**

* `findField(predicate: (field: Field) => boolean): Field | undefined`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `predicate` | `(field: Field) => boolean` | - | 查找条件 |

**示例**

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

遍历数据表中的字段对象。

**签名**

* `forEachField(callback: (field: Field) => void): void`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `callback` | `(field: Field) => void` | - | 回调函数 |

**示例**

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

## 索引配置方法

### `addIndex()`

添加数据表索引。

**签名**

* `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `index` | `string \| string[]` | - | 需要配置索引的字段名 |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | - | 完整配置 |

**示例**

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

移除数据表索引。

**签名**

* `removeIndex(fields: string[])`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `fields` | `string[]` | - | 需要移除索引的字段名组合 |

**示例**

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

## 表配置方法

### `remove()`

删除数据表。

**签名**

* `remove(): void`

**示例**

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

## 数据库操作方法

### `sync()`

同步数据表定义到数据库。除了 Sequelize 中默认的 `Model.sync` 的逻辑，还会一并处理关系字段对应的数据表。

**签名**

* `sync(): Promise<void>`

**示例**

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

判断数据表是否存在于数据库中。

**签名**

* `existsInDb(options?: Transactionable): Promise<boolean>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options?.transaction` | `Transaction` | - | 事务实例 |

**示例**

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

**签名**

* `removeFromDb(): Promise<void>`

**示例**

```ts
const books = db.collection({
  name: 'books'
});

// 同步书籍表到数据库
await db.sync();

// 删除数据库中的书籍表
await books.removeFromDb();
```
