---
title: "ctx.ai"
description: "RunJS で ctx.ai を使い、グローバル会話または指定した AI Chat Box で AI 従業員タスクを実行します。タスク内容の直接指定と、AI 従業員アクションに設定されたタスクの再利用に対応しています。"
keywords: "ctx.ai,AI employee,triggerTask,triggerModelTask,chatBoxUid,AI Chat Box,RunJS,NocoBase"
---

# ctx.ai

RunJS では `ctx.ai` を使って **AI 従業員タスク** を実行できます。JSBlock、JSAction、フォーム、ボタンなどから、指定した AI 従業員へ作業を渡す場面に向いています。

`ctx.ai` はタスクを実行するための API です。AI 従業員タスクの実行結果は返しません。呼び出し後、タスクは AI 従業員の会話フローに入り、結果はそのセッションで処理されます。

:::warning 注意

`ctx.ai` は AI プラグインによって提供されます。AI プラグインが有効でない場合、または現在の RunJS 環境に対応するクライアント機能が読み込まれていない場合、`ctx.ai` は存在しないことがあります。呼び出す前に `ctx.ai?.triggerTask` または `ctx.ai?.triggerModelTask` を確認できます。

:::

## メソッド

### ctx.ai.triggerTask()

AI 従業員タスクを直接実行します。

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| パラメーター | 型 | 説明 |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | AI 従業員。文字列を渡す場合、`AIEmployee.username` と完全一致で検索され、現在のユーザーがアクセスできる必要があります。 |
| `tasks` | `Task[]` | 実行するタスク一覧。 |
| `chatBoxUid` | `string` | タスクを受け取る AI Chat Box ブロックの FlowModel uid。 |
| `open` | `boolean` | AI 従業員の会話パネルを開くかどうか。 |
| `auto` | `boolean` | AI 従業員アクションの自動実行セマンティクスを使うかどうか。 |

よく使う `Task` フィールド:

| フィールド | 型 | 説明 |
|------|------|------|
| `title` | `string` | タスクタイトル。 |
| `message.system` | `string` | AI 従業員の役割や出力要件を制約するシステムメッセージ。 |
| `message.user` | `string` | このタスクの主要な指示。 |
| `message.workContext` | `ContextItem[]` | タスクで使うページブロックのコンテキスト。 |
| `autoSend` | `boolean` | タスクメッセージを自動送信するかどうか。 |
| `webSearch` | `boolean` | このタスクで Web search を許可するかどうか。 |
| `model` | `{ llmService: string; model: string } \| null` | このタスクで使うモデル。 |
| `skillSettings` | `SkillSettings` | このタスクで使う skills / tools 設定。 |

### AI Chat Box を指定する

`triggerTask()` のトップレベルオプションに `chatBoxUid` を設定すると、グローバルな AI 従業員ダイアログではなく、ページにマウントされている AI Chat Box ブロックでタスクを実行できます。

```ts
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  chatBoxUid: 'AI_CHAT_BOX_BLOCK_UID',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
    },
  ],
});
```

uid には、現在のページにマウントされている外側の AI Chat Box ブロックを指定します。このルーティング値を `tasks` 内に設定しないでください。対象ブロックが見つからない場合、NocoBase はエラーを表示し、グローバルダイアログにはフォールバックしません。`chatBoxUid` を省略すると、タスクはグローバルな AI 従業員ダイアログで実行されます。

### ページブロックコンテキストを追加する

`message.workContext` は現在、ページブロックを渡すために使います。対象ページブロックの FlowModel uid を入れます。

```ts
message: {
  user: 'Review the current users table and summarize operational risks.',
  workContext: [
    {
      type: 'flow-model',
      uid: 'USERS_TABLE_BLOCK_UID',
    },
  ],
}
```

| フィールド | 説明 |
|------|------|
| `type` | `flow-model` 固定。ページブロックコンテキストであることを表します。 |
| `uid` | テーブル、詳細、チャートなど、ページブロックの FlowModel uid。 |

現在の JSBlock 自体をコンテキストにしたい場合は、現在のモデル uid を使います。

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

### モデルを指定する

`model` は単一タスクのモデルを指定します。省略すると AI 従業員のデフォルトモデル設定が使われます。`null` を渡すとタスク単位のモデルを指定しません。

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

### skills / tools を設定する

`skillSettings` は単一タスクで利用できる skills と tools を指定します。省略すると AI 従業員自身の能力設定が使われます。

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

すべての skills または tools を明示的に無効にする場合は、空配列を渡し、バージョンフィールドは残します。

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

使用例:

```ts
if (!ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Daily operations handoff brief'),
      message: {
        system:
          'You prepare reusable daily operations handoff briefs. Focus on risks, blockers, decisions, owners, and next actions.',
        user: [
          "Prepare today's operations handoff brief.",
          'Cover customer escalations, SLA risks, approvals, and follow-up owners.',
          'Return a concise brief that can be posted to the team channel.',
        ].join('\n'),
      },
      autoSend: true,
      webSearch: false,
    },
  ],
});

ctx.message.success(ctx.t('AI employee task triggered.'));
```

`aiEmployee` に文字列を渡すと、NocoBase は現在のユーザーがアクセスできる AI 従業員を `username` の完全一致で検索します。

### ctx.ai.triggerModelTask()

ページ上の AI 従業員アクションモデルからタスクを読み取り、実行します。

`triggerModelTask()` の公開オプションは `chatBoxUid` を受け取りません。AI Chat Box を指定するには、AI 従業員アクションのプリセットタスクに `chatBoxUid` を設定します。`triggerModelTask()` はそのプリセット値を引き続き使用します。

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| パラメーター | 型 | 説明 |
|------|------|------|
| `uid` | `string` | AI 従業員アクションの FlowModel uid。 |
| `taskIndex` | `number` | タスクのインデックス。`0` から始まります。 |
| `options.open` | `boolean` | AI 従業員の会話パネルを開くかどうか。 |
| `options.auto` | `boolean` | AI 従業員アクションの自動実行セマンティクスを使うかどうか。 |

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

対象モデルが存在しない、AI 従業員が設定されていない、または指定インデックスにタスクがない場合、タスクは実行されず、コンソールに警告が出力されます。

## 注意事項

- `triggerTask()` と `triggerModelTask()` は fire-and-forget です。AI 従業員タスクの実行結果は返しません。
- `aiEmployee` の文字列は `AIEmployee.username` と完全一致でのみ検索されます。
- `triggerModelTask()` の `taskIndex` は `0` から始まります。
- `message.workContext` は現在、ページブロックコンテキストのみを表します。
- トップレベルの `triggerTask().chatBoxUid` には、現在のページにマウントされている AI Chat Box ブロックを指定する必要があります。
- `triggerModelTask()` はプリセットタスクに設定された `chatBoxUid` を引き続き使用します。

## 関連

- [ctx.message](./message.md): タスク実行前後に軽量な通知を表示します。
- [ctx.render](./render.md): JSBlock でボタンやフォームを描画します。
- [ctx.model](./model.md): 現在の FlowModel 情報を取得します。
