---
toc: menu
---

# Repository

## `repository.findMany()`

查询数据，返回数组。无数据时为空数组，不返回 count。如果需要，请使用 [repository.paginate()](#repositorypaginate) 方法。

##### Definition

```ts
interface findMany<M extends Sequelize.Model> {
  (options: FindManyOptions): Promise<M[]>
}

interface FindManyOptions extends Sequelize.FindOptions {
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
repository.findMany({
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
await Post.repository.findMany({
  filter: {
    'name': 'post1',
  },
});
```

支持多种 Operators，以 `$` 开头。[更多内容，查阅 Operators 章节](operators.md)

```ts
await Post.repository.findMany({
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
await Post.repository.findMany({
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
await Post.repository.findMany({
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
await Post.repository.findMany({
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
await Post.repository.findMany({
  // 创建日期倒序
  sort: ['-createdAt'],
});
```

可以设置多个排序规则

```ts
await Post.repository.findMany({
  // 创建日期倒序，ID 正序
  sort: ['-createdAt', 'id'],
});
```

也可以是关系表的字段

```ts
await Post.repository.findMany({
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
await Post.repository.findMany();
// [{ id, name, content, createdAt, updatedAt }]
```

只输出指定字段时，可以用 fields

```ts
await Post.repository.findMany({
  fields: ['name'],
});
// [{ name }]
```

当 fields 里有关系字段时，按默认情况输出

```ts
await Post.repository.findMany({
  fields: ['id', 'name', 'tags'],
});
// 
// [{ id, name, createdAt, updatedAt, tags: [{ id, name, createdAt, updatedAt }] }]

```

可以只输出关系数据的某个字段

```ts
await Post.repository.findMany({
  fields: ['id', 'name', 'tags.name'],
});
// [{ id, name, tags: [{ name }] }]
```

排除某些字段时，可以使用 expect

```ts
await Post.repository.findMany({
  expect: ['content'],
});
// [{ id, name, createdAt, updatedAt }]
```

Attributes 不变，只附加 Associations 进来时，可以使用 appends

```ts
await Post.repository.findMany({
  appends: ['tags'],
});
// [{ id, name, content, createdAt, updatedAt, tags: [{ id, name, createdAt, updatedAt }] }]
```

如果某个字段只用在 filter 里，但并没有出现在 fields 里，不应该被输出

```ts
await Post.repository.findMany({
  filter: {
    'tags.name': 'tag1',
  },
});
// 输出所有的 Attributes，但不输出 tags
// [{ id, name, content, createdAt, updatedAt }]
```

如果某个字段只用在 sort 里，但并没有出现在 fields 里，也不应该被输出

```ts
await Post.repository.findMany({
  sort: ['-tags.createdAt']
});
// 输出所有的 Attributes，但不输出 tags
// [{ id, name, content, createdAt, updatedAt }]
```

## `repository.paginate()`

按分页查询数据，并返回所有符合的数据总数。

##### Definition

```ts
interface paginate<M extends Sequelize.Model> {
  (options: PaginateOptions): Promise<[ M[], number ]>
}

interface PaginateOptions extends Sequelize.FindAndCountOptions {
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

大部分参数与 [repository.findMany()](#repositoryfindmany) 一致，所以这里只列举 page 和 pageSize 的例子。

不填写参数时，默认 page=1，pageSize=20。

```ts
repository.paginate();
// [[{ id, name, content, createdAt, updatedAt }], 50]

const [models, count] = await repository.paginate();
```

## `repository.findOne()`

##### Definition

```ts
interface findOne<M extends Sequelize.Model> {
  (options: FindOneOptions): Promise<[ M[], number ]>
}

interface FindOneOptions extends FindManyOptions {
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

大部分参数与 [repository.findMany()](#repositoryfindmany) 一致。这里只列举 filterByPk 的例子。

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
## repository.update()
## repository.destroy()
## repository.relation().of()

### findMany()
### findOne()
### create()
### update()
### destroy()
### set()
### add()
### remove()
### toggle()
