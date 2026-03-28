:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/off)をご参照ください。
:::

# ctx.off()

`ctx.on(eventName, handler)` を通じて登録されたイベントリスナーを削除します。通常、[ctx.on](./on.md) と組み合わせて使用され、適切なタイミングで購読を解除することで、メモリリークや重複トリガーを防ぎます。

## 適用シーン

| シーン | 説明 |
|------|------|
| **React useEffect のクリーンアップ** | `useEffect` のクリーンアップ関数内で呼び出し、コンポーネントのアンマウント時にリスナーを削除します。 |
| **JSField / JSEditableField** | フィールドの双方向バインディング時に、`js-field:value-change` の購読を解除します。 |
| **resource 関連** | `ctx.resource.on` で登録された `refresh` や `saved` などのリスナーの購読を解除します。 |

## 型定義

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## 使用例

### React useEffect でのペア使用

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### リソースイベントの購読解除

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// 適切なタイミングで
ctx.resource?.off('refresh', handler);
```

## 注意事項

1. **handler の参照の一致**: `ctx.off` に渡す `handler` は、`ctx.on` 時と同じ参照である必要があります。そうでない場合、正しく削除できません。
2. **適切なタイミングでのクリーンアップ**: メモリリークを避けるため、コンポーネントのアンマウント時やコンテキストの破棄前に `ctx.off` を呼び出してください。

## 関連ドキュメント

- [ctx.on](./on.md) - イベントの購読
- [ctx.resource](./resource.md) - リソースインスタンスとその `on`/`off` メソッド