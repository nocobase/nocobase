:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/get-value)をご参照ください。
:::

# ctx.getValue()

JSField や JSItem などの編集可能なフィールドのシナリオにおいて、現在のフィールドの最新値を取得します。`ctx.setValue(v)` と組み合わせることで、フォームとの双方向バインディングを実現できます。

## 適用シーン

| シナリオ | 説明 |
|------|------|
| **JSField** | 編集可能なカスタムフィールドで、ユーザー入力またはフォームの現在の値を読み取ります。 |
| **JSItem** | テーブル/サブテーブルの編集可能なアイテムで、現在のセルの値を読み取ります。 |
| **JSColumn** | テーブル列のレンダリング時に、対応する行のフィールド値を読み取ります。 |

> 注意：`ctx.getValue()` は、フォームバインディングを持つ RunJS コンテキストでのみ使用可能です。ワークフローや連動ルールなど、フィールドバインディングがないシナリオではこのメソッドは存在しません。

## 型定義

```ts
getValue<T = any>(): T | undefined;
```

- **戻り値**：現在のフィールド値。型はフィールドのフォーム項目タイプによって決まります。フィールドが登録されていない、または入力されていない場合は `undefined` になる可能性があります。

## 値の取得順序

`ctx.getValue()` は以下の順序で値を取得します：

1. **フォームの状態**：Ant Design Form の現在の状態から優先的に読み取ります。
2. **フォールバック値**：フォーム内に該当するフィールドがない場合、フィールドの初期値または props にフォールバックします。

> フォームのレンダリングが完了していない、またはフィールドが登録されていない場合、`undefined` を返すことがあります。

## 例

### 現在の値に基づいたレンダリング

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>内容を先に入力してください</span>);
} else {
  ctx.render(<span>現在の値：{current}</span>);
}
```

### setValue と組み合わせて双方向バインディングを実現する

```tsx
const { Input } = ctx.libs.antd;

// 現在の値をデフォルト値として読み取る
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## 関連情報

- [ctx.setValue()](./set-value.md) - 現在のフィールド値を設定します。`getValue` と組み合わせて双方向バインディングを実現します。
- [ctx.form](./form.md) - Ant Design Form インスタンス。他のフィールドの読み書きが可能です。
- `js-field:value-change` - 外部の値が変更されたときにトリガーされるコンテナイベント。表示の更新に使用されます。