# BelongsToManyRepository

`BelongsToManyRepository` 是用于处理 `BelongsToMany` 关系的 `Relation Repository`。

不同于其他关系类型，`BelongsToMany` 类型的关系需要通过中间表来记录。
在 NocoBase 中定义关联关系，可自动创建中间表，也可以明确指定中间表。

## 类方法

### `find()`

查找关联对象

**签名**

- `async find(options?: FindOptions): Promise<M[]>`

**详细信息**

查询参数与 [`Repository.find()`](../repository.md#find) 一致。

### `findOne()`

查找关联对象，仅返回一条记录

**签名**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

返回符合查询条件的记录数

**签名**

- `async count(options?: CountOptions)`

**类型**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

从数据库查询特定条件的数据集和结果数。

**签名**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**类型**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

创建关联对象

**签名**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

更新符合条件的关联对象

**签名**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

删除符合条件的关联对象

**签名**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

添加新的关联对象

**签名**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**类型**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**详细信息**

可以直接传入关联对象的 `targetKey`，也可将 `targetKey` 与中间表的字段值一并传入。

**示例**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// 传入 targetKey
PostTagRepository.add([t1.id, t2.id]);

// 传入中间表字段
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

设置关联对象

**签名**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**详细信息**

参数同 [add()](#add)

### `remove()`

移除与给定对象之间的关联关系

**签名**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**类型**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

切换关联对象。

在一些业务场景中，经常需要切换关联对象，比如用户收藏商品，用户可以取消收藏，也可以再次收藏。使用 `toggle` 方法可以快速实现类似功能。

**签名**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**详细信息**

`toggle` 方法会自动判断关联对象是否已经存在，如果存在则移除，如果不存在则添加。
