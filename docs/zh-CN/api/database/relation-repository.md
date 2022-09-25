# RelationRepository

`RelationRepository` 是关系类型的 `Repository` 对象，`RelationRepository` 可以实现在不加载关联的情况下对关联数据进行操作。基于 `RelationRepository`，每种关联都派生出对应的实现，分别为 

* [`HasOneRepository`](#has-one-repository)
* `HasManyRepository`
* `BelongsToRepository`
* `BelongsToManyRepository`


## 构造函数

**签名**

* `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `sourceCollection` | `Collection` | - | 关联中的参照关系（referencing relation）对应的 Collection |
| `association` | `string` | - | 关联名称 |
| `sourceKeyValue` | `string \| number` | - | 参照关系中对应的 key 值 |


## 基类属性

### `db: Database`

数据库对象

### `sourceCollection`
关联中的参照关系（referencing relation）对应的 Collection

### `targetCollection`
关联中被参照关系（referenced relation）对应的 Collection

### `association`
sequelize 中的与当前关联对应的 association 对象

### `associationField`
collection 中的与当前关联对应的字段

### `sourceKeyValue`
参照关系中对应的 key 值

## HasOneRepository
`HasOneRepository` 为 `HasOne` 类型的关联 Repository。

```typescript
const User = db.collection({
  name: 'users',
  fields: [
    { type: 'hasOne', name: 'profile' },
    { type: 'string', name: 'name' },
  ],
});

const Profile = db.collection({
  name: 'profiles',
  fields: [{ type: 'string', name: 'avatar' }],
});

const user = await User.repository.create({
  values: { name: 'u1' },
});

// 创建 HasOneRepository 实例
const userProfileRepository = new HasOneRepository(User, 'profile', user.get('id'));

```
### `create(options?: CreateOptions)`
创建关联对象

**签名**

* `async create(options?: CreateOptions): Promise<Model>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `CreateOptions` | - | 参见 repository.create |

**示例**

```typescript
const profile = await UserProfileRepository.create({
  values: { avatar: 'avatar1' },
});

console.log(profile.toJSON());
/*
{
  id: 1,
  avatar: 'avatar1',
  userId: 1,
  updatedAt: 2022-09-24T13:59:40.025Z,
  createdAt: 2022-09-24T13:59:40.025Z
}
*/

```

### `find()`

查找关联对象

**签名**

* `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.fields` | `Fields` | - | 参见 repository.find.fields |
| `options.except` | `Except` | - | 参见 repository.find.except |
| `options.appends` | `Appends` | - | 参见 repository.find.appends |
| `options.filter` | `Filter` | - | 参见 repository.find.filter |

**示例**

```typescript
const profile = await UserProfileRepository.find();
// 关联对象不存在时，返回 null
```

### `update()`

更新关联对象

**签名**

* `async update(options: UpdateOptions): Promise<Model>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | `UpdateOptions` | - | 参见 repository.update |

**示例**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

移除关联对象，仅解除关联关系，不删除关联对象

**签名**

* `async remove(options?: Transactionable): Promise<void>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.transaction` | `Transaction` | - | Transaction |

**示例**

```typescript
await UserProfileRepository.remove();
await UserProfileRepository.find() == null; // true

await Profile.repository.count() === 1; // true
```

### `destroy()`

删除关联对象

**签名**

* `async destroy(options?: Transactionable): Promise<Boolean>`


**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options.transaction` | `Transaction` | - | Transaction |

**示例**

```typescript
await UserProfileRepository.destroy();
await UserProfileRepository.find() == null; // true
await Profile.repository.count() === 0; // true
```

### `set()`

设置关联对象

**签名**

* `async set(options: TargetKey | SetOption): Promise<void>`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `options` | ` TargetKey \| SetOption` | - | 需要 set 的对象的 targetKey，如果需要一同传入 transaction 则修改为 object 类型参数 |

**示例**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```

## BelongsToRepository

`BelongsToRepository` 是用于处理 `BelongsTo` 关系的 `Repository`，它提供了一些便捷的方法来处理 `BelongsTo` 关系。其接口与 [HasOneRepository](#has-one-repository) 一致。

## HasManyRepository

`HasManyRepository` 是用于处理 `HasMany` 关系的 `Repository`。

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

## BelongsToManyRepository

### `count()`

### `find()`

### `findOne()`

### `findAndCount()`

### `create()`

### `update()`

### `destroy()`

### `add()`

### `remove()`

### `set()`

### `toggle()`
