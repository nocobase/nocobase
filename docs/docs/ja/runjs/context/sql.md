:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/sql)をご参照ください。
:::

# ctx.sql

`ctx.sql` は SQL の実行と管理機能を提供します。主に RunJS（JSBlock やワークフローなど）でデータベースに直接アクセスするために使用されます。一時的な SQL 実行、保存済み SQL テンプレートの ID 指定実行、パラメータバインディング、テンプレート変数（`{{ctx.xxx}}`）、および結果タイプの制御をサポートしています。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock** | カスタム統計レポート、複雑なフィルタリングリスト、テーブルをまたぐ集計クエリ |
| **チャートブロック** | チャートのデータソースを駆動するための SQL テンプレートの保存 |
| **ワークフロー / 連動** | プリセットされた SQL を実行してデータを取得し、後続のロジックに利用 |
| **SQLResource** | `ctx.initResource('SQLResource')` と組み合わせて、ページネーション付きリストなどのシナリオで使用 |

> 注意：`ctx.sql` は `flowSql` API を通じてデータベースにアクセスします。現在のユーザーが対象のデータソースに対して実行権限を持っていることを確認してください。

## 権限説明

| 権限 | メソッド | 説明 |
|------|------|------|
| **ログインユーザー** | `runById` | 設定済みの SQL テンプレート ID に基づいて実行 |
| **SQL 設定権限** | `run`、`save`、`destroy` | 一時的な SQL の実行、SQL テンプレートの保存/更新/削除 |

一般ユーザー向けのフロントエンドロジックでは `ctx.sql.runById(uid, options)` を使用します。動的な SQL やテンプレート管理が必要な場合は、現在のロールに SQL 設定権限があることを確認してください。

## 型定義

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## 常用メソッド

| メソッド | 説明 | 権限要件 |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | 一時的な SQL を実行。パラメータバインディングとテンプレート変数をサポート | SQL 設定権限が必要 |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | 再利用のために SQL テンプレートを ID で保存/更新 | SQL 設定権限が必要 |
| `ctx.sql.runById(uid, options?)` | 保存済みの SQL テンプレートを ID で実行 | ログインユーザーなら誰でも可 |
| `ctx.sql.destroy(uid)` | 指定した ID の SQL テンプレートを削除 | SQL 設定権限が必要 |

注意：

- `run` は SQL のデバッグ用であり、設定権限が必要です。
- `save`、`destroy` は SQL テンプレートの管理用であり、設定権限が必要です。
- `runById` は一般ユーザーに開放されており、保存済みテンプレートの実行のみ可能です。SQL のデバッグや変更はできません。
- SQL テンプレートに変更があった場合は、`save` を呼び出して保存する必要があります。

## パラメータ説明

### run / runById の options

| パラメータ | 型 | 説明 |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | バインド変数。オブジェクト形式は `:name`、配列形式は `?` に対応 |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | 結果タイプ：複数行、単一行、単一値。デフォルトは `selectRows` |
| `dataSourceKey` | `string` | データソース識別子。デフォルトはメインデータソースを使用 |
| `filter` | `Record<string, any>` | 追加のフィルタ条件（インターフェースのサポート状況による） |

### save の options

| パラメータ | 型 | 説明 |
|------|------|------|
| `uid` | `string` | テンプレートの一意の識別子。保存後は `runById(uid, ...)` で実行可能 |
| `sql` | `string` | SQL の内容。`{{ctx.xxx}}` テンプレート変数と `:name` / `?` プレースホルダーをサポート |
| `dataSourceKey` | `string` | オプション。データソース識別子 |

## SQL テンプレート変数とパラメータバインディング

### テンプレート変数 `{{ctx.xxx}}`

SQL 内で `{{ctx.xxx}}` を使用してコンテキスト変数を参照できます。実行前に実際の値に解析されます。

```js
// ctx.user.id を参照
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

参照可能な変数のソースは `ctx.getVar()` と同様です（例：`ctx.user.*`、`ctx.record.*`、カスタム `ctx.defineProperty` など）。

### パラメータバインディング

- **命名パラメータ**：SQL 内で `:name` を使用し、`bind` にオブジェクト `{ name: value }` を渡します。
- **位置パラメータ**：SQL 内で `?` を使用し、`bind` に配列 `[value1, value2]` を渡します。

```js
// 命名パラメータ
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// 位置パラメータ
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Tokyo', 'active'], type: 'selectVar' }
);
```

## 例

### 一時的な SQL の実行（SQL 設定権限が必要）

```js
// 複数行の結果（デフォルト）
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// 単一行の結果
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// 単一値の結果（COUNT、SUM など）
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### テンプレート変数の使用

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### テンプレートの保存と再利用

```js
// 保存（SQL 設定権限が必要）
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// ログインユーザーであれば誰でも実行可能
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// テンプレートの削除（SQL 設定権限が必要）
await ctx.sql.destroy('active-users-report');
```

### ページネーションリスト（SQLResource）

```js
// ページネーションやフィルタリングが必要な場合は、SQLResource を使用
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // 保存済み SQL テンプレートの ID
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // page、pageSize などを含む
```

## ctx.resource、ctx.request との関係

| 用途 | 推奨される使用法 |
|------|----------|
| **SQL クエリの実行** | `ctx.sql.run()` または `ctx.sql.runById()` |
| **SQL ページネーションリスト（ブロック）** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **汎用 HTTP リクエスト** | `ctx.request()` |

`ctx.sql` は `flowSql` API をラップしており、SQL シナリオに特化しています。`ctx.request` は任意の API を呼び出すことができます。

## 注意事項

- SQL インジェクションを避けるため、文字列結合ではなくパラメータバインディング（`:name` / `?`）を使用してください。
- `type: 'selectVar'` はスカラー値を返します。通常 `COUNT` や `SUM` などで使用します。
- テンプレート変数 `{{ctx.xxx}}` は実行前に解析されます。コンテキスト内に対応する変数が定義されていることを確認してください。

## 関連情報

- [ctx.resource](./resource.md)：データリソース。SQLResource は内部で `flowSql` API を呼び出します。
- [ctx.initResource()](./init-resource.md)：ページネーションリストなどのために SQLResource を初期化します。
- [ctx.request()](./request.md)：汎用 HTTP リクエスト。