# Field

## 概览

数据表字段管理类（抽象类）。同时是所有字段类型的基类，其他任意字段类型均通过继承该类来实现。

如何自定义字段可参考[扩展字段类型](/development/guide/collections-fields#扩展字段类型)

## 构造函数

通常不会直接由开发者调用，主要通过 `db.collection({ fields: [] })` 方法作为代理入口调用。

在扩展字段时主要通过继承 `Field` 抽象类，再注册到 Database 实例中来实现。

**签名**

* `constructor(options: FieldOptions, context: FieldContext)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `FieldOptions` | - | 字段配置对象 |
| `options.name` | `string` | - | 字段名称 |
| `options.type` | `string` | - | 字段类型，对应在 db 中注册的字段类型名称 |
| `context` | `FieldContext` | - | 字段上下文对象 |
| `context.database` | `Database` | - | 数据库实例 |
| `context.collection` | `Collection` | - | 数据表实例 |

## 实例成员

### `name`

字段名称。

### `type`

字段类型。

### `dataType`

字段数据库存储类型。

### `options`

字段初始化配置参数。

### `context`

字段上下文对象。

## 配置方法

### `on()`

基于数据表事件的快捷定义方式。相当于 `db.on(this.collection.name + '.' + eventName, listener)`。

继承时通常无需覆盖此方法。

**签名**

* `on(eventName: string, listener: (...args: any[]) => void)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `eventName` | `string` | - | 事件名称 |
| `listener` | `(...args: any[]) => void` | - | 事件监听器 |

### `off()`

基于数据表事件的快捷移除方式。相当于 `db.off(this.collection.name + '.' + eventName, listener)`。

继承时通常无需覆盖此方法。

**签名**

* `off(eventName: string, listener: (...args: any[]) => void)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `eventName` | `string` | - | 事件名称 |
| `listener` | `(...args: any[]) => void` | - | 事件监听器 |

### `bind()`

当字段被添加到数据表时触发的执行内容。通常用于添加数据表事件监听器和其他处理。

继承时需要先调用对应的 `super.bind()` 方法。

**签名**

* `bind()`

### `unbind()`

当字段从数据表中移除时触发的执行内容。通常用于移除数据表事件监听器和其他处理。

继承时需要先调用对应的 `super.unbind()` 方法。

**签名**

* `unbind()`

### `get()`

获取字段的配置项的值。

**签名**

* `get(key: string): any`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `key` | `string` | - | 配置项名称 |

**示例**

```ts
const field = db.collection('users').getField('name');

// 获取字段名称配置项的值，返回 'name'
console.log(field.get('name'));
```

### `merge()`

合并字段的配置项的值。

**签名**

* `merge(options: { [key: string]: any }): void`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `{ [key: string]: any }` | - | 要合并的配置项对象 |

**示例**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // 添加一个索引配置
  index: true
});
```

### `remove()`

从数据表中移除字段（仅从内存中移除）。

**示例**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// really remove from db
await books.sync();
```

## 数据库方法

### `removeFromDb()`

从数据库中移除字段。

**签名**

* `removeFromDb(options?: Transactionable): Promise<void>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.transaction?` | `Transaction` | - | 事务实例 |

### `existsInDb()`

判断字段是否存在于数据库中。

**签名**

* `existsInDb(options?: Transactionable): Promise<boolean>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.transaction?` | `Transaction` | - | 事务实例 |

## 内置字段类型列表

NocoBase 内置了一些常用的字段类型，可以直接在定义数据表的字段是使用对应的 type 名称来指定类型。不同类型的字段参数配置不同，具体可参考下面的列表。

所有字段类型的配置项除了以下额外介绍的以外，都会透传至 Sequelize，所以所有 Sequelize 支持的字段配置项都可以在这里使用（如 `allowNull`、`defaultValue` 等）。

另外 server 端的字段类型主要解决数据库存储和部分算法的问题，与前端的字段展示类型和使用组件基本无关。前端字段类型可以参考教程对应说明。

### `'boolean'`

逻辑值类型。

**示例**

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

**示例**

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

**示例**

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

**示例**

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

**示例**

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

**示例**

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

**示例**

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

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
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

**示例**

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

**示例**

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

**示例**

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

**示例**

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

**示例**

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

**示例**

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

**示例**

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
