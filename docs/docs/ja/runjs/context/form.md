:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/form)をご参照ください。
:::

# ctx.form

現在のブロック内にある Ant Design Form インスタンスです。フォームフィールドの読み書き、バリデーションの実行、および送信に使用されます。`ctx.blockModel?.form` と等価であり、フォームブロック（フォーム、編集フォーム、子フォームなど）の下で直接使用できます。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSField** | 他のフォームフィールドとの連動、他のフィールド値に基づく計算やバリデーションの実装 |
| **JSItem** | 子テーブルの項目内で、同じ行または他のフィールドの読み書きを行い、テーブル内連動を実現 |
| **JSColumn** | テーブル列で、その行または関連フィールドの値を読み取ってレンダリングに使用 |
| **フォーム操作 / イベントフロー** | 送信前のバリデーション、フィールドの一括更新、フォームのリセットなど |

> 注意：`ctx.form` はフォームブロック（フォーム、編集フォーム、子フォームなど）に関連する RunJS コンテキストでのみ利用可能です。非フォームシナリオ（JSBlock 独立ブロック、テーブルブロックなど）では存在しない可能性があるため、使用前に `ctx.form?.getFieldsValue()` のように空値チェックを行うことを推奨します。

## 型定義

```ts
form: FormInstance<any>;
```

`FormInstance` は Ant Design Form のインスタンス型です。主なメソッドは以下の通りです。

## 常用メソッド

### フォーム値の読み取り

```ts
// 現在登録されているフィールドの値を読み取る（デフォルトではレンダリング済みのフィールドのみ）
const values = ctx.form.getFieldsValue();

// すべてのフィールドの値を読み取る（登録済みだが未レンダリングのフィールド、例えば非表示や折りたたみエリア内のものを含む）
const allValues = ctx.form.getFieldsValue(true);

// 単一のフィールドを読み取る
const email = ctx.form.getFieldValue('email');

// ネストされたフィールド（子テーブルなど）を読み取る
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### フォーム値の書き込み

```ts
// 一括更新（連動によく使用されます）
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// 単一のフィールドを更新
ctx.form.setFieldValue('remark', '備考済み');
```

### バリデーションと送信

```ts
// フォームのバリデーションを実行
await ctx.form.validateFields();

// フォームの送信を実行
ctx.form.submit();
```

### リセット

```ts
// すべてのフィールドをリセット
ctx.form.resetFields();

// 指定したフィールドのみをリセット
ctx.form.resetFields(['status', 'remark']);
```

## 関連する context との関係

### ctx.getValue / ctx.setValue

| シーン | 推奨される使い方 |
|------|----------|
| **現在のフィールドの読み書き** | `ctx.getValue()` / `ctx.setValue(v)` |
| **他のフィールドの読み書き** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

現在の JS フィールド内では、自身のフィールドの読み書きには `getValue`/`setValue` を優先的に使用します。他のフィールドにアクセスする必要がある場合に `ctx.form` を使用します。

### ctx.blockModel

| ニーズ | 推奨される使い方 |
|------|----------|
| **フォームフィールドの読み書き** | `ctx.form`（`ctx.blockModel?.form` と等価ですが、より簡潔です） |
| **親ブロックへのアクセス** | `ctx.blockModel`（`collection`、`resource` などを含む） |

### ctx.getVar('ctx.formValues')

フォーム値は `await ctx.getVar('ctx.formValues')` を通じて取得する必要があり、直接 `ctx.formValues` としては公開されていません。フォームコンテキスト内では、`ctx.form.getFieldsValue()` を使用して最新値をリアルタイムで読み取ることが推奨されます。

## 注意事項

- `getFieldsValue()` はデフォルトでレンダリング済みのフィールドのみを返します。未レンダリングのフィールド（折りたたみエリア内や条件付き表示で隠れているものなど）を含めるには、`true` を渡す必要があります：`getFieldsValue(true)`。
- 子テーブルなどのネストされたフィールドのパスは配列になります（例：`['orders', 0, 'amount']`）。`ctx.namePath` を使用して現在のフィールドのパスを取得し、同じ行の他の列のパスを構築するために利用できます。
- `validateFields()` は、`errorFields` などの情報を含むエラーオブジェクトをスローします。送信前のバリデーションに失敗した際、`ctx.exit()` を使用して後続のステップを終了させることができます。
- イベントフローや連動ルールなどの非同期シナリオでは、`ctx.form` がまだ準備できていない場合があります。オプショナルチェイニングや空値チェックの使用を推奨します。

## 例文

### フィールド連動：タイプに応じて異なる内容を表示する

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### 他のフィールドに基づいて現在のフィールドを計算する

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### 子テーブル内で同じ行の他の列を読み書きする

```ts
// ctx.namePath はフォーム内での現在のフィールドのパスです（例：['orders', 0, 'amount']）
// 同じ行の status を読み取る：['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### 送信前のバリデーション

```ts
try {
  await ctx.form.validateFields();
  // バリデーション通過、送信ロジックを継続
} catch (e) {
  ctx.message.error('入力内容を確認してください');
  ctx.exit();
}
```

### 確認後に送信する

```ts
const confirmed = await ctx.modal.confirm({
  title: '送信の確認',
  content: '送信後は変更できません。続行しますか？',
  okText: '確定',
  cancelText: 'キャンセル',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // ユーザーがキャンセルした場合は終了
}
```

## 関連情報

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md)：現在のフィールド値の読み書き
- [ctx.blockModel](./block-model.md)：親ブロックモデル。`ctx.form` は `ctx.blockModel?.form` と等価
- [ctx.modal](./modal.md)：確認ダイアログ。`ctx.form.validateFields()` や `ctx.form.submit()` と組み合わせて使用
- [ctx.exit()](./exit.md)：バリデーション失敗時やユーザーキャンセル時にプロセスを終了
- `ctx.namePath`：現在のフィールドのフォーム内パス（配列）。ネストされたフィールドで `getFieldValue` / `setFieldValue` の名前を構築する際に使用