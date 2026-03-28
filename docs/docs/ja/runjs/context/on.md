:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/on)をご参照ください。
:::

# ctx.on()

RunJS において、コンテキストイベント（フィールド値の変更、プロパティの変更、リソースの更新など）を購読します。イベントはそのタイプに応じて、`ctx.element` 上のカスタム DOM イベント、または `ctx.resource` の内部イベントバスにマッピングされます。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSField / JSEditableField** | 外部（フォーム、連動など）からのフィールド値の変更を監視して UI を同期的に更新し、双方向バインディングを実現します。 |
| **JSBlock / JSItem / JSColumn** | コンテナ上のカスタムイベントを監視し、データや状態の変化に応答します。 |
| **resource 関連** | リソースの更新や保存などのライフサイクルイベントを監視し、データ更新後にロジックを実行します。 |

## 型定義

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## よく使われるイベント

| イベント名 | 説明 | イベントソース |
|--------|------|----------|
| `js-field:value-change` | フィールド値が外部から変更された（フォーム連動、デフォルト値の更新など） | `ctx.element` 上の CustomEvent。`ev.detail` が新しい値となります。 |
| `resource:refresh` | リソースデータが更新された | `ctx.resource` イベントバス |
| `resource:saved` | リソースの保存が完了した | `ctx.resource` イベントバス |

> イベントのマッピングルール：`resource:` プレフィックスが付いているものは `ctx.resource.on` を経由し、それ以外は通常 `ctx.element` 上の DOM イベント（存在する場合）を経由します。

## 例

### フィールドの双方向バインディング（React useEffect + クリーンアップ）

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### ネイティブ DOM の監視（ctx.on が利用できない場合の代替案）

```ts
// ctx.on が提供されていない場合は、ctx.element を直接使用できます
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// クリーンアップ時：ctx.element?.removeEventListener('js-field:value-change', handler);
```

### リソース更新後の UI 更新

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // データの更新に基づいてレンダリングを更新
});
```

## ctx.off との組み合わせ

- `ctx.on` で登録したリスナーは、メモリリークや重複実行を避けるため、適切なタイミングで [ctx.off](./off.md) を使用して削除する必要があります。
- React では、通常 `useEffect` のクリーンアップ関数内で `ctx.off` を呼び出します。
- `ctx.off` が存在しない場合があるため、使用時はオプショナルチェイニング（`ctx.off?.('eventName', handler)`）の使用を推奨します。

## 注意事項

1. **ペアでの解除**: `ctx.on(eventName, handler)` を呼び出すたびに、対応する `ctx.off(eventName, handler)` が必要です。また、渡される `handler` の参照は同一である必要があります。
2. **ライフサイクル**: コンポーネントのアンマウントやコンテキストの破棄の前にリスナーを削除してください。そうしないとメモリリークの原因になります。
3. **イベントの可用性**: コンテキストのタイプによってサポートされるイベントが異なります。詳細は各コンポーネントのドキュメントを参照してください。

## 関連ドキュメント

- [ctx.off](./off.md) - イベントリスナーの削除
- [ctx.element](./element.md) - レンダリングコンテナと DOM イベント
- [ctx.resource](./resource.md) - リソースインスタンスとその `on`/`off`
- [ctx.setValue](./set-value.md) - フィールド値の設定（`js-field:value-change` をトリガーします）