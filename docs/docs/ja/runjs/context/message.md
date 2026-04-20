:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/message)をご参照ください。
:::

# ctx.message

Ant Design のグローバル message API です。ページ上部の中央に一時的なメッセージを表示するために使用されます。メッセージは一定時間後に自動的に閉じるほか、ユーザーが手動で閉じることも可能です。

## 利用シーン

| シーン | 説明 |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | 操作フィードバック、バリデーション（検証）のヒント、コピー成功などの軽量な通知 |
| **フォーム操作 / ワークフロー** | 送信成功、保存失敗、バリデーションエラーなどのフィードバック |
| **アクションイベント (JSAction)** | クリック、一括操作完了などの即時フィードバック |

## 型定義

```ts
message: MessageInstance;
```

`MessageInstance` は Ant Design の message インターフェースであり、以下のメソッドを提供します。

## よく使われるメソッド

| メソッド | 説明 |
|------|------|
| `success(content, duration?)` | 成功メッセージを表示 |
| `error(content, duration?)` | エラーメッセージを表示 |
| `warning(content, duration?)` | 警告メッセージを表示 |
| `info(content, duration?)` | 情報メッセージを表示 |
| `loading(content, duration?)` | ローディングメッセージを表示（手動で閉じる必要があります） |
| `open(config)` | カスタム設定でメッセージを表示 |
| `destroy()` | 表示されているすべてのメッセージを閉じる |

**パラメータ：**

- `content`（`string` \| `ConfigOptions`）：メッセージ内容または設定オブジェクト
- `duration`（`number`、オプション）：自動的に閉じるまでの遅延時間（秒）。デフォルトは 3 秒。0 を設定すると自動的に閉じません。

**ConfigOptions**（`content` がオブジェクトの場合）：

```ts
interface ConfigOptions {
  content: React.ReactNode;  // メッセージ内容
  duration?: number;        // 自動的に閉じるまでの遅延時間（秒）
  onClose?: () => void;    // 閉じた時のコールバック
  icon?: React.ReactNode;  // カスタムアイコン
}
```

## 例

### 基本的な使い方

```ts
ctx.message.success('操作に成功しました');
ctx.message.error('操作に失敗しました');
ctx.message.warning('まずデータを選択してください');
ctx.message.info('処理中です...');
```

### ctx.t と組み合わせた国際化

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### loading と手動での終了

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// 非同期操作を実行
await saveData();
hide();  // 手動で loading を閉じる
ctx.message.success(ctx.t('Saved'));
```

### open を使用したカスタム設定

```ts
ctx.message.open({
  type: 'success',
  content: 'カスタム成功メッセージ',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### すべてのメッセージを閉じる

```ts
ctx.message.destroy();
```

## ctx.message と ctx.notification の違い

| 特性 | ctx.message | ctx.notification |
|------|--------------|------------------|
| **位置** | ページ上部中央 | 右上 |
| **用途** | 一時的な軽量メッセージ、自動的に消える | 通知パネル、タイトルと説明を含めることができ、比較的長い時間の表示に適している |
| **典型的なシーン** | 操作フィードバック、バリデーションのヒント、コピー成功 | タスク完了通知、システムメッセージ、ユーザーの注意を引く必要がある長めの内容 |

## 関連情報

- [ctx.notification](./notification.md) - 右上の通知、長時間表示に適しています
- [ctx.modal](./modal.md) - モーダル確認、ブロッキングなインタラクション
- [ctx.t()](./t.md) - 国際化、message と組み合わせてよく使われます