:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# HasOneRepository

## 概要

`HasOneRepository` は、`HasOne` タイプの関連リポジトリです。

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

// 関連リポジトリを取得します
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// 直接初期化することも可能です
new HasOneRepository(User, 'profile', user.get('id'));
```

## クラスメソッド

### `find()`

関連オブジェクトを検索します。

**シグネチャ**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**型**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**詳細**

クエリパラメータは [`Repository.find()`](../repository.md#find) と同じです。

**例**

```typescript
const profile = await UserProfileRepository.find();
// 関連オブジェクトが存在しない場合は、null を返します
```

### `create()`

関連オブジェクトを作成します。

**シグネチャ**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**例**

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

関連オブジェクトを更新します。

**シグネチャ**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**例**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

関連オブジェクトを削除します。これは関連付けを解除するだけで、関連オブジェクト自体は削除しません。

**シグネチャ**

- `async remove(options?: Transactionable): Promise<void>`

**詳細**

- `transaction`: トランザクションオブジェクトです。トランザクションパラメータが渡されない場合、このメソッドは自動的に内部トランザクションを作成します。

**例**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

関連オブジェクトを削除します。

**シグネチャ**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**詳細**

- `transaction`: トランザクションオブジェクトです。トランザクションパラメータが渡されない場合、このメソッドは自動的に内部トランザクションを作成します。

**例**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

関連オブジェクトを設定します。

**シグネチャ**

- `async set(options: TargetKey | SetOption): Promise<void>`

**型**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**詳細**

- `tk`: 設定する関連オブジェクトの `targetKey` です。
- `transaction`: トランザクションオブジェクトです。トランザクションパラメータが渡されない場合、このメソッドは自動的に内部トランザクションを作成します。

**例**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```