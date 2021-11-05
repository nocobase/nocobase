---
toc: menu
---

# Repository

## `repository.find()`

查询数据，返回数组。无数据时为空数组，不返回 count。如果需要，请使用 [repository.findAndCount()](#repositoryfindandcount) 方法。

##### Definition

```ts
interface find<M extends Sequelize.Model> {
  (options?: FindOptions): Promise<M[]>
}

interface FindOptions extends Sequelize.FindOptions {
  // 数据过滤
  filter?: FilterOptions;
  // 输出结果显示哪些字段
  fields?: string[];
  // 输出结果不显示哪些字段
  expect?: string[];
  // 附加字段，用于控制关系字段的输出
  appends?: string[];
  // 排序，字段前面加上 “-” 表示降序
  sort?: string[];
}

// 待补充
type FilterOptions = any;
```

##### Examples

###### 全览

```ts
await repository.find({
  // 过滤
  filter: {
    $and: [{ a: 5 }, { b: 6 }],            // (a = 5) AND (b = 6)
    $or: [{ a: 5 }, { b: 6 }],             // (a = 5) OR (b = 6)
    someAttribute: {
      // Basics
      $eq: 3,                              // = 3
      $ne: 20,                             // != 20
      $is: null,                           // IS NULL
      $not: true,                          // IS NOT TRUE
      $gt: 6,                              // > 6
      $gte: 6,
    },
    // 支持使用逗号间隔
    'someAttribute.$eq': 3,
    // 内嵌的，一般是关系数据
    nested: {
      someAttribute: {},
    },
    // 同上，也支持使用逗号间隔
    'nested.someAttribute': {
      // 同上
    },
  },
  // 字段白名单
  fields: [],
  // 附加字段，主要用于附加关系字段
  appends: [],
  // 字段黑名单
  expect: [],
  // 排序
  sort: ['-createdAt', 'updatedAt'],
});
```

###### filter 参数示例说明

以文章和标签为例，文章和标签的 collection 如下：

```ts
const Tag = db.collection({
  name: 'tags',
  fields: [
    { type: 'string', name: 'name' },
  ],
});

const Post = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'text', name: 'content' },
    { type: 'belongsToMany', name: 'tags' },
  ],
});
```

最简单的筛选过滤

```ts
await Post.repository.find({
  filter: {
    'name': 'post1',
  },
});
```

支持多种 Operators，以 `$` 开头。[更多内容，查阅 Operators 章节](operators.md)

```ts
await Post.repository.find({
  filter: {
    'name.$includes': 'post1',
    // 等同于
    name: {
      $includes: 'post1',
    },
  },
});
```

支持关系字段过滤，可以使用 dot 来表示层级结构

```ts
await Post.repository.find({
  filter: {
    'tags.name': 'tag1',
    // 等同于
    tags: {
      name: 'tag1',
    },
  },
});
```

多个同一关系字段的过滤可以写在一起

```ts
await Post.repository.find({
  filter: {
    'tags': {
      'name.$includes': 'tag1',
      'createdAt.$dateOn': '2020-10-28',
    },
  },
});
```

同时也支持 and、or 逻辑运算符

```ts
await Post.repository.find({
  filter: {
    $and: [
      // 一个 Object 只写一个条件
      { name: 'post1' },
      // 支持关系字段（非常重要）
      { 'tags.name.$includes': 'tag1' },
      { 'tags.name.$includes': 'tag2' },
    ],
  },
});
```

###### sort 参数示例说明

指定一组数据的排序，倒序时在字段前加上减号 `-`

```ts
await Post.repository.find({
  // 创建日期倒序
  sort: ['-createdAt'],
});
```

可以设置多个排序规则

```ts
await Post.repository.find({
  // 创建日期倒序，ID 正序
  sort: ['-createdAt', 'id'],
});
```

也可以是关系表的字段

```ts
await Post.repository.find({
  // 标签名正序，文章创建日期倒序
  sort: ['tags.name', '-createdAt'],
});
```

###### fields 参数示例说明

- `fields` 显示哪些字段
- `expect` 不显示哪些字段
- `appends` 附加哪些字段

如果并未指定 fields，输出所有 Attributes，Associations 字段并不输出

```ts
await Post.repository.find();
// [{ id, name, content, createdAt, updatedAt }]
```

只输出指定字段时，可以用 fields

```ts
await Post.repository.find({
  fields: ['name'],
});
// [{ name }]
```

当 fields 里有关系字段时，按默认情况输出

```ts
await Post.repository.find({
  fields: ['id', 'name', 'tags'],
});
// [{ id, name, tags: [{ id, name, createdAt, updatedAt }] }]
```

可以只输出关系数据的某个字段

```ts
await Post.repository.find({
  fields: ['id', 'name', 'tags.name'],
});
// [{ id, name, tags: [{ name }] }]
```

排除某些字段时，可以使用 expect

```ts
await Post.repository.find({
  expect: ['content'],
});
// [{ id, name, createdAt, updatedAt }]
```

Attributes 不变，只附加 Associations 进来时，可以使用 appends

```ts
await Post.repository.find({
  appends: ['tags'],
});
// [{ id, name, content, createdAt, updatedAt, tags: [{ id, name, createdAt, updatedAt }] }]
```

如果某个字段只用在 filter 里，但并没有出现在 fields 里，不应该被输出

```ts
await Post.repository.find({
  filter: {
    'tags.name': 'tag1',
  },
});
// 输出所有的 Attributes，但不输出 tags
// [{ id, name, content, createdAt, updatedAt }]
```

如果某个字段只用在 sort 里，但并没有出现在 fields 里，也不应该被输出

```ts
await Post.repository.find({
  sort: ['-tags.createdAt']
});
// 输出所有的 Attributes，但不输出 tags
// [{ id, name, content, createdAt, updatedAt }]
```

## `repository.findAndCount()`

按分页查询数据，并返回所有符合的数据总数。

##### Definition

```ts
interface findAndCount<M extends Sequelize.Model> {
  (options?: FindAndCountOptions): Promise<[ M[], number ]>
}

interface FindAndCountOptions extends Sequelize.FindAndCountOptions {
  // 数据过滤
  filter?: FilterOptions;
  // 输出结果显示哪些字段
  fields?: string[];
  // 输出结果不显示哪些字段
  expect?: string[];
  // 附加字段，用于控制关系字段的输出
  appends?: string[];
  // 排序，字段前面加上 “-” 表示降序
  sort?: string[];
  // 当前页，默认为 1
  page?: number;
  // 当前页最大数量，默认为 20
  pageSize?: number;
}
```

##### Examples

大部分参数与 [repository.find()](#repositoryfind) 一致，所以这里只列举 page 和 pageSize 的例子。

不填写参数时，默认 page=1，pageSize=20。

```ts
await repository.findAndCount();
// [[{ id, name, content, createdAt, updatedAt }], 50]

const [models, count] = await repository.findAndCount();
```

指定页码和单页最大数量

```ts
await repository.findAndCount({
  page: 1,
  pageSize: 50,
});
// [[{ id, name, content, createdAt, updatedAt }], 50]
```

## `repository.findOne()`

##### Definition

```ts
interface findOne<M extends Sequelize.Model> {
  (options?: FindOneOptions): Promise<[ M[], number ]>
}

interface FindOneOptions extends findOptions {
  // 数据过滤
  filter?: FilterOptions;
  // 输出结果显示哪些字段
  fields?: string[];
  // 输出结果不显示哪些字段
  expect?: string[];
  // 附加字段，用于控制关系字段的输出
  appends?: string[];
  // 排序，字段前面加上 “-” 表示降序
  sort?: string[];
  // 通过 pk 过滤
  filterByPk?: number | string;
}
```

##### Examples

大部分参数与 [repository.find()](#repositoryfind) 一致。这里只列举 filterByPk 的例子。

```ts
await repository.findOne({
  filterByPk: 1,
  // 等同于
  filter: {
    [Model.primaryKeyAttribute]: 1,
  }
});
```

## repository.create()

创建数据

##### Definition

```ts
interface create<M extends Sequelize.Model> {
  (options?: CreateOptions): Promise<M>
}

interface CreateOptions {
  // 数据
  values?: any;
  // 字段白名单
  whitelist?: string[];
  // 字段黑名单
  blacklist?: string[];
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues?: string[];
}
```

##### Examples

例子之前，先定义几个 Collection 吧

```ts
db.collection({
  name: 'users',
  fields: [
    {name: 'name', type: 'string'},
  ],
});

db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'belongsTo', name: 'user' },
    { type: 'belongsToMany', name: 'tags' },
    { type: 'hasMany', name: 'comments' },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'belongsToMany', name: 'posts' },
  ],
});

db.collection({
  name: 'comments',
  fields: [
    { type: 'string', name: 'name' },
  ],
});
```

新建数据，可以不指定 values。

```ts
const model = await repository.create();
```

values 必须是 Object。

```ts
await repository.create({
  values: {
    name: 'post1',
  },
});
```

values 可以包含关系数据

```ts
await repository.create({
  values: {
    name: 'post1',
    // 新建并关联
    tags: [{ name: 'tag1' }],
  },
});
```

关联字段，可以只提供关系约束值（一般是 id）

```ts
await repository.create({
  values: {
    name: 'post1',
    // 关联 id=1 的 tag
    tags: [1],
    // 也可以这样，会自动识别
    tags: 1,
  },
});
```

可以设置 values 的白名单和黑名单

```ts
await repository.create({
  values: {
    name: 'post1',
    // 关联 id=1 的 tag
    tags: [1],
  },
  whitelist: ['name'],
});
```

指定哪些关联字段在建立关联的同时可以更新数据

```ts
// 原 tag=1 的数据
// { id: 1, name: 'tag1' }

await repository.create({
  values: {
    name: 'post1',
    tags: [{
      id: 1,
      name: 'tag123', // name 与原数据不一样
    }],
  },
  // 指定了 tags，建立关联时，也会同步修改 tag 数据
  updateAssociationValues: ['tags'],
});
```

全览

```ts
await repository.create({
  // 待存数据
  values: {
    a: 'a',
    // 快速建立关联
    o2o: 1,    // 建立一对一关联
    m2o: 1,    // 建立多对一关联
    o2m: [1,2] // 建立一对多关联
    m2m: [1,2] // 建立多对多关联
    // 新建关联数据并建立关联
    o2o: {
      key1: 'val1',
    },
    o2m: [{key1: 'val1'}, {key2: 'val2'}],
    // 子表格数据
    subTable: [
      // 如果数据存在，更新处理
      {id: 1, key1: 'val1111'},
      // 如果数据不存在，直接创建并关联
      {key2: 'val2'},
    ],
  },
  // 字段白名单
  whitelist: [],
  // 字段黑名单
  blacklist: [],
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues: ['subTable'],
});
```

## repository.update()

更新数据

##### Definition

```ts
interface update<M extends Sequelize.Model> {
  (options: UpdateOptions): Promise<M>
}

interface UpdateOptions {
  filter?: any;
  filterByPk?: number | string;
  // 数据
  values?: any;
  // 字段白名单
  whitelist?: string[];
  // 字段黑名单
  blacklist?: string[];
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues?: string[];
}
```

##### Examples

全部改

```ts
await repository.update({
  values: {
    a: 'b'
  },
});
```

只改某条数据

```ts
await repository.update({
  filterByPk: 1,
  values: {
    a: 'b'
  },
});
```

指定范围修改

```ts
await repository.update({
  filter: {
    name: 'post1.1'
  },
  values: {
    name: 'post1.2'
  },
});
```

## repository.destroy()

删除数据

##### Definition

```ts
interface destroy {
  (options?: number | string | number[] | string[] | DestroyOptions): Promise<boolean | boolean[]>
}

interface DestroyOptions {
  filter?: any;
}
```

##### Examples

指定 primary key 值

```ts
repository.destroy(1);
```

批量 primary key 值

```ts
repository.destroy([1, 2, 3]);
```

复杂的 filter

```ts
repository.destroy({
  filter: {},
});
```

## repository.relation().of()

##### Definition

```ts
interface relation {
  (name: string): {
    of: (parent: any): RelationRepository;
  }
}

// 关系数据的增删改查在 NocoBase 里非常重要
class RelationRepository {
  find() {}
  findOne() {}
  create() {}
  update() {}
  destroy() {}
  set() {}
  add() {}
  remove() {}
  toggle() {}
}
```

##### Examples

find、findOne、create、update 和 destroy 和常规 Repository API 层面是一致，这里重点列举关联操作的几个方法：

```ts
// user_id = 1 的 post 的 relatedQuery
const userPostsRepository = repository.relation('posts').of(1);

// 建立关联
userPostsRepository.set(1);

// 批量，仅用于 HasMany 和 BelongsToMany
userPostsRepository.set([1,2,3]);

// BelongsToMany 的中间表
userPostsRepository.set([
  [1, {/* 中间表数据 */}],
  [2, {/* 中间表数据 */}],
  [3, {/* 中间表数据 */}],
]);

// 仅用于 HasMany 和 BelongsToMany
userPostsRepository.add(1);

// BelongsToMany 的中间表
userPostsRepository.add(1, {/* 中间表数据 */});

// 删除关联
userPostsRepository.remove(1);

// 建立或解除
userPostsRepository.toggle(1);
userPostsRepository.toggle([1, 2, 3]);
```
