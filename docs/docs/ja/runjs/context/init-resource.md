:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/init-resource)をご参照ください。
:::

# ctx.initResource()

現在のコンテキストのリソースを**初期化**します。`ctx.resource` がまだ存在しない場合は、指定されたタイプで作成してコンテキストにバインドします。既に存在する場合は、それを直接使用します。初期化後は `ctx.resource` を通じてアクセスできます。

## 適用シーン

通常、**JSBlock**（独立ブロック）のシナリオで使用されます。ほとんどのブロックやポップアップなどでは `ctx.resource` が事前にバインドされているため、手動で呼び出す必要はありません。JSBlock はデフォルトでリソースを持っていないため、`ctx.initResource(type)` を呼び出してから `ctx.resource` を介してデータをロードする必要があります。

## 型定義

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| 引数 | 型 | 説明 |
|------|------|------|
| `type` | `string` | リソースタイプ：`'APIResource'`、`'SingleRecordResource'`、`'MultiRecordResource'`、`'SQLResource'` |

**戻り値**：現在のコンテキスト内のリソースインスタンス（つまり `ctx.resource`）。

## ctx.makeResource() との違い

| メソッド | 動作 |
|----------|------|
| `ctx.initResource(type)` | `ctx.resource` が存在しない場合は作成してバインドし、存在する場合はそれを返します。`ctx.resource` が利用可能であることを保証します。 |
| `ctx.makeResource(type)` | 新しいインスタンスを作成して返すだけで、`ctx.resource` には**書き込みません**。複数の独立したリソースが必要な場合や、一時的な使用に適しています。 |

## 例文

### リストデータ（MultiRecordResource）

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### 単一レコード（SingleRecordResource）

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // 主キーを指定
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### データソースの指定

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## 注意事項

- ほとんどのブロック（フォーム、テーブル、詳細など）やポップアップのシナリオでは、`ctx.resource` は実行環境によって事前にバインドされているため、`ctx.initResource` を呼び出す必要はありません。
- JSBlock など、デフォルトでリソースがないコンテキストでのみ手動での初期化が必要です。
- 初期化後、`setResourceName(name)` を呼び出してコレクションを指定し、`refresh()` を実行してデータをロードする必要があります。

## 関連情報

- [ctx.resource](./resource.md) — 現在のコンテキスト内のリソースインスタンス
- [ctx.makeResource()](./make-resource.md) — 新しいリソースインスタンスを作成（`ctx.resource` にはバインドしない）
- [MultiRecordResource](../resource/multi-record-resource.md) — 複数レコード/リスト
- [SingleRecordResource](../resource/single-record-resource.md) — 単一レコード
- [APIResource](../resource/api-resource.md) — 汎用 API リソース
- [SQLResource](../resource/sql-resource.md) — SQL クエリリソース