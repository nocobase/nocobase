:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# コレクション

## 概要

`コレクション` は、システム内のデータモデルを定義するために使用されます。モデル名、フィールド、インデックス、関連付けなどの情報を定義します。
通常、`Database` インスタンスの `collection` メソッドを介して呼び出されます。

```javascript
const { Database } = require('@nocobase/database')

// データベースインスタンスを作成します
const db = new Database({...});

// データモデルを定義します
db.collection({
  name: 'users',
  // モデルのフィールドを定義します
  fields: [
    // スカラーフィールド
    {
      name: 'name',
      type: 'string',
    },

    // 関連付けフィールド
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

その他のフィールドタイプについては、[フィールド](/api/database/field) を参照してください。

## コンストラクタ

**シグネチャ**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**パラメータ**

| パラメータ名                | タイプ                                                        | デフォルト値 | 説明                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -      | コレクションの識別子                                                                        |
| `options.tableName?`  | `string`                                                    | -      | データベースのテーブル名です。指定しない場合、`options.name` の値が使用されます。                                           |
| `options.fields?`     | `FieldOptions[]`                                            | -      | フィールドの定義です。詳細は [フィールド](./field) を参照してください。                                                        |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | Sequelize のモデルタイプです。`string` を使用する場合、事前にそのモデル名が `db` に登録されている必要があります。 |
| `options.repository?` | `string \| RepositoryType`                                  | -      | リポジトリタイプです。`string` を使用する場合、事前にそのリポジトリタイプが `db` に登録されている必要があります。                |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | データソート可能フィールドの設定です。デフォルトではソートされません。                                                         |
| `options.autoGenId?`  | `boolean`                                                   | `true` | 一意のプライマリキーを自動生成するかどうかです。デフォルトは `true` です。                                                    |
| `context.database`    | `Database`                                                  | -      | 現在のコンテキストに属するデータベースインスタンスです。                                                                 |

**例**

投稿のコレクションを作成する例：

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // 既存のデータベースインスタンス
    database: db,
  },
);
```

## インスタンスメンバー

### `options`

コレクションの初期設定パラメータです。コンストラクタの `options` パラメータと同じです。

### `context`

現在のコレクションが属するコンテキストです。主にデータベースインスタンスを指します。

### `name`

コレクション名です。

### `db`

所属するデータベースインスタンスです。

### `filterTargetKey`

プライマリキーとして使用されるフィールド名です。

### `isThrough`

中間コレクションかどうかを示します。

### `model`

Sequelize のモデルタイプに一致します。

### `repository`

リポジトリインスタンスです。

## フィールド設定メソッド

### `getField()`

コレクションに定義されている、指定された名前のフィールドオブジェクトを取得します。

**シグネチャ**

- `getField(name: string): Field`

**パラメータ**

| パラメータ名 | タイプ     | デフォルト値 | 説明     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | フィールド名 |

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

コレクションにフィールドを設定します。

**シグネチャ**

- `setField(name: string, options: FieldOptions): Field`

**パラメータ**

| パラメータ名    | タイプ           | デフォルト値 | 説明                            |
| --------- | -------------- | ------ | ------------------------------- |
| `name`    | `string`       | -      | フィールド名                        |
| `options` | `FieldOptions` | -      | フィールド設定です。詳細は [フィールド](./field) を参照してください。 |

**例**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

コレクションに複数のフィールドを一括で設定します。

**シグネチャ**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**パラメータ**

| パラメータ名        | タイプ             | デフォルト値 | 説明                            |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields`      | `FieldOptions[]` | -      | フィールド設定です。詳細は [フィールド](./field) を参照してください。 |
| `resetFields` | `boolean`        | `true` | 既存のフィールドをリセットするかどうかです。            |

**例**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

コレクションに定義されている、指定された名前のフィールドオブジェクトを削除します。

**シグネチャ**

- `removeField(name: string): void | Field`

**パラメータ**

| パラメータ名 | タイプ     | デフォルト値 | 説明     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | フィールド名 |

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

コレクションのフィールドをリセット（クリア）します。

**シグネチャ**

- `resetFields(): void`

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

コレクションに指定された名前のフィールドオブジェクトが定義されているかどうかを判断します。

**シグネチャ**

- `hasField(name: string): boolean`

**パラメータ**

| パラメータ名 | タイプ     | デフォルト値 | 説明     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | フィールド名 |

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

コレクション内で条件に一致するフィールドオブジェクトを検索します。

**シグネチャ**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**パラメータ**

| パラメータ名      | タイプ                        | デフォルト値 | 説明     |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | -      | 検索条件 |

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

コレクション内のフィールドオブジェクトを反復処理します。

**シグネチャ**

- `forEachField(callback: (field: Field) => void): void`

**パラメータ**

| パラメータ名     | タイプ                     | デフォルト値 | 説明     |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | -      | コールバック関数 |

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## インデックス設定メソッド

### `addIndex()`

コレクションにインデックスを追加します。

**シグネチャ**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**パラメータ**

| パラメータ名  | タイプ                                                         | デフォルト値 | 説明                 |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]`                                         | -      | インデックスを設定するフィールド名 |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | 完全な設定             |

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

コレクションからインデックスを削除します。

**シグネチャ**

- `removeIndex(fields: string[])`

**パラメータ**

| パラメータ名   | タイプ       | デフォルト値 | 説明                     |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | -      | 削除するインデックスのフィールド名の組み合わせ |

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## コレクション設定メソッド

### `remove()`

コレクションを削除します。

**シグネチャ**

- `remove(): void`

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## データベース操作メソッド

### `sync()`

コレクションの定義をデータベースに同期します。Sequelize の `Model.sync` のデフォルトロジックに加えて、関連付けフィールドに対応するコレクションも処理します。

**シグネチャ**

- `sync(): Promise<void>`

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

コレクションがデータベースに存在するかどうかを判断します。

**シグネチャ**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**パラメータ**

| パラメータ名                 | タイプ          | デフォルト値 | 説明     |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | -      | トランザクションインスタンス |

**例**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**シグネチャ**

- `removeFromDb(): Promise<void>`

**例**

```ts
const books = db.collection({
  name: 'books',
});

// 書籍のコレクションをデータベースに同期します
await db.sync();

// データベースから書籍のコレクションを削除します
await books.removeFromDb();
```