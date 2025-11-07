# Repository

## 概览

在一个给定的 `Collection` 对象上，可以获取到它的 `Repository` 对象来对数据表进行读写操作。

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### 查询

#### 基础查询

在 `Repository` 对象上，调用 `find*` 相关方法，可执行查询操作，查询方法都支持传入 `filter` 参数，用于过滤数据。

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### 操作符

`Repository` 中的 `filter` 参数，还提供了多种操作符，执行更加多样的查询操作。

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

操作符的更多详细信息请参考 [Filter Operators](/api/database/operators)。

#### 字段控制

在查询操作时，通过 `fields`, `except`, `appends` 参数可以控制输出字段。

- `fields`: 指定输出字段
- `except`: 排除输出字段
- `appends`: 追加输出关联字段

```javascript
// 获取的结果只包含 id 和 name 字段
userRepository.find({
  fields: ['id', 'name'],
});

// 获取的结果不包含 password 字段
userRepository.find({
  except: ['password'],
});

// 获取的结果会包含关联对象 posts 的数据
userRepository.find({
  appends: ['posts'],
});
```

#### 关联字段查询

`filter` 参数支持按关联字段进行过滤，例如：

```javascript
// 查询 user 对象，其所关联的 posts 存在 title 为 'post title' 的对象
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

关联字段也可进行嵌套

```javascript
// 查询 user 对象，查询结果满足其 posts 的 comments 包含 keywords
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### 排序

通过 `sort` 参数，可以对查询结果进行排序。

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

也可按照关联对象的字段进行排序

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### 创建

#### 基础创建

通过 `Repository` 创建新的数据对象。

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// 支持批量创建
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### 创建关联

创建时可以同时创建关联对象，和查询类似，也支持关联对象的嵌套使用，例如：

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// 创建用户的同时，创建 post 与用户关联，创建 tags 与 post 相关联。
```

若关联对象已在数据库中，可传入其ID，创建时会建立与关联对象的关联关系。

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // 建立与已存在关联对象的关联关系
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### 更新

#### 基础更新

获取到数据对象后，可直接在数据对象(`Model`)上修改属性，然后调用 `save` 方法保存修改。

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

数据对象 `Model` 继承自 Sequelize Model，对 `Model` 的操作可参考 [Sequelize Model](https://sequelize.org/master/manual/model-basics.html)。

也可通过 `Repository` 更新数据：

```javascript
// 修改满足筛选条件的数据记录
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

更新时，可以通过 `whitelist` 、`blacklist` 参数控制更新字段，例如：

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // 仅更新 age 字段
});
```

#### 更新关联字段

在更新时，可以设置关联对象，例如：

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // 与 tag1 建立关联
      },
      {
        name: 'tag2', // 创建新的 tag 并建立关联
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // 解除 post 与 tags 的关联
  },
});
```

### 删除

可调用 `Repository` 中的 `destroy()`方法进行删除操作。删除时需指定筛选条件：

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## 构造函数

通常不会直接由开发者调用，主要通过 `db.registerRepositories()` 注册类型以后，在 `db.colletion()` 的参数中指定对应已注册的仓库类型，并完成实例化。

**签名**

- `constructor(collection: Collection)`

**示例**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // here link to the registered repository
  repository: 'books',
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

从数据库查询数据集，可指定筛选条件、排序等。

**签名**

- `async find(options?: FindOptions): Promise<Model[]>`

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
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
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

查询列，用于控制数据字段结果。传入此参数之后，只会返回指定的字段。

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
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

从数据库查询特定条件的单条数据。相当于 Sequelize 中的 `Model.findOne()`。

**签名**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

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

- `count(options?: CountOptions): Promise<number>`

**类型**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**示例**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

从数据库查询特定条件的数据集和结果数。相当于 Sequelize 中的 `Model.findAndCountAll()`。

**签名**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**类型**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**详细信息**

查询参数与 `find()` 相同。返回值为一个数组，第一个元素为查询结果，第二个元素为结果总数。

### `create()`

向数据表插入一条新创建的数据。相当于 Sequelize 中的 `Model.create()`。当要创建的数据对象携带关系字段的信息时，会一并创建或更新相应的关系数据记录。

**签名**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

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
    ],
  },
});
```

### `createMany()`

向数据表插入多条新创建的数据。相当于多次调用 `create()` 方法。

**签名**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**类型**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**详细信息**

- `records`：要创建的记录的数据对象数组。
- `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。

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
      ],
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

更新数据表中的数据。相当于 Sequelize 中的 `Model.update()`。当要更新的数据对象携带关系字段的信息时，会一并创建或更新相应的关系数据记录。

**签名**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

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
    ],
  },
});
```

### `destroy()`

删除数据表中的数据。相当于 Sequelize 中的 `Model.destroy()`。

**签名**

- `async destory(options?: TargetKey | TargetKey[] | DestoryOptions): Promise<number>`

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

- `filter`：指定要删除的记录的过滤条件。Filter 详细用法可参考 [`find()`](#find) 方法。
- `filterByTk`：按 TargetKey 指定要删除的记录的过滤条件。
- `truncate`: 是否清空表数据，在没有传入 `filter` 或 `filterByTk` 参数时有效。
- `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。
