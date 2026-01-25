# HasManyRepository

`HasManyRepository` 是用于处理 `HasMany` 关系的 `Relation Repository`。

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

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

添加对象关联关系

**签名**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**类型**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**详细信息**

- `tk` - 关联对象的 targetKey 值，可以是单个值，也可以是数组。
  <embed src="../shared/transaction.md"></embed>

### `remove()`

移除与给定对象之间的关联关系

**签名**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**详细信息**

参数同 [`add()`](#add) 方法。

### `set()`

设置当前关系的关联对象

**签名**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**详细信息**

参数同 [`add()`](#add) 方法。
