# Repository

数据表数据仓库管理类。大部分基于数据表的数据存取等操作均通过该类实现。

## 构造函数

通常不会直接由开发者调用，主要通过 `db.registerRepositories()` 注册类型以后，在 `db.colletion()` 的参数中指定对应已注册的仓库类型，并完成实例化。

**签名**

* `constructor(collection: Collection)`

**示例**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository
});

db.collection({
  name: 'books',
  // here link to the registered repository
  repository: 'books'
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## 实例成员

### `database`

上下文所在的数据库管理实例。

### `collection`

对应的数据表管理实例。

### `model`

对应的数据模型类。

## 实例方法

### `count()`

从数据库查询特定条件的数据总数。相当于 Sequelize 中的 `Model.count()`。

**签名**

* `count(options?: CountOptions): Promise<number>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.filter?` | `Filter` | `{}` | 查询条件 |
| `options.fields?` | `string[]` | - | 计数列 |
| `options.transaction?` | `Transaction` | - | 事务 |

`filter` 为兼容 Sequelize 查询条件的扩展形式，更多操作符支持详见 [Operators](./operators.md)。

**示例**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经'
  }
});
```

### `find()`

从数据库查询特定条件的数据集。相当于 Sequelize 中的 `Model.findAll()`。

**签名**

* `async find(options?: FindOptions): Promise<Model[]>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.filterByTk?` | `number \| string` | `{}` | 主键值 |
| `options.filter?` | `Filter` | `{}` | 查询条件 |
| `options.fields?` | `string[]` | - | 查询列 |
| `options.appends?` | `string[]` | - | 追加关系数据列 |
| `options.except?` | `string[]` | - | 排除数据列 |
| `options.sort?` | `string[] \| string` | - | 排序 |
| `options.limit?` | `number` | - | 限制条数 |
| `options.offset?` | `number` | - | 跳过条数 |
| `options.transaction?` | `Transaction` | - | 事务 |

`fields` 和 `except` 通常只使用其一，相当于 Sequelize 中 `attributes` 的 `include` / `exclude`。`appends` 通常用于关系字段。

**示例**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    }
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

从数据库查询特定条件的单条数据。相当于 Sequelize 中的 `Model.findOne()`。

**签名**

* `async findOne(options?: FindOneOptions): Promise<Model | null>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.filterByTk?` | `number \| string` | `{}` | 主键值 |
| `options.filter?` | `Filter` | `{}` | 查询条件 |
| `options.fields?` | `string[]` | - | 查询列 |
| `options.appends?` | `string[]` | - | 追加关系数据列 |
| `options.except?` | `string[]` | - | 排除数据列 |
| `options.sort?` | `string[] \| string` | - | 排序 |
| `options.offset?` | `number` | - | 跳过条数 |
| `options.transaction?` | `Transaction` | - | 事务 |

大部分参数与 `find()` 相同，不同之处在于 `findOne()` 只返回单条数据，所以不需要 `limit` 参数，且查询时始终为 `1`。

**示例**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `create()`

向数据表插入一条新创建的数据。相当于 Sequelize 中的 `Model.create()`。当要创建的数据对象携带关系字段的信息时，会一并创建或更新相应的关系数据记录。

**签名**

* `async create<M extends Model>(options: CreateOptions): Promise<M>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.values` | `M` | `{}` | 插入的数据对象 |
| `options.whitelist?` | `string[]` | - | `values` 字段的白名单，只有名单内的字段会被存储 |
| `options.blacklist?` | `string[]` | - | `values` 字段的黑名单，名单内的字段不会被存储 |
| `options.transaction?` | `Transaction` | - | 事务 |

如果没有传入事务参数，该方法会自动创建一个内部事务。

**示例**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // 有关系表主键值时为更新该条数据
      { id: 1 },
      // 没有主键值时为创建新数据
      { name: 'NocoBase' },
    ]
  },
});
```

### `createMany()`

向数据表插入多条新创建的数据。相当于多次调用 `create()` 方法。

**签名**

* `createMany(options: CreateManyOptions): Promise<Model[]>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.records` | `Model[]` | - | 插入的数据对象数组 |
| `options.whitelist?` | `string[]` | - | `values` 字段的白名单，只有名单内的字段会被存储 |
| `options.blacklist?` | `string[]` | - | `values` 字段的黑名单，名单内的字段不会被存储 |
| `options.transaction?` | `Transaction` | - | 事务 |

如果没有传入事务参数，该方法会自动创建一个内部事务。

**示例**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // 有关系表主键值时为更新该条数据
        { id: 1 },
        // 没有主键值时为创建新数据
        { name: 'NocoBase' },
      ]
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [
        { id: 1 }
      ]
    },
  ],
});
```

### `update()`

更新数据表中的数据。相当于 Sequelize 中的 `Model.update()`。当要更新的数据对象携带关系字段的信息时，会一并创建或更新相应的关系数据记录。

**签名**

* `async update<M extends Model>(options: UpdateOptions): Promise<M>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.filterByTk` | `number \| string` | - | 查询主键 |
| `options.filter` | `Filter` | - | 查询条件 |
| `options.values` | `M` | `{}` | 更新的数据对象 |
| `options.whitelist?` | `string[]` | - | `values` 字段的白名单，只有名单内的字段会被存储 |
| `options.blacklist?` | `string[]` | - | `values` 字段的黑名单，名单内的字段不会被存储 |
| `options.transaction?` | `Transaction` | - | 事务 |

`filterByTk` 与 `filter` 至少要传其一。如果没有传入事务参数，该方法会自动创建一个内部事务。

**示例**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // 有关系表主键值时为更新该条数据
      { id: 1 },
      // 没有主键值时为创建新数据
      { name: 'NocoBase' },
    ]
  },
});
```

### `destory()`

删除数据表中的数据。相当于 Sequelize 中的 `Model.destroy()`。

**签名**

* `async destory(options?: TargetKey | TargetKey[] | DestoryOptions): Promise<number>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.filterByTk` | `number \| string` | - | 查询主键 |
| `options.filter` | `Filter` | - | 查询条件 |
| `options.transaction?` | `Transaction` | - | 事务 |

`filterByTk` 与 `filter` 至少要传其一。如果没有传入事务参数，该方法会自动创建一个内部事务。

### `getTransaction()`

从 options 参数获取事务实例。如果没有传入事务参数，根据 `autoGen` 的值自动创建一个事务。

**签名**

* `async getTransaction(options: any, autoGen = false): Promise<Transaction | null>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.transaction?` | `Transaction` | - | 已有事务 |
| `autoGen` | `boolean` | `false` | 是否自动创建事务 |

**示例**

```ts
const posts = db.getRepository('posts');

const transaction = await posts.getTransaction({}, true);

await posts.create({ transaction });

// 在同一事务中查询计数
const count = await posts.count({
  transaction
});

await transaction.commit();
```

## 关系数据仓库类

通过 `db.getRepository('<name.associatedField>', <id>)` 方法获取到的关系数据仓库管理实例，在调用方法时，会自动在查询条件中加入当前表的主键值。除此以外，还拥有一些基于不同关系类型特有的成员和关系操作方法。

### `set()`

相当于 Sequelize 的 `record.setXxx()` 方法，用于设置关联数据。对一的关系参数为对应的外键，对多的关系参数为对应的外键数组。如果关系类型为 `BelongsToMany`，则会自动创建中间表数据。

**签名**

* `async set(association: string | number | string[] | number[]): Promise<void>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `association` | `string \| number \| string[] \| number[]` | - | 关联数据的外键，对多时可用数组 |

### `add()`

相当于 Sequelize 的 `record.addXxx()` 方法，用于附加关联，仅针对对多关系。

**签名**

* `async add(association: string | number | string[] | number[]): Promise<void>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `association` | `string \| number \| string[] \| number[]` | - | 关联数据的外键 |

### `remove()`

相当于 Sequelize 的 `record.removeXxx()` 方法，用于移除关联，仅针对对多关系。

**签名**

* `async remove(association: string | number | string[] | number[]): Promise<void>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `association` | `string \| number \| string[] \| number[]` | - | 关联数据的外键 |
