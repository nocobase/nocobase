:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/block-model)をご参照ください。
:::

# ctx.blockModel

現在の JS フィールド / JS ブロックが配置されている親ブロックモデル（BlockModel インスタンス）です。JSField、JSItem、JSColumn などのシナリオでは、`ctx.blockModel` は現在の JS ロジックを保持しているフォームブロックまたはテーブルブロックを指します。独立した JSBlock では、`null` になるか、`ctx.model` と同じになる場合があります。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSField** | フォームフィールド内で親フォームブロックの `form`、`collection`、`resource` にアクセスし、連動やバリデーションを実現します。 |
| **JSItem** | 子テーブルの項目内で親テーブル/フォームブロックのリソースやコレクション情報にアクセスします。 |
| **JSColumn** | テーブル列内で親テーブルブロックの `resource`（例：`getSelectedRows`）や `collection` にアクセスします。 |
| **フォーム操作 / イベントフロー** | 送信前のバリデーションのために `form` にアクセスしたり、リフレッシュのために `resource` にアクセスしたりします。 |

> 注意：`ctx.blockModel` は親ブロックが存在する RunJS コンテキストでのみ利用可能です。親のフォーム/テーブルがない独立した JSBlock では `null` になる可能性があるため、使用前に空値チェックを行うことを推奨します。

## 型定義

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

具体的な型は親ブロックのタイプに依存します。フォームブロックの場合は多くが `FormBlockModel` や `EditFormModel` であり、テーブルブロックの場合は多くが `TableBlockModel` です。

## 主要なプロパティ

| プロパティ | 型 | 説明 |
|------|------|------|
| `uid` | `string` | ブロックモデルの一意識別子 |
| `collection` | `Collection` | 現在のブロックに紐付けられたコレクション |
| `resource` | `Resource` | ブロックで使用されるリソースインスタンス（`SingleRecordResource` / `MultiRecordResource` など） |
| `form` | `FormInstance` | フォームブロック：Ant Design の Form インスタンス。`getFieldsValue`、`validateFields`、`setFieldsValue` などをサポートします。 |
| `emitter` | `EventEmitter` | イベントエミッター。`formValuesChange` や `onFieldReset` などを監視できます。 |

## ctx.model、ctx.form との関係

| ニーズ | 推奨される使い方 |
|------|----------|
| **現在の JS が存在する親ブロック** | `ctx.blockModel` |
| **フォームフィールドの読み書き** | `ctx.form`（`ctx.blockModel?.form` と等価で、フォームブロック内ではより便利です） |
| **現在の実行コンテキストにおけるモデル** | `ctx.model`（JSField ではフィールドモデル、JSBlock ではブロックモデル） |

JSField において、`ctx.model` はフィールドモデルであり、`ctx.blockModel` はそのフィールドを保持するフォームまたはテーブルブロックです。`ctx.form` は通常 `ctx.blockModel.form` を指します。

## 例

### テーブル：選択された行を取得して処理する

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('データを選択してください');
  return;
}
```

### フォーム：バリデーションとリフレッシュ

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### フォームの変化を監視する

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // 最新のフォーム値に基づいて連動や再レンダリングを行う
});
```

### ブロックの再レンダリングをトリガーする

```ts
ctx.blockModel?.rerender?.();
```

## 注意事項

- **独立した JSBlock**（親のフォーム/テーブルブロックがない場合）では、`ctx.blockModel` は `null` になる可能性があります。プロパティにアクセスする際は、オプショナルチェーン（`ctx.blockModel?.resource?.refresh?.()`）の使用を推奨します。
- **JSField / JSItem / JSColumn** では、`ctx.blockModel` は現在のフィールドを保持するフォームまたはテーブルブロックを指します。**JSBlock** では、実際の階層に応じて自身または上位のブロックを指す場合があります。
- `resource` はデータブロックにのみ存在し、`form` はフォームブロックにのみ存在します。テーブルブロックには通常 `form` はありません。

## 関連情報

- [ctx.model](./model.md)：現在の実行コンテキストにおけるモデル
- [ctx.form](./form.md)：フォームインスタンス（フォームブロック内で多用）
- [ctx.resource](./resource.md)：リソースインスタンス（`ctx.blockModel?.resource` と等価、存在する場合は直接利用可能）
- [ctx.getModel()](./get-model.md)：uid を指定して他のブロックモデルを取得