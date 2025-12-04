:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# データベース

## 概要

データベースは、NocoBaseが提供するデータベース操作ツールで、ノーコード・ローコードアプリケーション向けに非常に便利なデータベース連携機能を提供しています。現在サポートしているデータベースは以下の通りです。

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### データベースへの接続

`Database` コンストラクタでは、`options` パラメータを渡すことでデータベース接続を設定できます。

```javascript
const { Database } = require('@nocobase/database');

// SQLite データベース設定パラメータ
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// MySQL / PostgreSQL データベース設定パラメータ
const database = new Database({
  dialect: /* 'postgres' または 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

詳細な設定パラメータについては、[コンストラクタ](#コンストラクタ) をご参照ください。

### データモデルの定義

`Database` は**コレクション**を通じてデータベース構造を定義します。一つの**コレクション**オブジェクトは、データベース内のテーブル一つを表します。

```javascript
// コレクションの定義
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

データベース構造の定義が完了したら、`sync()` メソッドを使用してデータベース構造を同期できます。

```javascript
await database.sync();
```

**コレクション**のより詳細な使用方法については、[コレクション](/api/database/collection) をご参照ください。

### データの読み書き

`Database` は**リポジトリ**を通じてデータを操作します。

```javascript
const UserRepository = UserCollection.repository();

// 作成
await UserRepository.create({
  name: 'ジョン',
  age: 18,
});

// 検索
const user = await UserRepository.findOne({
  filter: {
    name: 'ジョン',
  },
});

// 更新
await UserRepository.update({
  values: {
    age: 20,
  },
});

// 削除
await UserRepository.destroy(user.id);
```

データCRUDのより詳細な使用方法については、[リポジトリ](/api/database/repository) をご参照ください。

## コンストラクタ

**シグネチャ**

- `constructor(options: DatabaseOptions)`

データベースインスタンスを作成します。

**パラメータ**

| パラメータ名                 | 型           | デフォルト値  | 説明                                                                                                                |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | データベースホスト                                                                                                          |
| `options.port`         | `number`       | -             | データベースサービスポート。使用するデータベースに応じてデフォルトポートがあります。                                                                      |
| `options.username`     | `string`       | -             | データベースユーザー名                                                                                                        |
| `options.password`     | `string`       | -             | データベースパスワード                                                                                                          |
| `options.database`     | `string`       | -             | データベース名                                                                                                          |
| `options.dialect`      | `string`       | `'mysql'`     | データベースタイプ                                                                                                          |
| `options.storage?`     | `string`       | `':memory:'`  | SQLite のストレージモード                                                                                                   |
| `options.logging?`     | `boolean`      | `false`       | ログを有効にするかどうか                                                                                                        |
| `options.define?`      | `Object`       | `{}`          | デフォルトのテーブル定義パラメータ                                                                                                    |
| `options.tablePrefix?` | `string`       | `''`          | NocoBase 拡張機能、テーブル名のプレフィックス                                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | NocoBase 拡張機能、マイグレーションマネージャー関連パラメータ。 [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) の実装をご参照ください。 |

## マイグレーション関連メソッド

### `addMigration()`

単一のマイグレーションファイルを追加します。

**シグネチャ**

- `addMigration(options: MigrationItem)`

**パラメータ**

| パラメータ名               | 型               | デフォルト値 | 説明                   |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name`       | `string`           | -      | マイグレーションファイル名           |
| `options.context?`   | `string`           | -      | マイグレーションファイルのコンテキスト       |
| `options.migration?` | `typeof Migration` | -      | マイグレーションファイルのカスタムクラス     |
| `options.up`         | `Function`         | -      | マイグレーションファイルの `up` メソッド   |
| `options.down`       | `Function`         | -      | マイグレーションファイルの `down` メソッド |

**例**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* マイグレーションSQL */);
  },
});
```

### `addMigrations()`

指定されたディレクトリからマイグレーションファイルを追加します。

**シグネチャ**

- `addMigrations(options: AddMigrationsOptions): void`

**パラメータ**

| パラメータ名               | 型       | デフォルト値         | 説明             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | `''`           | マイグレーションファイルが配置されているディレクトリ |
| `options.extensions` | `string[]` | `['js', 'ts']` | ファイル拡張子       |
| `options.namespace?` | `string`   | `''`           | ネームスペース         |
| `options.context?`   | `Object`   | `{ db }`       | マイグレーションファイルのコンテキスト |

**例**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## ユーティリティメソッド

### `inDialect()`

現在のデータベースタイプが指定されたタイプであるかどうかを判断します。

**シグネチャ**

- `inDialect(dialect: string[]): boolean`

**パラメータ**

| パラメータ名    | 型       | デフォルト値 | 説明                                             |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | -      | データベースタイプ。`mysql`/`postgres`/`mariadb` のいずれかを選択できます。 |

### `getTablePrefix()`

設定からテーブル名のプレフィックスを取得します。

**シグネチャ**

- `getTablePrefix(): string`

## コレクション設定

### `collection()`

**コレクション**を定義します。この呼び出しはSequelizeの`define`メソッドに似ており、メモリ内でのみテーブル構造を作成します。データベースに永続化するには、`sync`メソッドを呼び出す必要があります。

**シグネチャ**

- `collection(options: CollectionOptions): Collection`

**パラメータ**

すべての`options`設定パラメータは、**コレクション**クラスのコンストラクタと一致します。[コレクション](/api/database/collection#constructor) をご参照ください。

**イベント**

- `'beforeDefineCollection'`：**コレクション**を定義する前にトリガーされます。
- `'afterDefineCollection'`：**コレクション**を定義した後にトリガーされます。

**例**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// コレクションをテーブルとしてDBに同期
await db.sync();
```

### `getCollection()`

定義済みの**コレクション**を取得します。

**シグネチャ**

- `getCollection(name: string): Collection`

**パラメータ**

| パラメータ名 | 型     | デフォルト値 | 説明         |
| ------ | -------- | ------ | ------------ |
| `name` | `string` | -      | **コレクション**名 |

**例**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

指定された**コレクション**が定義されているかどうかを判断します。

**シグネチャ**

- `hasCollection(name: string): boolean`

**パラメータ**

| パラメータ名 | 型     | デフォルト値 | 説明         |
| ------ | -------- | ------ | ------------ |
| `name` | `string` | -      | **コレクション**名 |

**例**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

定義済みの**コレクション**を削除します。メモリからのみ削除され、変更を永続化するには`sync`メソッドを呼び出す必要があります。

**シグネチャ**

- `removeCollection(name: string): void`

**パラメータ**

| パラメータ名 | 型     | デフォルト値 | 説明         |
| ------ | -------- | ------ | ------------ |
| `name` | `string` | -      | **コレクション**名 |

**イベント**

- `'beforeRemoveCollection'`：**コレクション**を削除する前にトリガーされます。
- `'afterRemoveCollection'`：**コレクション**を削除した後にトリガーされます。

**例**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

ディレクトリ内のすべてのファイルを**コレクション**設定としてメモリにインポートします。

**シグネチャ**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**パラメータ**

| パラメータ名               | 型       | デフォルト値         | 説明             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | -              | インポートするディレクトリのパス |
| `options.extensions` | `string[]` | `['ts', 'js']` | スキャンするファイル拡張子     |

**例**

`./collections/books.ts` ファイルで定義されている**コレクション**は以下の通りです。

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

**プラグイン**のロード時に、関連する設定をインポートします。

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## 拡張機能の登録と取得

### `registerFieldTypes()`

カスタムフィールドタイプを登録します。

**シグネチャ**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**パラメータ**

`fieldTypes` はキーと値のペアで、キーはフィールドタイプ名、値はフィールドタイプクラスです。

**例**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

カスタムデータモデルクラスを登録します。

**シグネチャ**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**パラメータ**

`models` はキーと値のペアで、キーはデータモデル名、値はデータモデルクラスです。

**例**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

カスタム**リポジトリ**クラスを登録します。

**シグネチャ**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**パラメータ**

`repositories` はキーと値のペアで、キーは**リポジトリ**名、値は**リポジトリ**クラスです。

**例**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

カスタムデータクエリ演算子を登録します。

**シグネチャ**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**パラメータ**

`operators` はキーと値のペアで、キーは演算子名、値は比較ステートメントを生成する関数です。

**例**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // 登録された演算子
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

定義済みのデータモデルクラスを取得します。カスタムモデルクラスが以前に登録されていない場合、Sequelizeのデフォルトモデルクラスが返されます。デフォルト名は**コレクション**で定義された名前と同じです。

**シグネチャ**

- `getModel(name: string): Model`

**パラメータ**

| パラメータ名 | 型     | デフォルト値 | 説明           |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | -      | 登録済みモデル名 |

**例**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

注：**コレクション**から取得されるモデルクラスは、登録時のモデルクラスと厳密には等しくなく、登録時のモデルクラスを継承しています。Sequelizeのモデルクラスは初期化中にプロパティが変更されるため、NocoBaseはこの継承関係を自動的に処理します。クラスが等しくない点を除けば、他のすべての定義は正常に使用できます。

### `getRepository()`

カスタム**リポジトリ**クラスを取得します。カスタム**リポジトリ**クラスが以前に登録されていない場合、NocoBaseのデフォルト**リポジトリ**クラスが返されます。デフォルト名は**コレクション**で定義された名前と同じです。

**リポジトリ**クラスは、主にデータモデルに基づいたCRUD操作などに使用されます。[リポジトリ](/api/database/repository) をご参照ください。

**シグネチャ**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**パラメータ**

| パラメータ名       | 型                 | デフォルト値 | 説明               |
| ------------ | -------------------- | ------ | ------------------ |
| `name`       | `string`             | -      | 登録済み**リポジトリ**名 |
| `relationId` | `string` \| `number` | -      | 関連データの外部キー値   |

名前が`'tables.relations'`のような関連名の場合、関連する**リポジトリ**クラスが返されます。2番目のパラメータが提供された場合、**リポジトリ**は使用時（クエリ、更新など）に関連データの外部キー値に基づいて動作します。

**例**

*記事*と*著者*という2つの**コレクション**があり、記事**コレクション**に著者**コレクション**を指す外部キーがあるとします。

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## データベースイベント

### `on()`

データベースイベントをリッスンします。

**シグネチャ**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**パラメータ**

| パラメータ名   | 型     | デフォルト値 | 説明       |
| -------- | -------- | ------ | ---------- |
| event    | string   | -      | イベント名   |
| listener | Function | -      | イベントリスナー |

イベント名はデフォルトでSequelizeのModelイベントをサポートしています。グローバルイベントの場合は`<sequelize_model_global_event>`の形式で、単一のModelイベントの場合は`<model_name>.<sequelize_model_event>`の形式でリッスンします。

すべての組み込みイベントタイプのパラメータ説明と詳細な例については、[組み込みイベント](#組み込みイベント) セクションをご参照ください。

### `off()`

イベントリスナー関数を削除します。

**シグネチャ**

- `off(name: string, listener: Function)`

**パラメータ**

| パラメータ名   | 型     | デフォルト値 | 説明       |
| -------- | -------- | ------ | ---------- |
| name     | string   | -      | イベント名   |
| listener | Function | -      | イベントリスナー |

**例**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## データベース操作

### `auth()`

データベース接続の認証を行います。アプリケーションとデータ間の接続が確立されていることを確認するために使用できます。

**シグネチャ**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**パラメータ**

| パラメータ名                 | 型                  | デフォルト値  | 説明               |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?`             | `Object`              | -       | 認証オプション           |
| `options.retry?`       | `number`              | `10`    | 認証失敗時のリトライ回数 |
| `options.transaction?` | `Transaction`         | -       | トランザクションオブジェクト           |
| `options.logging?`     | `boolean \| Function` | `false` | ログを出力するかどうか       |

**例**

```ts
await db.auth();
```

### `reconnect()`

データベースに再接続します。

**例**

```ts
await db.reconnect();
```

### `closed()`

データベース接続が閉じられているかどうかを判断します。

**シグネチャ**

- `closed(): boolean`

### `close()`

データベース接続を閉じます。`sequelize.close()` と同等です。

### `sync()`

データベースの**コレクション**構造を同期します。`sequelize.sync()` と同等です。パラメータについては [Sequelize ドキュメント](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync) をご参照ください。

### `clean()`

データベースをクリーンアップし、すべての**コレクション**を削除します。

**シグネチャ**

- `clean(options: CleanOptions): Promise<void>`

**パラメータ**

| パラメータ名                | 型          | デフォルト値  | 説明               |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop`        | `boolean`     | `false` | すべての**コレクション**を削除するかどうか |
| `options.skip`        | `string[]`    | -       | スキップする**コレクション**名の設定     |
| `options.transaction` | `Transaction` | -       | トランザクションオブジェクト           |

**例**

`users` **コレクション**を除くすべての**コレクション**を削除します。

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## パッケージレベルのエクスポート

### `defineCollection()`

**コレクション**の設定内容を作成します。

**シグネチャ**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**パラメータ**

| パラメータ名              | 型                | デフォルト値 | 説明                                |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | すべての`db.collection()`のパラメータと同じです。 |

**例**

`db.import()` によってインポートされる**コレクション**設定ファイルの場合：

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

メモリ内にある**コレクション**構造の設定内容を拡張します。主に`import()`メソッドでインポートされたファイルの内容に使用されます。このメソッドは`@nocobase/database`パッケージによってエクスポートされるトップレベルのメソッドであり、dbインスタンスを介して呼び出すことはありません。`extend`エイリアスも使用できます。

**シグネチャ**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**パラメータ**

| パラメータ名              | 型                | デフォルト値 | 説明                                                           |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | すべての`db.collection()`のパラメータと同じです。                            |
| `mergeOptions?`     | `MergeOptions`      | -      | npmパッケージ [deepmerge](https://npmjs.com/package/deepmerge) のパラメータ |

**例**

元のbooks**コレクション**定義（books.ts）：

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

拡張されたbooks**コレクション**定義（books.extend.ts）：

```ts
import { extend } from '@nocobase/database';

// 再度拡張
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

上記の2つのファイルが`import()`呼び出し時にインポートされ、`extend()`によって再度拡張された場合、books**コレクション**は`title`と`price`の2つのフィールドを持つことになります。

このメソッドは、既存の**プラグイン**によって既に定義されている**コレクション**構造を拡張する際に非常に役立ちます。

## 組み込みイベント

データベースは、そのライフサイクルの適切なタイミングで以下のイベントをトリガーします。`on()`メソッドで購読し、特定の処理を行うことで、ビジネス要件を満たすことができます。

### `'beforeSync'` / `'afterSync'`

新しい**コレクション**構造設定（フィールド、インデックスなど）がデータベースに同期される前後にトリガーされます。通常、`collection.sync()`（内部呼び出し）の実行時にトリガーされ、一般的に特殊なフィールド拡張のロジック処理に使用されます。

**シグネチャ**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**型**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**例**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // 何らかの処理を行う
});

db.on('users.afterSync', async (options) => {
  // 何らかの処理を行う
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

データの作成または更新前に、**コレクション**定義に基づいたルールによるデータ検証プロセスがあります。検証の前後に対応するイベントがトリガーされます。これは`repository.create()`または`repository.update()`が呼び出されたときにトリガーされます。

**シグネチャ**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**型**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**例**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// すべてのモデル
db.on('beforeValidate', async (model, options) => {
  // 何らかの処理を行う
});
// tests モデル
db.on('tests.beforeValidate', async (model, options) => {
  // 何らかの処理を行う
});

// すべてのモデル
db.on('afterValidate', async (model, options) => {
  // 何らかの処理を行う
});
// tests モデル
db.on('tests.afterValidate', async (model, options) => {
  // 何らかの処理を行う
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // メール形式をチェック
  },
});
// または
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // メール形式をチェック
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

レコードの作成前後に対応するイベントがトリガーされます。これは`repository.create()`が呼び出されたときにトリガーされます。

**シグネチャ**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**型**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**例**

```ts
db.on('beforeCreate', async (model, options) => {
  // 何らかの処理を行う
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

レコードの更新前後に対応するイベントがトリガーされます。これは`repository.update()`が呼び出されたときにトリガーされます。

**シグネチャ**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**型**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**例**

```ts
db.on('beforeUpdate', async (model, options) => {
  // 何らかの処理を行う
});

db.on('books.afterUpdate', async (model, options) => {
  // 何らかの処理を行う
});
```

### `'beforeSave'` / `'afterSave'`

レコードの作成または更新前後に対応するイベントがトリガーされます。これは`repository.create()`または`repository.update()`が呼び出されたときにトリガーされます。

**シグネチャ**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**型**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**例**

```ts
db.on('beforeSave', async (model, options) => {
  // 何らかの処理を行う
});

db.on('books.afterSave', async (model, options) => {
  // 何らかの処理を行う
});
```

### `'beforeDestroy'` / `'afterDestroy'`

レコードの削除前後に対応するイベントがトリガーされます。これは`repository.destroy()`が呼び出されたときにトリガーされます。

**シグネチャ**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**型**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**例**

```ts
db.on('beforeDestroy', async (model, options) => {
  // 何らかの処理を行う
});

db.on('books.afterDestroy', async (model, options) => {
  // 何らかの処理を行う
});
```

### `'afterCreateWithAssociations'`

階層的な関連データを持つレコードが作成された後に対応するイベントがトリガーされます。これは`repository.create()`が呼び出されたときにトリガーされます。

**シグネチャ**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**型**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**例**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // 何らかの処理を行う
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // 何らかの処理を行う
});
```

### `'afterUpdateWithAssociations'`

階層的な関連データを持つレコードが更新された後に対応するイベントがトリガーされます。これは`repository.update()`が呼び出されたときにトリガーされます。

**シグネチャ**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**型**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**例**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // 何らかの処理を行う
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // 何らかの処理を行う
});
```

### `'afterSaveWithAssociations'`

階層的な関連データを持つレコードが作成または更新された後に対応するイベントがトリガーされます。これは`repository.create()`または`repository.update()`が呼び出されたときにトリガーされます。

**シグネチャ**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**型**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**例**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // 何らかの処理を行う
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // 何らかの処理を行う
});
```

### `'beforeDefineCollection'`

**コレクション**が定義される前にトリガーされます。例えば、`db.collection()`が呼び出されたときなどです。

注：このイベントは同期イベントです。

**シグネチャ**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**型**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**例**

```ts
db.on('beforeDefineCollection', (options) => {
  // 何らかの処理を行う
});
```

### `'afterDefineCollection'`

**コレクション**が定義された後にトリガーされます。例えば、`db.collection()`が呼び出されたときなどです。

注：このイベントは同期イベントです。

**シグネチャ**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**型**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**例**

```ts
db.on('afterDefineCollection', (collection) => {
  // 何らかの処理を行う
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

**コレクション**がメモリから削除される前後にトリガーされます。例えば、`db.removeCollection()`が呼び出されたときなどです。

注：このイベントは同期イベントです。

**シグネチャ**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**型**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**例**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // 何らかの処理を行う
});

db.on('afterRemoveCollection', (collection) => {
  // 何らかの処理を行う
});
```