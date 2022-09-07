# Field

数据表字段管理类。同时是所有字段类型的基类，其他任意字段类型均通过继承该类来实现。

## 构造函数

通常不会直接由开发者调用，主要通过 `db.collection({ fields: [] })` 方法作为代理入口调用。

**签名**

* `constructor(options: FieldOptions, context: FieldContext): Field`

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

## 内置字段类型列表

NocoBase 内置了一些常用的字段类型，可以直接在定义数据表的字段是使用对应的 type 名称来指定类型。不同类型的字段参数配置不同，具体可参考下面的列表。

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
      name: 'pages'
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

实数类型。

### `'decimal'`

十进制小数类型。

### `'string'`

字符串类型。

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

文本类型。

### `'password'`

密码类型。

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `length` | `number` | 64 | 字符长度 |
| `randomBytesSize` | `number` | 8 | 随机字节大小 |

### `'boolean'`

逻辑值类型。

### `'date'`

日期类型。

### `'array'`

数组类型。

### `'json'`

JSON 类型。

### `'uuid'`

UUID 类型。

### `'uid'`

UID 类型。

### `'formula'`

公式类型。

### `'radio'`

单选类型。

### `'sort'`

排序类型。

### `'relation'`

关联类型。

### `'belongsTo'`

多对一关联类型。

### `'hasMany'`

一对多关联类型。

### `'hasOne'`

一对一关联类型（外键在他表）。

### `'belongsToMany'`

多对多关联类型。

### `'virtual'`

虚拟类型。
