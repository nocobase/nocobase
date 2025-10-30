# HasOneRepository

## 概览

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

// 获取到关联 Repository
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// 也可直接初始化
new HasOneRepository(User, 'profile', user.get('id'));
```

## 类方法

### `find()`

查找关联对象

**签名**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**类型**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**详细信息**

查询参数与 [`Repository.find()`](../repository.md#find) 一致。

**示例**

```typescript
const profile = await UserProfileRepository.find();
// 关联对象不存在时，返回 null
```

### `create()`

创建关联对象

**签名**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

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

### `update()`

更新关联对象

**签名**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

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

- `async remove(options?: Transactionable): Promise<void>`

**详细信息**

- `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。

**示例**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

删除关联对象

**签名**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**详细信息**

- `transaction`: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。

**示例**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

设置关联对象

**签名**

- `async set(options: TargetKey | SetOption): Promise<void>`

**类型**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**详细信息**

- tk: 设置关联对象的 targetKey
- transaction: 事务对象。如果没有传入事务参数，该方法会自动创建一个内部事务。

**示例**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```
