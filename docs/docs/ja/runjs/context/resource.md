:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/resource)をご参照ください。
:::

# ctx.resource

現在のコンテキストにおける **FlowResource** インスタンスであり、データへのアクセスや操作に使用されます。ほとんどのブロック（フォーム、テーブル、詳細など）やポップアップのシナリオでは、実行環境によって `ctx.resource` があらかじめバインドされています。JSBlock など、デフォルトで resource が存在しないシナリオでは、まず [ctx.initResource()](./init-resource.md) を呼び出して初期化してから `ctx.resource` を使用する必要があります。

## 適用シーン

RunJS 内で構造化データ（リスト、単一レコード、カスタム API、SQL）へのアクセスが必要なあらゆるシーンで使用できます。フォーム、テーブル、詳細ブロック、およびポップアップは通常、既にあらかじめバインドされています。JSBlock、JSField、JSItem、JSColumn などでデータをロードする必要がある場合は、まず `ctx.initResource(type)` を呼び出してから `ctx.resource` にアクセスしてください。

## 型定義

```ts
resource: FlowResource | undefined;
```

- あらかじめバインドされているコンテキストでは、`ctx.resource` は対応する resource インスタンスになります。
- JSBlock など、デフォルトで resource がない場合は `undefined` となり、`ctx.initResource(type)` を実行した後に値が設定されます。

## よく使われるメソッド

リソースのタイプ（MultiRecordResource、SingleRecordResource、APIResource、SQLResource）によって公開されているメソッドは若干異なりますが、以下は共通または頻繁に使用されるメソッドです：

| メソッド | 説明 |
|------|------|
| `getData()` | 現在のデータを取得（リストまたは単一レコード） |
| `setData(value)` | ローカルデータを設定 |
| `refresh()` | 現在のパラメータでリクエストを発行し、データをリフレッシュ |
| `setResourceName(name)` | リソース名を設定（例: `'users'`, `'users.tags'`） |
| `setFilterByTk(tk)` | 主キーによるフィルタリングを設定（単一レコードの取得など） |
| `runAction(actionName, options)` | 任意のリソースアクション（`create`, `update` など）を呼び出し |
| `on(event, callback)` / `off(event, callback)` | イベントの購読/解除（`refresh`, `saved` など） |

**MultiRecordResource 特有**: `getSelectedRows()`、`destroySelectedRows()`、`setPage()`、`next()`、`previous()` など。

## 例

### リストデータ（先に initResource が必要）

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### テーブルシーン（あらかじめバインド済み）

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('削除しました'));
```

### 単一レコード

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### カスタムアクションの呼び出し

```js
await ctx.resource.runAction('create', { data: { name: '田中太郎' } });
```

## ctx.initResource / ctx.makeResource との関係

- **ctx.initResource(type)**: `ctx.resource` が存在しない場合は作成してバインドし、既に存在する場合はそれを直接返します。これにより `ctx.resource` が利用可能であることを保証します。
- **ctx.makeResource(type)**: 新しい resource インスタンスを作成して返しますが、`ctx.resource` には**書き込みません**。複数の独立したリソースが必要な場合や、一時的な使用に適しています。
- **ctx.resource**: 現在のコンテキストにバインドされている resource にアクセスします。ほとんどのブロックやポップアップでは既にあらかじめバインドされています。バインドされていない場合は `undefined` となるため、先に `ctx.initResource` を行う必要があります。

## 注意事項

- 使用前に `ctx.resource?.refresh()` のように空値チェックを行うことを推奨します。特に JSBlock など、あらかじめバインドされていない可能性があるシーンでは重要です。
- 初期化後は `setResourceName(name)` を呼び出してデータテーブルを指定し、その後に `refresh()` でデータをロードする必要があります。
- 各 Resource 型の完全な API については、以下のリンクを参照してください。

## 関連情報

- [ctx.initResource()](./init-resource.md) - リソースを初期化して現在のコンテキストにバインドする
- [ctx.makeResource()](./make-resource.md) - 新しいリソースインスタンスを作成する（`ctx.resource` にはバインドしない）
- [MultiRecordResource](../resource/multi-record-resource.md) - 複数レコード/リスト
- [SingleRecordResource](../resource/single-record-resource.md) - 単一レコード
- [APIResource](../resource/api-resource.md) - 汎用 API リソース
- [SQLResource](../resource/sql-resource.md) - SQL クエリリソース