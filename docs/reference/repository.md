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
  except?: string[];
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
    // scope 的情况
    scopeName: 'val1',
  },
  // 字段白名单
  fields: [],
  // 附加字段，主要用于附加关系字段
  appends: [],
  // 字段黑名单
  except: [],
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

支持多种 Operators，以 `$` 开头。[更多内容，查阅 Operators 章节](filter-operators.md)

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

也支持 [scopes](https://sequelize.org/master/manual/scopes.html)

```ts
Post.model.addScope('published', () => {
  return {
    where: {
      status: 'published',
    },
  }
});

await Post.repository.find({
  filter: {
    published: true,
  },
});
```

如果 scope name 和 field name 冲突时，scope 优先级更高

```ts
Post.model.addScope('level', (value) => {
  return {
    where: {
      level: { [Op.gte]: value }
    },
  }
});

await Post.repository.find({
  filter: {
    level: 1,
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
- `except` 不显示哪些字段
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

排除某些字段时，可以使用 except

```ts
await Post.repository.find({
  except: ['content'],
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

fields、appends、except 同时出现时，优先处理 fields，再把 appends 的合并进来，最后处理 except。

fields 和 appends 同时出现时：

```ts
{
  fields: ['id', 'name'],
  appends: ['tags'],
}
// 等同于 
{
  fields: ['id', 'name', 'tags'],
}
// { id, name, tags: [ { id, name, createdAt, updatedAt } ] }
```

fields 和 except 同时出现时，如果 except 的 key 在 fields 里，需要排除掉

```ts
{
  fields: ['id', 'name'],
  except: ['name'],
}
// { id }
```

fields 取了多个关联字段的子字段，但是 except 把整个关联字段都排除了

```ts
{
  fields: ['id', 'name', 'tags.id', 'tags.name'],
  except: ['tags'],
}
// tags 排除了，tags.id 和 tags.name 都不应该被输出
// { id, name }
```

fields 和 except 同时出现时，如果 except 的 key 不在 fields 里，不处理。

```ts
{
  fields: ['id', 'name'],
  except: ['tags.createdAt', 'tags.updatedAt'],
}
// { id, name }
```


fields、appends、except 同时出现时：

```ts
{
  fields: ['id', 'name'],
  appends: ['tags'],
  except: ['tags.createdAt', 'tags.updatedAt'],
}
// { id, name, tags: [ { id, name } ] }
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
  except?: string[];
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
  except?: string[];
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

## repository.count()


##### Definition

```ts
interface count {
  (options?: CountOptions): Promise<number>;
}

interface CountOptions extends Sequelize.CountOptions {
  filter?: any;
}
// Sequelize.CountOptions 的参数说明
// distinct 就不传了，自动处理，有关联数据时，distinct=true
```

##### Examples

```ts
repository.count({
  filter: {},
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
  (options: UpdateOptions): Promise<any>
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
    name: 'post 1'
  },
  values: {
    name: 'post 2'
  },
});
// 对应的 SQL 为
// update posts set name = 'post 2' where name = 'post 1'
```

filter 和 values 都可能包含关联字段，如将 name 为 user 1 的文章的 user 改为 id=3 的 user

```ts
await Post.repository.update({
  filter: {
    'user.name': 'user 1'
  },
  values: {
    user: 3
  },
});
```

values 也可以是关系数据，参数与 create 的 values 一致：

```ts
await repository.update({
  filterByPk: 1,
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
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues: ['subTable'],
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
  filterByPk?: number | string | number[] | string[];
  transaction?: Sequelize.Transaction;
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
interface relation<R extends RelationRepository> {
  (name: string): {
    of: (parent: any): R;
  }
}
```

##### Examples

```ts
const userPostsRepository = User.repository.relation<HasManyRepository>('posts').of(1);
```

RelationRepository 有四类，对应四种关系的处理：

- HasOneRepository
- HasManyRepository
- BelongsToRepository
- BelongsToManyRepository

### HasOne

##### Definition

```ts
interface IHasOneRepository<M extends Sequelize.Model> {
  // 不需要 findOne，find 就是 findOne
  find(options?: HasOneFindOptions): Promise<M>;
  // 新增并关联，如果存在关联，解除之后，与新数据建立关联
  create(options?: CreateOptions): Promise<M>;
  // 更新
  update(options?: UpdateOptions): Promise<M>;
  // 删除
  destroy(): Promise<Boolean>;
  // 建立关联
  set(options: PrimaryKey | AssociatedOptions): Promise<void>;
  // 移除关联
  remove(options?: AssociatedOptions): Promise<void>;
}

interface HasOneFindOptions {
  fields?: string[];
  except?: string[];
  appends?: string[];
}
```

##### Examples

以 user.profile 为例

```ts
// id = 1 的 user 的 profile
const userProfileRepository = User.repository.relation<HasOneRepository>('profile').of(1);

const profile = await userProfileRepository.find({
  fields,
  appends,
  except,
});
```

### BelongsTo

##### Definition

```ts
interface IBelongsToRepository<M extends Sequelize.Model> {
  // 不需要 findOne，find 就是 findOne
  find(options?: BelongsToFindOptions): Promise<M>;
  // 新增并关联，如果存在关联，解除之后，与新数据建立关联
  create(options?: CreateOptions): Promise<M>;
  // 更新
  update(options?: UpdateOptions): Promise<M>;
  // 删除
  destroy(): Promise<Boolean>;
  // 建立关联
  set(options: PrimaryKey | AssociatedOptions): Promise<void>;
  // 移除关联
  remove(options?: AssociatedOptions): Promise<void>;
}

type PrimaryKey = string | number;

interface AssociatedOptions {
  transaction?: Sequelize.Transaction;
}

interface HasOneFindOptions {
  fields?: string[];
  except?: string[];
  appends?: string[];
}
```

##### Examples

以 posts.user 为例

```ts
// id = 1 的 post 的 user
const postUserRepository = Post.repository.relation<BelongsToRepository>('user').of(1);

const user = await postUserRepository.find({
  fields,
  appends,
  except,
});
```

### HasMany

##### Definition

```ts
interface IHasManyRepository<M extends Sequelize.Model> {
  find(options?: FindOptions): Promise<M>;
  findAndCount(options?: FindAndCountOptions): Promise<[ M[], number ]>
  findOne(options?: FindOneOptions): Promise<M>;
  // 新增并关联
  create(options?: CreateOptions): Promise<M>;
  // 更新
  update(options?: UpdateOptions): Promise<M>;
  // 删除
  destroy(options?: number | string | number[] | string[] | DestroyOptions): Promise<Boolean>;
  // 建立关联
  set(options: PrimaryKey | PrimaryKey[] | AssociatedOptions): Promise<void>;
  // 附加关联
  add(options: PrimaryKey | PrimaryKey[] | AssociatedOptions): Promise<void>;
  // 移除关联
  remove(options: PrimaryKey | PrimaryKey[] | AssociatedOptions): Promise<void>;
}

type PrimaryKey = string | number;

interface AssociatedOptions {
  pk?: PrimaryKey | PrimaryKey[];
  transaction?: Sequelize.Transaction;
}
```

##### Examples

```ts
repository.find();
repository.create();
repository.update({
  filterByPk: 1,
  values: {},
});
repository.set(1);
repository.set([1, 2]);
repository.add([3]);
repository.remove(1);
repository.remove([2, 3]);
```

### BelongsToMany

##### Definition

```ts
interface IBelongsToManyRepository<M extends Sequelize.Model> {
  find(options?: FindOptions): Promise<M[]>;
  findAndCount(options?: FindAndCountOptions): Promise<[ M[], number ]>
  findOne(options?: FindOneOptions): Promise<M>;
  // 新增并关联，存在中间表数据
  create(options?: CreateBelongsToManyOptions): Promise<M>;
  // 更新，存在中间表数据
  update(options?: UpdateOptions): Promise<M>;
  // 删除
  destroy(options?: number | string | number[] | string[] | DestroyOptions): Promise<Boolean>;
  // 建立关联
  set(options: PrimaryKey | PrimaryKey[] | ThroughValues | ThroughValues[] | AssociatedOptions): Promise<void>;
  // 附加关联，存在中间表数据
  add(options: PrimaryKey | PrimaryKey[] | ThroughValues | ThroughValues[] | AssociatedOptions): Promise<void>;
  // 移除关联
  remove(options: PrimaryKey | PrimaryKey[] | AssociatedOptions): Promise<void>;
  toggle(options: PrimaryKey | AssociatedOptions): Promise<void>;
}

type PrimaryKey = string | number;

interface AssociatedOptions {
  pk?: PrimaryKey | PrimaryKey[];
  transaction?: Sequelize.Transaction;
}
```

##### Examples

多对多关系多了中间表的处理

```ts
repository.add(1);
repository.add([1, {/* 中间表数据 */}]);
repository.add([1,2,3]);
repository.add([
  [1, {/* 中间表数据 */}],
  [2, {/* 中间表数据 */}],
  [3, {/* 中间表数据 */}],
]);

repository.set(1);
repository.set([1, {/* 中间表数据 */}]);
repository.set([1,2,3]);
repository.set([
  [1, {/* 中间表数据 */}],
  [2, {/* 中间表数据 */}],
  [3, {/* 中间表数据 */}],
]);
```
