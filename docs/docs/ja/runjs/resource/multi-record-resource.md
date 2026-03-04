:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/resource/multi-record-resource)をご参照ください。
:::

# MultiRecordResource

データテーブル向けの Resource です。リクエストは配列を返し、ページネーション、フィルタリング、ソート、および CRUD 操作をサポートします。テーブルやリストなどの「複数レコード」のシナリオに適しています。[APIResource](./api-resource.md) とは異なり、MultiRecordResource は `setResourceName()` でリソース名を指定することで、`users:list` や `users:create` などの URL を自動的に構築し、ページネーション、フィルタリング、選択行の管理などの機能を内蔵しています。

**継承関係**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource。

**作成方法**: `ctx.makeResource('MultiRecordResource')` または `ctx.initResource('MultiRecordResource')`。使用前に `setResourceName('コレクション名')`（例: `'users'`）を呼び出す必要があります。RunJS では、`ctx.api` は実行環境によって注入されます。

---

## 適用シーン

| シーン | 説明 |
|------|------|
| **テーブルブロック** | テーブルやリストブロックはデフォルトで MultiRecordResource を使用し、ページネーション、フィルタリング、ソートをサポートします。 |
| **JSBlock リスト** | JSBlock 内でユーザーや注文などのコレクションデータを読み込み、カスタムレンダリングを行います。 |
| **一括操作** | `getSelectedRows()` で選択された行を取得し、`destroySelectedRows()` で一括削除を行います。 |
| **関連リソース** | `users.tags` などの形式で関連コレクションを読み込みます。`setSourceId(親レコードID)` と併用する必要があります。 |

---

## データ形式

- `getData()` は**レコードの配列**を返します。これは list API の `data` フィールドに相当します。
- `getMeta()` はページネーションなどのメタ情報を返します：`page`、`pageSize`、`count`、`totalPage` など。

---

## リソース名とデータソース

| メソッド | 説明 |
|------|------|
| `setResourceName(name)` / `getResourceName()` | リソース名。例: `'users'`、`'users.tags'`（関連リソース）。 |
| `setSourceId(id)` / `getSourceId()` | 関連リソース時の親レコード ID（例: `users.tags` の場合、users の主キーを渡します）。 |
| `setDataSourceKey(key)` / `getDataSourceKey()` | データソース識別子（マルチデータソース時に使用）。 |

---

## リクエストパラメータ（フィルタ / フィールド / ソート）

| メソッド | 説明 |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | 主キーによるフィルタリング（単一レコードの get など）。 |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | フィルタ条件。`$eq`、`$ne`、`$in` などの演算子をサポート。 |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | フィルタグループ（複数条件の組み合わせ）。 |
| `setFields(fields)` / `getFields()` | リクエストするフィールド（ホワイトリスト）。 |
| `setSort(sort)` / `getSort()` | ソート。例: `['-createdAt']` は作成日時の降順。 |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | 関連の展開（例: `['user', 'tags']`）。 |

---

## ページネーション

| メソッド | 説明 |
|------|------|
| `setPage(page)` / `getPage()` | 現在のページ（1から開始）。 |
| `setPageSize(size)` / `getPageSize()` | 1ページあたりの件数。デフォルトは 20。 |
| `getTotalPage()` | 総ページ数。 |
| `getCount()` | 総件数（サーバー側の meta から取得）。 |
| `next()` / `previous()` / `goto(page)` | ページを切り替えて `refresh` をトリガーします。 |

---

## 選択行（テーブルシーン）

| メソッド | 説明 |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | 現在選択されている行データ。一括削除などの操作に使用されます。 |

---

## CRUD とリスト操作

| メソッド | 説明 |
|------|------|
| `refresh()` | 現在のパラメータで list をリクエストし、`getData()` とページネーションの meta を更新して `'refresh'` イベントをトリガーします。 |
| `get(filterByTk)` | 単一レコードをリクエストし、そのデータを返します（`getData` には書き込みません）。 |
| `create(data, options?)` | 作成。オプション `{ refresh: false }` で自動リフレッシュを無効化できます。`'saved'` をトリガーします。 |
| `update(filterByTk, data, options?)` | 主キーによる更新。 |
| `destroy(target)` | 削除。target は主キー、行オブジェクト、または主キー/行オブジェクトの配列（一括削除）が可能です。 |
| `destroySelectedRows()` | 現在選択されている行を削除します（選択されていない場合はエラーをスローします）。 |
| `setItem(index, item)` | ローカルで特定の行データを置き換えます（リクエストは送信しません）。 |
| `runAction(actionName, options)` | 任意のリソースアクション（カスタムアクションなど）を呼び出します。 |

---

## 設定とイベント

| メソッド | 説明 |
|------|------|
| `setRefreshAction(name)` | リフレッシュ時に呼び出されるアクション。デフォルトは `'list'`。 |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | create/update のリクエスト設定。 |
| `on('refresh', fn)` / `on('saved', fn)` | リフレッシュ完了後、または保存後にトリガーされます。 |

---

## 例

### 基本的なリスト

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### フィルタリングとソート

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### 関連の展開

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### 作成とページ移動

```js
await ctx.resource.create({ name: '田中太郎', email: 'tanaka@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### 選択した行の一括削除

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('データを選択してください');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('削除されました'));
```

### refresh イベントのリスニング

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### 関連リソース（子テーブル）

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## 注意事項

- **setResourceName は必須**: 使用前に `setResourceName('コレクション名')` を呼び出す必要があります。そうしないとリクエスト URL を構築できません。
- **関連リソース**: リソース名が `parent.child` 形式（例: `users.tags`）の場合、先に `setSourceId(親レコードの主キー)` を設定する必要があります。
- **refresh のデバウンス**: 同一イベントループ内で `refresh()` が複数回呼び出された場合、重複リクエストを避けるために最後の一回のみが実行されます。
- **getData は配列**: リスト API が返す `data` はレコードの配列であり、`getData()` はその配列を直接返します。

---

## 関連情報

- [ctx.resource](../context/resource.md) - 現在のコンテキストにおける resource インスタンス
- [ctx.initResource()](../context/init-resource.md) - 初期化して ctx.resource にバインドする
- [ctx.makeResource()](../context/make-resource.md) - 新しい resource インスタンスを作成する（バインドしない）
- [APIResource](./api-resource.md) - URL 指定による汎用 API リソース
- [SingleRecordResource](./single-record-resource.md) - 単一レコード向けリソース