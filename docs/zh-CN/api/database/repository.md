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


### `find()`

从数据库查询特定条件的数据集。相当于 Sequelize 中的 `Model.findAll()`。

**签名**

* `async find(options?: FindOptions): Promise<Model[]>`

**类型**
```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**详细信息**

#### `filter: Filter` 
查询条件，用于过滤数据结果。传入的查询参数中，`key` 为查询的字段名，`value` 可传要查询的值，
也可配合使用操作符进行其他条件的数据筛选。

```typescript
// 查询 name 为 foo，并且 age 大于 18 的记录
repository.find({
  filter: {
    name: "foo",
    age: {
      $gt: 18,
    },
  }
})
```
更多操作符请参考 [查询操作符](./operators.md)。

#### `filterByTk: TargetKey`
通过 `TargetKey` 查询数据，为 `filter` 参数的便捷方法。`TargetKey` 具体是哪一个字段， 
可在 `Collection` 中进行[配置](./collection.md#filtertargetkey)，默认为 `primaryKey`。

```typescript

// 默认情况下，查找 id 为 1 的记录
repository.find({
  filterByTk: 1,
});

```

#### `fields: string[]`
查询列，用户控制数据字段结果。传入此参数之后，只会返回指定的字段。

#### `except: string[]`
排除列，用于控制数据字段结果。传入此参数之后，传入的字段将不会输出。

#### `appends: string[]`
追加列，用于加载关联数据。传入此参数之后，指定的关联字段将一并输出。

#### `sort: string[] | string`
指定查询结果排序方式，传入参数为字段名称，默认按照升序 `asc` 排序，若需按降序 `desc` 排序，
可在字段名称前加上 `-` 符号，如：`['-id', 'name']`，表示按 `id desc, name asc` 排序。

#### `limit: number`
限制结果数量，同 `SQL` 中的 `limit`

#### `offset: number` 
查询偏移量，同 `SQL` 中的 `offset`

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

**类型**
```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**参数**

大部分参数与 `find()` 相同，不同之处在于 `findOne()` 只返回单条数据，所以不需要 `limit` 参数，且查询时始终为 `1`。

**示例**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

从数据库查询特定条件的数据总数。相当于 Sequelize 中的 `Model.count()`。

**签名**

* `count(options?: CountOptions): Promise<number>`

**类型**
```typescript
interface CountOptions extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>, Transactionable {
  filter?: Filter;
}
```

**示例**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经'
  }
});
```


### `findAndCount()`

从数据库查询特定条件的数据集和结果数。相当于 Sequelize 中的 `Model.findAndCountAll()`。

**签名**

* `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**类型**
```typescript
type FindAndCountOptions = Omit<SequelizeAndCountOptions, 'where' | 'include' | 'order'> & CommonFindOptions;
```

**详细信息**

查询参数与 `find()` 相同。返回值为一个数组，第一个元素为查询结果，第二个元素为结果总数。

### `create()`

向数据表插入一条新创建的数据。相当于 Sequelize 中的 `Model.create()`。当要创建的数据对象携带关系字段的信息时，会一并创建或更新相应的关系数据记录。

**签名**

* `async create<M extends Model>(options: CreateOptions): Promise<M>`

**类型**
```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**详细信息**

* `values`：要创建的记录的数据对象。
* `whitelist`：指定要创建的记录的数据对象中，哪些字段**可以被写入**。若不传入此参数，则默认允许所有字段写入。
* `blacklist`：指定要创建的记录的数据对象中，哪些字段**不允许被写入**。若不传入此参数，则默认允许所有字段写入。
* `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。


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

**类型**
```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**详细信息**

* `records`：要创建的记录的数据对象数组。
* `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。

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

**类型**
```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**详细信息**


* `values`：要更新的记录的数据对象。
* `filter`：指定要更新的记录的过滤条件, Filter 详细用法可参考 [`find()`](#find) 方法。
* `filterByTk`：按 TargetKey 指定要更新的记录的过滤条件。
* `whitelist`: `values` 字段的白名单，只有名单内的字段会被写入。
* `blacklist`: `values` 字段的黑名单，名单内的字段不会被写入。
* `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。

`filterByTk` 与 `filter` 至少要传其一。

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

**类型**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**详细信息**

* `filter`：指定要删除的记录的过滤条件。Filter 详细用法可参考 [`find()`](#find) 方法。
* `filterByTk`：按 TargetKey 指定要删除的记录的过滤条件。
* `truncate`: 是否清空表数据，在没有传入 `filter` 或 `filterByTk` 参数时有效。
* `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。


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
