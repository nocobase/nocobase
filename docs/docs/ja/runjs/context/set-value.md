:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/set-value)をご参照ください。
:::

# ctx.setValue()

JSField や JSItem などの編集可能なフィールドのシナリオにおいて、現在のフィールドの値を設定します。`ctx.getValue()` と組み合わせることで、フォームとの双方向バインディングを実現できます。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSField** | 編集可能なカスタムフィールドにおいて、ユーザーが選択した値や計算後の値を書き込みます。 |
| **JSItem** | テーブル/サブテーブルの編集可能なアイテムにおいて、現在のセル値を更新します。 |
| **JSColumn** | テーブル列のレンダリング時に、ロジックに基づいて対応する行のフィールド値を更新します。 |

> **注意**：`ctx.setValue(v)` は、フォームバインディングを持つ RunJS コンテキストでのみ利用可能です。ワークフロー、連動ルール、JSBlock などのフィールドバインディングがないシナリオではこのメソッドは存在しないため、使用前にオプショナルチェイニング（`ctx.setValue?.(value)`）を使用することをお勧めします。

## 型定義

```ts
setValue<T = any>(value: T): void;
```

- **引数**：`value` は書き込むフィールド値です。型はフィールドのフォーム項目タイプによって決まります。

## 振る舞いの説明

- `ctx.setValue(v)` は、Ant Design Form 内の現在のフィールド値を更新し、関連するフォームの連動やバリデーション（検証）ロジックをトリガーします。
- フォームのレンダリングが完了していない場合やフィールドが登録されていない場合、呼び出しが無効になる可能性があります。`ctx.getValue()` と併用して書き込み結果を確認することをお勧めします。

## 実行例

### getValue と組み合わせた双方向バインディングの実現

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### 条件に基づいたデフォルト値の設定

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### 他のフィールドとの連動時に現在のフィールドへ書き戻す

```ts
// あるフィールドが変更されたとき、現在のフィールドを同期的に更新する
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'カスタム', value: 'custom' });
}
```

## 注意事項

- 編集不可のフィールド（JSField の詳細モード、JSBlock など）では、`ctx.setValue` が `undefined` になる可能性があるため、エラーを避けるために `ctx.setValue?.(value)` を使用することをお勧めします。
- 関連フィールド（M2O、O2M など）に値を設定する場合は、フィールドタイプに一致する構造（例：`{ id, [titleField]: label }`）を渡す必要があります。詳細はフィールド設定に準じます。

## 関連情報

- [ctx.getValue()](./get-value.md) - 現在のフィールド値を取得し、setValue と組み合わせて双方向バインディングを実現します。
- [ctx.form](./form.md) - Ant Design Form インスタンス。他のフィールドの読み書きが可能です。
- `js-field:value-change` - 外部の値が変更されたときにトリガーされるコンテナイベント。表示の更新に使用されます。