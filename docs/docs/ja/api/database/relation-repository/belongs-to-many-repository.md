:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# BelongsToManyRepository

`BelongsToManyRepository` は、`BelongsToMany` リレーションシップを扱うための「リレーションリポジトリ」です。

他のリレーションシップタイプとは異なり、`BelongsToMany` タイプのリレーションシップは中間テーブルを介して記録する必要があります。NocoBase で関連リレーションシップを定義する際、中間テーブルは自動的に作成することも、明示的に指定することも可能です。

## クラスメソッド

### `find()`

関連オブジェクトを検索します。

**シグネチャ**

- `async find(options?: FindOptions): Promise<M[]>`

**詳細**

クエリパラメータは [`Repository.find()`](../repository.md#find) と同じです。

### `findOne()`

関連オブジェクトを検索し、1件のレコードのみを返します。

**シグネチャ**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

クエリ条件に一致するレコード数を返します。

**シグネチャ**

- `async count(options?: CountOptions)`

**型**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

特定の条件に一致するデータセットと、その結果の総数をデータベースからクエリします。

**シグネチャ**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**型**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

関連オブジェクトを作成します。

**シグネチャ**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

条件に一致する関連オブジェクトを更新します。

**シグネチャ**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

条件に一致する関連オブジェクトを削除します。

**シグネチャ**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

新しい関連オブジェクトを追加します。

**シグネチャ**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**型**

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

**詳細**

関連オブジェクトの `targetKey` を直接渡すことも、`targetKey` と中間テーブルのフィールド値を一緒に渡すこともできます。

**例**

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

// targetKey を渡す
PostTagRepository.add([t1.id, t2.id]);

// 中間テーブルのフィールドを渡す
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

関連オブジェクトを設定します。

**シグネチャ**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**詳細**

パラメータは [`add()`](#add) と同じです。

### `remove()`

指定されたオブジェクトとの関連リレーションシップを削除します。

**シグネチャ**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**型**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

関連オブジェクトをトグルします。

ビジネスシーンでは、関連オブジェクトを切り替える必要があることがよくあります。例えば、ユーザーが商品を「お気に入り」に追加したり、解除したり、再度追加したりするような場合です。`toggle` メソッドを使用すると、このような機能を素早く実装できます。

**シグネチャ**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**詳細**

`toggle` メソッドは、関連オブジェクトが既に存在するかどうかを自動的に判断します。存在する場合は削除し、存在しない場合は追加します。