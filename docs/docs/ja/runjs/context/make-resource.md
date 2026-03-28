:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/make-resource)をご参照ください。
:::

# ctx.makeResource()

新しい resource インスタンスを**作成**して返します。`ctx.resource` への書き込みや変更は**行いません**。複数の独立した resource が必要な場合や、一時的な使用に適しています。

## 利用シーン

| シーン | 説明 |
|------|------|
| **複数の resource** | 複数のデータソース（ユーザーリスト + 注文リストなど）を同時に読み込む際、それぞれに独立した resource を使用します。 |
| **一時的なクエリ** | 使い捨てのクエリで、`ctx.resource` にバインドする必要がない場合に使用します。 |
| **補助データ** | メインデータには `ctx.resource` を使用し、追加データには `makeResource` で作成したインスタンスを使用します。 |

単一の resource のみが必要で、`ctx.resource` にバインドしたい場合は、[ctx.initResource()](./init-resource.md) を使用するのが適切です。

## 型定義

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| 引数 | 型 | 説明 |
|------|------|------|
| `resourceType` | `string` | リソースタイプ：`'APIResource'`、`'SingleRecordResource'`、`'MultiRecordResource'`、`'SQLResource'` |

**戻り値**：新しく作成された resource インスタンス。

## ctx.initResource() との違い

| メソッド | 動作 |
|------|------|
| `ctx.makeResource(type)` | 新しいインスタンスを作成して返すだけで、`ctx.resource` には書き込みません。複数回呼び出すことで、複数の独立した resource を取得できます。 |
| `ctx.initResource(type)` | `ctx.resource` が存在しない場合は作成してバインドし、既に存在する場合はそれを直接返します。`ctx.resource` が利用可能であることを保証します。 |

## 例

### 単一の resource

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource は元の値のままです（存在する場合）
```

### 複数の resource

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>ユーザー数：{usersRes.getData().length}</p>
    <p>注文数：{ordersRes.getData().length}</p>
  </div>
);
```

### 一時的なクエリ

```ts
// 使い捨てのクエリ。ctx.resource を汚染しません
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## 注意事項

- 新しく作成した resource は、`setResourceName(name)` を呼び出してコレクションを指定し、`refresh()` を実行してデータを読み込む必要があります。
- 各 resource インスタンスは独立しており、互いに影響を与えません。複数のデータソースを並行して読み込むのに適しています。

## 関連情報

- [ctx.initResource()](./init-resource.md)：初期化して `ctx.resource` にバインドする
- [ctx.resource](./resource.md)：現在のコンテキストにおける resource インスタンス
- [MultiRecordResource](../resource/multi-record-resource) — 複数レコード/リスト
- [SingleRecordResource](../resource/single-record-resource) — 単一レコード
- [APIResource](../resource/api-resource) — 汎用 API リソース
- [SQLResource](../resource/sql-resource) — SQL クエリリソース