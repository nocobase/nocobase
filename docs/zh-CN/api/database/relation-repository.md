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

* `async find(options?: FindOptions): Promise<Model[]>`

```typescript
const profile = await UserProfileRepository.find();
// 关联对象不存在时，返回 null
```

### `update()`

更新关联对象

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

移除关联对象，仅解除关联关系，不删除关联对象

```typescript
await UserProfileRepository.remove();
await UserProfileRepository.find() == null; // true

await Profile.repository.count() === 1; // true
```

### `destroy()`

删除关联对象

```typescript
await UserProfileRepository.destroy();
await UserProfileRepository.find() == null; // true
await Profile.repository.count() === 0; // true
```

### `set()`

设置关联对象

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile);

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```

## BelongsToRepository

### `find()`

### `update()`

### `destroy()`

### `remove()`

### `set()`

## HasManyRepository

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
