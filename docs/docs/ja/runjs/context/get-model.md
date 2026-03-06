:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/get-model)をご参照ください。
:::

# ctx.getModel()

モデルの `uid` に基づいて、現在のエンジンまたはビュー履歴（View Stack）内のモデルインスタンス（BlockModel、PageModel、ActionModel など）を取得します。これは RunJS において、ブロック、ページ、またはポップアップを跨いで他のモデルにアクセスするために使用されます。

現在の実行コンテキストが存在するモデルやブロックのみが必要な場合は、`ctx.getModel` を使用するのではなく、`ctx.model` または `ctx.blockModel` を優先的に使用してください。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock / JSAction** | 既知の `uid` に基づいて他のブロックのモデルを取得し、その `resource`、`form`、`setProps` などを読み書きします。 |
| **ポップアップ内の RunJS** | ポップアップ内からそれを開いたページ上のモデルにアクセスする必要がある場合、`searchInPreviousEngines: true` を渡します。 |
| **カスタム操作** | ビュー履歴を跨いで `uid` により設定パネル内のフォームや子モデルを特定し、その設定や状態を読み取ります。 |

## 型定義

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## パラメータ

| パラメータ | 型 | 説明 |
|------|------|------|
| `uid` | `string` | ターゲットモデルインスタンスの一意識別子。設定時または作成時に指定されます（例：`ctx.model.uid`）。 |
| `searchInPreviousEngines` | `boolean` | オプション、デフォルトは `false`。`true` の場合、「ビュー履歴」において現在のエンジンからルートに向かって検索し、上位エンジン（ポップアップを開いた元のページなど）のモデルを取得できます。 |

## 戻り値

- 見つかった場合は、対応する `FlowModel` のサブクラスインスタンス（`BlockModel`、`FormBlockModel`、`ActionModel` など）を返します。
- 見つからない場合は `undefined` を返します。

## 検索範囲

- **デフォルト（`searchInPreviousEngines: false`）**: **現在のエンジン**内のみで `uid` を検索します。ポップアップや多階層のビューでは、各ビューが独立したエンジンを持つため、デフォルトでは現在のビュー内のモデルのみを検索します。
- **`searchInPreviousEngines: true`**: 現在のエンジンから開始し、`previousEngine` チェーンを遡って検索し、最初に見つかったものを返します。ポップアップ内からそれを開いたページのモデルにアクセスする場合に適しています。

## 示例

### 他のブロックを取得してリフレッシュ

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### ポップアップ内からページ上のモデルにアクセス

```ts
// ポップアップ内から、それを開いたページ上のブロックにアクセスする
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### モデルを跨いだ読み書きと再レンダリング（rerender）のトリガー

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### 安全な判定（存在チェック）

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('ターゲットモデルが存在しません');
  return;
}
```

## 関連情報

- [ctx.model](./model.md)：現在の実行コンテキストが存在するモデル
- [ctx.blockModel](./block-model.md)：現在の JS が配置されている親ブロックのモデル。通常、`getModel` を使わずにアクセス可能です。