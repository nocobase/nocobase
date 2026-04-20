:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/resource/sql-resource)をご参照ください。
:::

# SQLResource

**保存済みの SQL 設定**または**動的 SQL**に基づいてクエリを実行するリソース（Resource）です。データソースは `flowSql:run` / `flowSql:runById` などのインターフェースから取得されます。レポート、統計、カスタム SQL リストなどのシナリオに適しています。[MultiRecordResource](./multi-record-resource.md) とは異なり、SQLResource はデータテーブル（コレクション）に依存せず、SQL クエリを直接実行します。ページネーション、パラメータバインディング、テンプレート変数（`{{ctx.xxx}}`）、および結果タイプの制御をサポートしています。

**継承関係**: FlowResource → APIResource → BaseRecordResource → SQLResource。

**作成方法**: `ctx.makeResource('SQLResource')` または `ctx.initResource('SQLResource')`。保存済みの設定に従って実行する場合は `setFilterByTk(uid)`（SQL テンプレートの uid）が必要です。デバッグ時には `setDebug(true)` + `setSQL(sql)` を使用して SQL を直接実行できます。RunJS 内では、`ctx.api` は実行環境によって注入されます。

---

## 適用シーン

| シナリオ | 説明 |
|------|------|
| **レポート / 統計** | 複雑な集計、テーブルをまたぐクエリ、カスタム統計指標など。 |
| **JSBlock カスタムリスト** | SQL を使用して特殊なフィルタリング、ソート、または関連付けを実現し、カスタムレンダリングを行う。 |
| **グラフブロック** | 保存済みの SQL テンプレートでグラフのデータソースを駆動し、ページネーションをサポートする。 |
| **ctx.sql との使い分け** | ページネーション、イベント、リアクティブなデータが必要な場合は SQLResource を使用します。単純な使い切りのクエリには `ctx.sql.run()` / `ctx.sql.runById()` が適しています。 |

---

## データ形式

- `getData()` は `setSQLType()` の設定に応じて異なる形式を返します：
  - `selectRows`（デフォルト）：**配列**。複数行の結果。
  - `selectRow`：**単一のオブジェクト**。
  - `selectVar`：**スカラー値**（COUNT、SUM など）。
- `getMeta()` はページネーションなどのメタ情報を返します：`page`、`pageSize`、`count`、`totalPage` など。

---

## SQL 設定と実行モード

| メソッド | 説明 |
|------|------|
| `setFilterByTk(uid)` | 実行する SQL テンプレートの uid を設定します（runById に対応。事前管理画面での保存が必要）。 |
| `setSQL(sql)` | 生の SQL を設定します（デバッグモード `setDebug(true)` の時のみ runBySQL で使用）。 |
| `setSQLType(type)` | 結果タイプ：`'selectVar'` / `'selectRow'` / `'selectRows'`。 |
| `setDebug(enabled)` | true の場合、refresh は `runBySQL()` を呼び出し、それ以外は `runById()` を呼び出します。 |
| `run()` | デバッグ状態に応じて `runBySQL()` または `runById()` を呼び出します。 |
| `runBySQL()` | 現在 `setSQL` で設定されている SQL を実行します（`setDebug(true)` が必要）。 |
| `runById()` | 現在の uid を使用して保存済みの SQL テンプレートを実行します。 |

---

## パラメータとコンテキスト

| メソッド | 説明 |
|------|------|
| `setBind(bind)` | 変数をバインドします。オブジェクト形式は `:name`、配列形式は `?` に対応します。 |
| `setLiquidContext(ctx)` | テンプレートコンテキスト（Liquid）。`{{ctx.xxx}}` の解析に使用されます。 |
| `setFilter(filter)` | 追加のフィルタ条件（リクエストデータに渡されます）。 |
| `setDataSourceKey(key)` | データソース識別子（マルチデータソース環境で使用）。 |

---

## ページネーション

| メソッド | 説明 |
|------|------|
| `setPage(page)` / `getPage()` | 現在のページ（デフォルトは 1）。 |
| `setPageSize(size)` / `getPageSize()` | 1 ページあたりの件数（デフォルトは 20）。 |
| `next()` / `previous()` / `goto(page)` | ページを切り替え、refresh をトリガーします。 |

SQL 内では `{{ctx.limit}}` や `{{ctx.offset}}` を使用してページネーションパラメータを参照できます。SQLResource はコンテキストに `limit` と `offset` を自動的に注入します。

---

## データ取得とイベント

| メソッド | 説明 |
|------|------|
| `refresh()` | SQL（runById または runBySQL）を実行し、結果を `setData(data)` に書き込み、meta を更新して `'refresh'` イベントをトリガーします。 |
| `runAction(actionName, options)` | 下層のインターフェース（`getBind`、`run`、`runById` など）を呼び出します。 |
| `on('refresh', fn)` / `on('loading', fn)` | リフレッシュ完了時、またはロード開始時にトリガーされます。 |

---

## 例

### 保存済みテンプレートによる実行（runById）

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // 保存済み SQL テンプレートの uid
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page、pageSize、count など
```

### デバッグモード：SQL を直接実行（runBySQL）

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### ページネーションとページ移動

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// ページ移動
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### 結果タイプ

```js
// 複数行（デフォルト）
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// 単一行
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// 単一値（例：COUNT）
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### テンプレート変数の使用

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### refresh イベントのリスニング

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## 注意事項

- **runById は事前にテンプレートの保存が必要**: `setFilterByTk(uid)` で指定する uid は、管理画面で保存済みの SQL テンプレート ID である必要があります。`ctx.sql.save({ uid, sql })` を通じて保存することも可能です。
- **デバッグモードには権限が必要**: `setDebug(true)` の場合は `flowSql:run` を使用するため、現在のロールに SQL 設定権限が必要です。`runById` はログイン済みであれば実行可能です。
- **refresh のデバウンス**: 同一のイベントループ内で `refresh()` が複数回呼び出された場合、重複リクエストを避けるために最後の 1 回のみが実行されます。
- **パラメータバインディングによるインジェクション対策**: 文字列結合による SQL 構築を避け、`setBind()` と `:name` / `?` プレースホルダーを組み合わせて使用してください。

---

## 関連情報

- [ctx.sql](../context/sql.md) - SQL の実行と管理。`ctx.sql.runById` は単純な使い切りクエリに適しています。
- [ctx.resource](../context/resource.md) - 現在のコンテキストにおけるリソースインスタンス。
- [ctx.initResource()](../context/init-resource.md) - リソースを初期化し、`ctx.resource` にバインドします。
- [ctx.makeResource()](../context/make-resource.md) - バインドせずに新しいリソースインスタンスを作成します。
- [APIResource](./api-resource.md) - 汎用 API リソース。
- [MultiRecordResource](./multi-record-resource.md) - データテーブル/リスト向けのリソース。