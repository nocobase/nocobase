:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/notification)をご参照ください。
:::

# ctx.notification

Ant Design Notification に基づいたグローバル通知 API です。ページの**右上**に通知パネルを表示するために使用されます。`ctx.message` と比較して、通知にはタイトルと説明を含めることができ、長時間表示させたい場合やユーザーの注意を引く必要がある内容に適しています。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock / アクションイベント** | タスク完了通知、一括操作の結果、エクスポート完了など |
| **ワークフロー (FlowEngine)** | 非同期プロセス終了後のシステムレベルの通知 |
| **長時間の表示が必要なコンテンツ** | タイトル、説明、操作ボタンを含む完全な通知 |

## 型定義

```ts
notification: NotificationInstance;
```

`NotificationInstance` は Ant Design の notification インターフェースであり、以下のメソッドを提供します。

## 常用メソッド

| メソッド | 説明 |
|------|------|
| `open(config)` | カスタム設定を使用して通知を開く |
| `success(config)` | 成功タイプの通知を表示する |
| `info(config)` | 情報タイプの通知を表示する |
| `warning(config)` | 警告タイプの通知を表示する |
| `error(config)` | エラータイプの通知を表示する |
| `destroy(key?)` | 指定された key の通知を閉じる。key を指定しない場合はすべての通知を閉じる |

**設定パラメータ**（[Ant Design notification](https://ant.design/components/notification) と共通）:

| パラメータ | 型 | 説明 |
|------|------|------|
| `message` | `ReactNode` | 通知のタイトル |
| `description` | `ReactNode` | 通知の説明 |
| `duration` | `number` | 自動的に閉じるまでの遅延時間（秒）。デフォルトは 4.5 秒。0 を設定すると自動的に閉じません |
| `key` | `string` | 通知の一意識別子。`destroy(key)` で特定の通知を閉じる際に使用します |
| `onClose` | `() => void` | 閉じた時のコールバック関数 |
| `placement` | `string` | 表示位置：`topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## 例

### 基本的な使い方

```ts
ctx.notification.open({
  message: '操作成功',
  description: 'データがサーバーに保存されました。',
});
```

### タイプ別のクイック呼び出し

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### カスタム表示時間と key

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // 自動的に閉じない
});

// タスク完了後に手動で閉じる
ctx.notification.destroy('task-123');
```

### すべての通知を閉じる

```ts
ctx.notification.destroy();
```

## ctx.message との違い

| 特徴 | ctx.message | ctx.notification |
|------|--------------|------------------|
| **位置** | ページ上部中央 | 右上（設定可能） |
| **構造** | 1行の簡易メッセージ | タイトル + 説明が可能 |
| **用途** | 一時的なフィードバック、自動的に消える | 詳細な通知、長時間の表示が可能 |
| **代表的なシナリオ** | 操作成功、バリデーション失敗、コピー成功 | タスク完了、システムメッセージ、ユーザーの注意が必要な長い内容 |

## 関連情報

- [ctx.message](./message.md) - 上部の簡易メッセージ、迅速なフィードバックに適しています
- [ctx.modal](./modal.md) - モーダル確認、ブロッキングなインタラクション
- [ctx.t()](./t.md) - 国際化、通知と組み合わせてよく使用されます