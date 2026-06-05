:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ResourceManager リソース管理

NocoBase のリソース管理機能は、既存の**コレクション**や関連（association）を自動的にリソースへ変換します。これにより、開発者は組み込みの様々な操作タイプを活用して、REST API のリソース操作を素早く構築できます。従来の REST API とは少し異なり、NocoBase のリソース操作は HTTP リクエストメソッドに依存しません。代わりに、明示的に `:action` を定義することで、実行する具体的な操作を決定します。

## リソースの自動生成

NocoBase は、データベースで定義された `collection` と `association` を自動的にリソースへ変換します。例えば、`posts` と `tags` という2つの**コレクション**を定義した場合、以下のようになります。

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

これによって、以下のリソースが自動的に生成されます。

*   `posts` リソース
*   `tags` リソース
*   `posts.tags` 関連リソース

リクエスト例：

| リクエスト方式 | パス                     | 操作         |
| -------- | ---------------------- | ------------ |
| `GET`  | `/api/posts:list`      | リストのクエリ |
| `GET`  | `/api/posts:get/1`     | 単一レコードのクエリ |
| `POST` | `/api/posts:create`    | 新規追加     |
| `POST` | `/api/posts:update/1`  | 更新         |
| `POST` | `/api/posts:destroy/1` | 削除         |

| リクエスト方式 | パス                   | 操作         |
| -------- | ---------------------- | ------------ |
| `GET`  | `/api/tags:list`       | リストのクエリ |
| `GET`  | `/api/tags:get/1`      | 単一レコードのクエリ |
| `POST` | `/api/tags:create`     | 新規追加     |
| `POST` | `/api/tags:update/1`   | 更新         |
| `POST` | `/api/tags:destroy/1`  | 削除         |

| リクエスト方式 | パス                             | 操作                                |
| -------- | ------------------------------ | ----------------------------------- |
| `GET`  | `/api/posts/1/tags:list`       | 特定の `post` に関連するすべての `tags` をクエリ |
| `GET`  | `/api/posts/1/tags:get/1`      | 特定の `post` に紐づく単一の `tags` をクエリ    |
| `POST` | `/api/posts/1/tags:create`     | 特定の `post` に紐づく単一の `tags` を新規追加    |
| `POST` | `/api/posts/1/tags:update/1`   | 特定の `post` に紐づく単一の `tags` を更新    |
| `POST` | `/api/posts/1/tags:destroy/1`  | 特定の `post` に紐づく単一の `tags` を削除    |
| `POST` | `/api/posts/1/tags:add`        | 特定の `post` に関連する `tags` を追加    |
| `POST` | `/api/posts/1/tags:remove`     | 特定の `post` から関連する `tags` を削除    |
| `POST` | `/api/posts/1/tags:set`        | 特定の `post` のすべての関連 `tags` を設定 |
| `POST` | `/api/posts/1/tags:toggle`     | 特定の `post` の `tags` 関連をトグル    |

:::tip ヒント

NocoBase のリソース操作は、リクエストメソッドに直接依存せず、明示的に `:action` を定義することで実行する操作を決定します。

:::

## リソース操作

NocoBase は、様々なビジネス要件に対応できるよう、豊富な組み込み操作タイプを提供しています。

### 基本的な CRUD 操作

| 操作名           | 説明                           | 適用リソースタイプ | リクエスト方式 | 示例パス                   |
| -------------- | ------------------------------ | ------------------ | -------------- | -------------------------- |
| `list`         | リストデータをクエリ           | すべてのリソース   | GET/POST       | `/api/posts:list`          |
| `get`          | 単一データをクエリ             | すべてのリソース   | GET/POST       | `/api/posts:get/1`         |
| `create`       | 新規レコードを作成             | すべてのリソース   | POST           | `/api/posts:create`        |
| `update`       | レコードを更新                 | すべてのリソース   | POST           | `/api/posts:update/1`      |
| `destroy`      | レコードを削除                 | すべてのリソース   | POST           | `/api/posts:destroy/1`     |
| `firstOrCreate`| 最初のレコードを検索し、存在しない場合は作成 | すべてのリソース   | POST           | `/api/users:firstOrCreate` |
| `updateOrCreate`| レコードを更新し、存在しない場合は作成 | すべてのリソース   | POST           | `/api/users:updateOrCreate`|

### 関連操作

| 操作名   | 説明           | 適用関連タイプ                                   | 示例パス                           |
| -------- | -------------- | ---------------------------------------- | ------------------------------ |
| `add`    | 関連を追加     | `hasMany`, `belongsToMany`               | `/api/posts/1/tags:add`        |
| `remove` | 関連を削除     | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`    | 関連をリセット | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle` | 関連を追加または削除 | `belongsToMany`                          | `/api/posts/1/tags:toggle`     |

### 操作パラメータ

一般的な操作パラメータには以下が含まれます。

*   `filter`：クエリ条件
*   `values`：設定する値
*   `fields`：返されるフィールドを指定
*   `appends`：関連データを含める
*   `except`：フィールドを除外
*   `sort`：ソート順
*   `page`、`pageSize`：ページネーションパラメータ
*   `paginate`：ページネーションを有効にするか
*   `tree`：ツリー構造で返すか
*   `whitelist`、`blacklist`：フィールドのホワイトリスト/ブラックリスト
*   `updateAssociationValues`：関連値を更新するか

## カスタムリソース操作

NocoBase では、既存のリソースに追加の操作を登録できます。`registerActionHandlers` を使用して、すべてのリソースまたは特定のリソースに対して操作をカスタマイズできます。

### グローバル操作の登録

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### 特定リソースの操作の登録

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

リクエスト例：

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

命名規則は `resourceName:actionName` です。関連を含む場合はドット記法（`posts.comments`）を使用します。

## カスタムリソース

**コレクション**とは関係のないリソースを提供したい場合は、`resourceManager.define` メソッドを使用して定義できます。

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

リクエスト方式は、自動生成されるリソースと同じです。

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo`（デフォルトで GET/POST の両方をサポートしています）

## カスタムミドルウェア

`resourceManager.use()` メソッドを使用して、グローバルミドルウェアを登録できます。例えば、以下のようなグローバルロギングミドルウェアを定義できます。

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## 特有の Context プロパティ

`resourceManager` レイヤーのミドルウェアやアクションに入ることができるということは、そのリソースが必ず存在することを意味します。

### ctx.action

*   `ctx.action.actionName`：操作名
*   `ctx.action.resourceName`：**コレクション**または関連（association）である可能性があります
*   `ctx.action.params`：操作パラメータ

### ctx.dataSource

現在の**データソース**オブジェクトです。

### ctx.getCurrentRepository()

現在のリポジトリオブジェクトです。

## 異なる**データソース**の resourceManager オブジェクトを取得する方法

`resourceManager` は**データソース**に属しており、異なる**データソース**に対して個別に操作を登録できます。

### メイン**データソース**

メイン**データソース**の場合、`app.resourceManager` を直接使用して操作できます。

```ts
app.resourceManager.registerActionHandlers();
```

### その他の**データソース**

その他の**データソース**の場合、`dataSourceManager` を介して特定の**データソース**インスタンスを取得し、そのインスタンスの `resourceManager` を使用して操作できます。

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### すべての**データソース**を反復処理する

追加されたすべての**データソース**に対して同じ操作を実行する必要がある場合は、`dataSourceManager.afterAddDataSource` メソッドを使用して反復処理し、各**データソース**の `resourceManager` が対応する操作を登録できるようにします。

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```