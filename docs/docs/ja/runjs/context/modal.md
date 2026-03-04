:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/modal)をご参照ください。
:::

# ctx.modal

Ant Design Modal に基づくショートカット API です。RunJS 内でモーダル（情報提示、確認ダイアログなど）を能動的に開くために使用されます。`ctx.viewer` / ビューシステムによって実装されています。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock / JSField** | ユーザー操作後の実行結果、エラー表示、または二次確認の表示。 |
| **イベントフロー / 操作イベント** | 送信前に確認ダイアログを表示し、ユーザーがキャンセルした場合は `ctx.exit()` で後続のステップを終了。 |
| **連動ルール** | バリデーション失敗時にユーザーへ通知。 |

> 注意：`ctx.modal` は、ビューコンテキストが存在する RunJS 環境（ページ内の JSBlock、イベントフローなど）で使用可能です。バックエンドや UI コンテキストのない環境では存在しない可能性があるため、使用時はオプショナルチェーン（`ctx.modal?.confirm?.()`）の使用を推奨します。

## 型定義

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // ユーザーが「確定」をクリックすると true、キャンセルすると false を返します
};
```

`ModalConfig` は Ant Design `Modal` の静的メソッドの構成と一致します。

## 主要なメソッド

| メソッド | 戻り値 | 説明 |
|------|--------|------|
| `info(config)` | `Promise<void>` | 情報提示モーダル |
| `success(config)` | `Promise<void>` | 成功提示モーダル |
| `error(config)` | `Promise<void>` | エラー提示モーダル |
| `warning(config)` | `Promise<void>` | 警告提示モーダル |
| `confirm(config)` | `Promise<boolean>` | 確認ダイアログ。ユーザーが「確定」をクリックすると `true`、キャンセルすると `false` を返します。 |

## 設定パラメータ

Ant Design `Modal` と同様で、主なフィールドは以下の通りです：

| パラメータ | 型 | 説明 |
|------|------|------|
| `title` | `ReactNode` | タイトル |
| `content` | `ReactNode` | 内容 |
| `okText` | `string` | 確定ボタンのテキスト |
| `cancelText` | `string` | キャンセルボタンのテキスト（`confirm` のみ） |
| `onOk` | `() => void \| Promise<void>` | 確定ボタンをクリックした時に実行 |
| `onCancel` | `() => void` | キャンセルボタンをクリックした時に実行 |

## ctx.message、ctx.openView との関係

| 用途 | 推奨される使用方法 |
|------|----------|
| **軽量な一時的通知** | `ctx.message`（自動的に消える） |
| **情報/成功/エラー/警告モーダル** | `ctx.modal.info` / `success` / `error` / `warning` |
| **二次確認（ユーザーの選択が必要）** | `ctx.modal.confirm`（`ctx.exit()` と組み合わせてフローを制御） |
| **複雑なフォームやリストなどの操作** | `ctx.openView`（カスタムビューをページ/ドロワー/モーダルで開く） |

## 例

### シンプルな情報提示モーダル

```ts
ctx.modal.info({
  title: 'ヒント',
  content: '操作が完了しました',
});
```

### 確認ダイアログによるフロー制御

```ts
const confirmed = await ctx.modal.confirm({
  title: '削除の確認',
  content: 'このレコードを削除してもよろしいですか？',
  okText: '確定',
  cancelText: 'キャンセル',
});
if (!confirmed) {
  ctx.exit();  // ユーザーがキャンセルした場合は後続のステップを終了
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### onOk を含む確認ダイアログ

```ts
await ctx.modal.confirm({
  title: '送信の確認',
  content: '送信後は修正できません。続行しますか？',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### エラー提示

```ts
try {
  await someOperation();
  ctx.modal.success({ title: '成功', content: '操作が完了しました' });
} catch (e) {
  ctx.modal.error({ title: 'エラー', content: e.message });
}
```

## 関連情報

- [ctx.message](./message.md)：軽量な一時的通知、自動的に消える
- [ctx.exit()](./exit.md)：ユーザーが確認をキャンセルした際、`if (!confirmed) ctx.exit()` としてフローを終了させるためによく使われます
- [ctx.openView()](./open-view.md)：カスタムビューを開く、複雑なインタラクションに適しています