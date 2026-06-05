:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# フィールド

## 概览

コレクションのフィールド管理クラス（抽象クラス）です。すべてのフィールドタイプの基底クラスでもあり、他の任意のフィールドタイプはこのクラスを継承して実装されます。

フィールドをカスタマイズする方法については、[フィールドタイプを拡張する]をご参照ください。

## コンストラクター

通常、開発者が直接呼び出すことはありません。主に `db.collection({ fields: [] })` メソッドを介してプロキシとして呼び出されます。

フィールドを拡張する際は、主に `Field` 抽象クラスを継承し、それを `Database` インスタンスに登録することで実装されます。

**シグネチャ**

- `constructor(options: FieldOptions, context: FieldContext)`

**パラメータ**

| パラメータ名               | 型           | デフォルト値 | 説明                                     |
| -------------------- | -------------- | ------ | ---------------------------------------- |
| `options`            | `FieldOptions` | -      | フィールド設定オブジェクト               |
| `options.name`       | `string`       | -      | フィールド名                             |
| `options.type`       | `string`       | -      | フィールドタイプ。db に登録されているフィールドタイプ名に対応します。 |
| `context`            | `FieldContext` | -      | フィールドコンテキストオブジェクト       |
| `context.database`   | `Database`     | -      | データベースインスタンス                 |
| `context.collection` | `Collection`   | -      | コレクションインスタンス                 |

## インスタンスメンバー

### `name`

フィールド名。

### `type`

フィールドタイプ。

### `dataType`

フィールドのデータベース保存タイプ。

### `options`

フィールドの初期化設定パラメータ。

### `context`

フィールドコンテキストオブジェクト。

## 設定メソッド

### `on()`

コレクションイベントに基づくショートカット定義方法です。これは `db.on(this.collection.name + '.' + eventName, listener)` と同等です。

継承時にこのメソッドをオーバーライドする必要は通常ありません。

**シグネチャ**

- `on(eventName: string, listener: (...args: any[]) => void)`

**パラメータ**

| パラメータ名      | 型                       | デフォルト値 | 説明       |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string`                   | -      | イベント名 |
| `listener`  | `(...args: any[]) => void` | -      | イベントリスナー |

### `off()`

コレクションイベントに基づくショートカット削除方法です。これは `db.off(this.collection.name + '.' + eventName, listener)` と同等です。

継承時にこのメソッドをオーバーライドする必要は通常ありません。

**シグネチャ**

- `off(eventName: string, listener: (...args: any[]) => void)`

**パラメータ**

| パラメータ名      | 型                       | デフォルト値 | 説明       |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string`                   | -      | イベント名 |
| `listener`  | `(...args: any[]) => void` | -      | イベントリスナー |

### `bind()`

フィールドがコレクションに追加されたときに実行される内容です。通常、コレクションイベントリスナーの追加やその他の処理に使用されます。

継承時には、対応する `super.bind()` メソッドを最初に呼び出す必要があります。

**シグネチャ**

- `bind()`

### `unbind()`

フィールドがコレクションから削除されたときに実行される内容です。通常、コレクションイベントリスナーの削除やその他の処理に使用されます。

継承時には、対応する `super.unbind()` メソッドを最初に呼び出す必要があります。

**シグネチャ**

- `unbind()`

### `get()`

フィールドの設定項目の値を取得します。

**シグネチャ**

- `get(key: string): any`

**パラメータ**

| パラメータ名 | 型     | デフォルト値 | 説明       |
| ------ | -------- | ------ | ---------- |
| `key`  | `string` | -      | 設定項目名 |

**例**

```ts
const field = db.collection('users').getField('name');

// フィールド名設定項目の値を取得します（'name' を返します）
console.log(field.get('name'));
```

### `merge()`

フィールドの設定項目の値をマージします。

**シグネチャ**

- `merge(options: { [key: string]: any }): void`

**パラメータ**

| パラメータ名    | 型                     | デフォルト値 | 説明               |
| --------- | ------------------------ | ------ | ------------------ |
| `options` | `{ [key: string]: any }` | -      | マージする設定項目オブジェクト |

**例**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // インデックス設定を追加します
  index: true,
});
```

### `remove()`

コレクションからフィールドを削除します（メモリからのみ削除）。

**例**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// データベースから実際に削除
await books.sync();
```

## データベースメソッド

### `removeFromDb()`

データベースからフィールドを削除します。

**シグネチャ**

- `removeFromDb(options?: Transactionable): Promise<void>`

**パラメータ**

| パラメータ名                 | 型          | デフォルト値 | 説明     |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | -      | トランザクションインスタンス |

### `existsInDb()`

フィールドがデータベースに存在するかどうかを判断します。

**シグネチャ**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**パラメータ**

| パラメータ名                 | 型          | デフォルト値 | 説明     |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | -      | トランザクションインスタンス |

## 組み込みフィールドタイプ一覧

NocoBase には、いくつかの一般的なフィールドタイプが組み込まれています。コレクションのフィールドを定義する際に、対応する `type` 名を使用してタイプを指定できます。フィールドタイプによってパラメータ設定が異なりますので、詳細は以下のリストをご参照ください。

以下で別途説明されているものを除き、すべてのフィールドタイプの構成項目は Sequelize にそのまま渡されます。そのため、Sequelize がサポートするすべてのフィールド構成項目（例: `allowNull`、`defaultValue` など）をここで使用できます。

また、サーバー側のフィールドタイプは主にデータベースストレージと一部のアルゴリズムの問題を解決するものであり、フロントエンドのフィールド表示タイプや使用されるコンポーネントとは基本的に関係ありません。フロントエンドのフィールドタイプについては、チュートリアルの該当する説明をご参照ください。

### `'boolean'`

真偽値タイプ。

**例**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

整数型（32ビット）。

**例**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

長整数型（64ビット）。

**例**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

倍精度浮動小数点型（64ビット）。

**例**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

実数型（PostgreSQLのみ）。

### `'decimal'`

10進数型。

### `'string'`

文字列型。ほとんどのデータベースの `VARCHAR` 型に相当します。

**例**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

テキスト型。ほとんどのデータベースの `TEXT` 型に相当します。

**例**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

パスワードタイプ（NocoBase拡張）。Node.js のネイティブ `crypto` パッケージの `scrypt` メソッドに基づいてパスワードを暗号化します。

**例**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // 長さ（デフォルトは64）
      randomBytesSize: 8, // ランダムバイト長（デフォルトは8）
    },
  ],
});
```

**パラメータ**

| パラメータ名            | 型     | デフォルト値 | 説明         |
| ----------------- | -------- | ------ | ------------ |
| `length`          | `number` | 64     | 文字長       |
| `randomBytesSize` | `number` | 8      | ランダムバイトサイズ |

### `'date'`

日付タイプ。

### `'time'`

時間タイプ。

### `'array'`

配列タイプ（PostgreSQLのみ）。

### `'json'`

JSONタイプ。

### `'jsonb'`

JSONBタイプ（PostgreSQLのみ。その他は `'json'` タイプと互換性があります）。

### `'uuid'`

UUIDタイプ。

### `'uid'`

UIDタイプ（NocoBase拡張）。短いランダム文字列識別子タイプ。

### `'formula'`

数式タイプ（NocoBase拡張）。[mathjs](https://www.npmjs.com/package/mathjs) に基づく数式計算を設定できます。数式では、同じレコード内の他の列の値を参照して計算に参加させることができます。

**例**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

ラジオタイプ（NocoBase拡張）。コレクション全体で、このフィールドの値が `true` となるデータは最大1行のみです。その他はすべて `false` または `null` になります。

**例**

システム全体で `root` とマークされたユーザーは1人だけです。他のユーザーの `root` 値が `true` に変更されると、それまで `root` が `true` だった他のすべてのレコードは `false` に変更されます。

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

ソートタイプ（NocoBase拡張）。整数値に基づいてソートします。新しいレコードには自動的に新しいシーケンス番号が生成され、データを移動する際にはシーケンス番号が再配置されます。

コレクションが `sortable` オプションを定義している場合、対応するフィールドも自動的に生成されます。

**例**

記事は所属ユーザーに基づいてソート可能です。

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // userId が同じ値でグループ化されたデータをソートします
    },
  ],
});
```

### `'virtual'`

仮想タイプ。実際にデータを保存しません。特殊な getter/setter 定義時にのみ使用されます。

### `'belongsTo'`

多対一関連タイプ。外部キーは自身のテーブルに保存されます。`hasOne`/`hasMany` とは対照的です。

**例**

どの記事も特定の作者に属します。

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // 設定しない場合、デフォルトで name の複数形がコレクション名として使用されます
      foreignKey: 'authorId', // 設定しない場合、デフォルトで <name> + Id の形式になります
      sourceKey: 'id', // 設定しない場合、デフォルトでターゲットコレクションの id になります
    },
  ],
});
```

### `'hasOne'`

一対一関連タイプ。外部キーは関連コレクションに保存されます。`belongsTo` とは対照的です。

**例**

すべてのユーザーはプロフィールを1つ持っています。

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // 省略可能です
    },
  ],
});
```

### `'hasMany'`

一対多関連タイプ。外部キーは関連コレクションに保存されます。`belongsTo` とは対照的です。

**例**

どのユーザーも複数の記事を所有できます。

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

多対多関連タイプ。中間テーブルを使用して両側の外部キーを保存します。既存のテーブルを中間テーブルとして指定しない場合、中間テーブルが自動的に作成されます。

**例**

どの記事にも複数のタグを付けられ、どのタグも複数の記事に追加できます。

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // 同名の場合は省略可能です
      through: 'postsTags', // 中間テーブルを設定しない場合、自動的に生成されます
      foreignKey: 'postId', // 中間テーブルにおける自身のテーブルの外部キー
      sourceKey: 'id', // 自身のテーブルの主キー
      otherKey: 'tagId', // 中間テーブルにおける関連テーブルの外部キー
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // 同じ関係グループは同じ中間テーブルを指します
    },
  ],
});
```