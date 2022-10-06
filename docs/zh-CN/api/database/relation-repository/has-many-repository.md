
# HasManyRepository

`HasManyRepository` 是用于处理 `HasMany` 关系的 `Repository`。

## 类方法

### `find()`

查找关联对象

**签名**

* `async find(options?: FindOptions): Promise<M[]>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `FindOptions` | - | 参见 repository.find |

### `findOne()`

查找关联对象，仅返回一条记录

**签名**

* `async findOne(options?: FindOneOptions): Promise<M>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `FindOneOptions` | - | 参见 repository.findOne |

### `count()`

返回符合查询条件的记录数

**签名**

* `async count(options?: CountOptions)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `CountOptions` | - | 参见 repository.count |


### `findAndCount()`

同时返回符合查询条件的记录集合与记录数

**签名**

* `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `FindAndCountOptions` | - | 参见 repository.findAndCount |


### `create()`

创建关联对象

**签名**

* `async create(options?: CreateOptions): Promise<M>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `CreateOptions` | - | 参见 repository.create |


### `update()`

更新符合条件的关联对象

**签名**

* `async update(options?: UpdateOptions): Promise<M>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `UpdateOptions` | - | 参见 repository.update |


### `destroy()`

删除符合条件的关联对象

**签名**

* `async destroy(options?: TK | DestroyOptions): Promise<M>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `TK \|DestroyOptions` | - | 传入删除对象的 `targetKeyId`，或者 `targetKeyId` 数组。需传 `transaction` 时 使用 `DestroyOptions` 类型 |

### `add()`

添加关联对象

**签名**
* `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `TargetKey` | - | 关联对象的 `targetKeyId` |
| `options` | `TargetKey[]` | - | 多个关联对象的 `targetKeyId` 数组 |
| `options` | `AssociatedOptions` | - | `options.tk`, 为 `targetKeyId` 或者 `targetKeyId` 数组；`options.transaction`，为 `Transaction` 对象 |


### `remove()`

移除符合条件的关联对象

**签名**
* `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `TargetKey \| TargetKey[] \| AssociatedOptions` | - | 同 [add](#add) |


### `set()`

设置当前关系的关联对象

**签名**

* `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `TargetKey \| TargetKey[] \| AssociatedOptions` | - | 同 [add](#add) |
