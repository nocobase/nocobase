# HasOneRepository
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

## 类方法

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
