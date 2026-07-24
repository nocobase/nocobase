---
title: "ctx.ai"
description: "RunJS で ctx.ai を使い、グローバル会話または指定した AI Chat Box で AI 従業員タスクを実行します。タスク内容の直接指定と、AI 従業員アクションに設定されたタスクの再利用に対応しています。"
keywords: "ctx.ai,AI employee,uploadFile,attachments,triggerTask,triggerModelTask,onResponseLoadingChange,chatBoxUid,AI Chat Box,RunJS,NocoBase"
---

# ctx.ai

RunJS では `ctx.ai` を使って **AI 従業員タスク** を実行できます。JSBlock、JSAction、フォーム、ボタンなどから、指定した AI 従業員へ作業を渡す場面に向いています。

`ctx.ai` は AI タスクの添付ファイルをアップロードし、タスクを実行します。ファイルのアップロードは完了を待てますが、タスクの実行結果は返しません。呼び出し後、タスクは AI 従業員の会話フローに入り、結果はそのセッションで処理されます。

:::warning 注意

`ctx.ai` は AI プラグインによって提供されます。AI プラグインが有効でない場合、または現在の RunJS 環境に対応するクライアント機能が読み込まれていない場合、`ctx.ai` は存在しないことがあります。呼び出す前に `ctx.ai?.uploadFile`、`ctx.ai?.triggerTask`、または `ctx.ai?.triggerModelTask` を確認できます。

:::

## メソッド

### ctx.ai.uploadFile()

ファイルをアップロードし、AI 従業員タスクへ直接渡せる添付ファイルオブジェクトを返します。

```ts
const attachment = await ctx.ai.uploadFile(file, options);
```

| パラメーター | 型 | 説明 |
|------|------|------|
| `file` | `File` | アップロードするブラウザーのファイルオブジェクト。 |
| `options.onProgress` | `(percent: number) => void` | アップロード進捗のコールバック。`percent` は `0` から `100` の範囲です。 |
| `options.signal` | `AbortSignal` | アップロードをキャンセルするためのシグナル。 |

アップロードでは AI プラグインに設定されたファイルストレージを使用し、`aiFiles` にレコードを作成します。返されるオブジェクトには `id`、`filename`、`url`、`source` などが含まれます。

```ts
const attachment = await ctx.ai.uploadFile(file, {
  onProgress(percent) {
    console.log('upload progress', percent);
  },
});

// attachment は message.attachments に直接設定できます
```

アップロードに失敗すると Promise は reject されます。ローカルのファイル一覧から添付ファイルを削除しても、`aiFiles` に作成済みのレコードは削除されません。デフォルトの AI チャットウィンドウと同じ動作です。

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
| `onResponseLoadingChange` | `(loading: boolean) => void` | モデル応答の読み込み状態コールバック。このタスクが自動送信される場合にのみ呼び出されます。 |

よく使う `Task` フィールド:

| フィールド | 型 | 説明 |
|------|------|------|
| `title` | `string` | タスクタイトル。 |
| `message.system` | `string` | AI 従業員の役割や出力要件を制約するシステムメッセージ。 |
| `message.user` | `string` | このタスクの主要な指示。 |
| `message.attachments` | `Attachment[]` | タスクで使う添付ファイル。通常は `ctx.ai.uploadFile()` の戻り値です。 |
| `message.workContext` | `ContextItem[]` | タスクで使うページブロックのコンテキスト。 |
| `autoSend` | `boolean` | タスクメッセージを自動送信するかどうか。 |
| `webSearch` | `boolean` | このタスクで Web search を許可するかどうか。 |
| `model` | `{ llmService: string; model: string } \| null` | このタスクで使うモデル。 |
| `skillSettings` | `SkillSettings` | このタスクで使う skills / tools 設定。 |

### レスポンスの読み込み状態を監視する

トップレベルオプションに `onResponseLoadingChange` を渡すと、このタスクのモデル応答の読み込み状態を監視できます。モデル応答の待機開始時は `true`、完了、キャンセル、失敗時は `false` が渡されます。React コンポーネントで `useState` により `setResponseLoading` を宣言済みの場合は、次のように記述できます。

```tsx
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
      autoSend: true,
    },
  ],
  onResponseLoadingChange(loading) {
    setResponseLoading(loading);
  },
});
```

`onResponseLoadingChange` は、この `triggerTask()` 呼び出しが直接開始したモデル応答だけを監視します。`autoSend: false` の場合、タスクはチャットの下書きに入るだけで、コールバックは呼び出されません。ユーザーが後で手動送信しても、このコールバックは再利用されません。

JS ブロック内の React コンポーネントでは、コンポーネントがマウントされている間、この状態更新によって再レンダリングされます。

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

### JSBlock で添付ファイルをアップロードして送信する

次の例では、JSBlock にファイルアップロード、タスクの指示、送信ボタンを表示します。アップロード済みのファイルは `message.attachments` を通して AI 従業員へ渡されます。

```tsx
if (!ctx.ai?.uploadFile || !ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const { React } = ctx.libs;
const { useState } = React;
const { Button, Card, Input, Space, Upload } = ctx.libs.antd;
const { InboxOutlined, SendOutlined } = ctx.libs.antdIcons;

const AttachmentTask = () => {
  const [prompt, setPrompt] = useState('');
  const [fileList, setFileList] = useState([]);

  const uploadAttachment = async ({ file, onError, onProgress, onSuccess }) => {
    try {
      const attachment = await ctx.ai.uploadFile(file, {
        onProgress(percent) {
          onProgress?.({ percent });
        },
      });
      onSuccess?.(attachment);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(ctx.t('File upload failed')));
    }
  };

  const sendTask = () => {
    const attachments = fileList
      .filter((file) => file.status === 'done' && file.response)
      .map((file) => file.response);

    if (!prompt.trim()) {
      ctx.message.warning(ctx.t('Enter task instructions'));
      return;
    }

    ctx.ai.triggerTask({
      aiEmployee: 'viz',
      open: true,
      tasks: [
        {
          title: ctx.t('Analyze uploaded files'),
          message: {
            user: prompt.trim(),
            attachments,
          },
          autoSend: true,
        },
      ],
    });
    setPrompt('');
    setFileList([]);
  };

  const uploading = fileList.some((file) => file.status === 'uploading');

  return (
    <Card title={ctx.t('AI file analysis')}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Upload.Dragger
          multiple
          fileList={fileList}
          customRequest={uploadAttachment}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p>{ctx.t('Click or drag files here to upload')}</p>
        </Upload.Dragger>
        <Input.TextArea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={ctx.t('Describe the task for the AI employee')}
          autoSize={{ minRows: 3, maxRows: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          disabled={uploading || !prompt.trim()}
          onClick={sendTask}
        >
          {ctx.t('Send to AI')}
        </Button>
      </Space>
    </Card>
  );
};

ctx.render(<AttachmentTask />);
```

`autoSend: false` を設定すると、添付ファイルとタスクの指示は AI チャットの下書きに入り、すぐには送信されません。

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
| `options.attachments` | `Attachment[]` | 設定済みタスクへ動的に追加する添付ファイル。 |
| `options.onResponseLoadingChange` | `(loading: boolean) => void` | モデル応答の読み込み状態コールバック。設定済みタスクが自動送信される場合にのみ呼び出されます。 |

`options.onResponseLoadingChange` の動作は `triggerTask()` と同じです。呼び出されるかどうかは、設定済みタスクの `autoSend` によって決まります。`autoSend: false` のタスクでは呼び出されません。

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
  attachments,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

対象モデルが存在しない、AI 従業員が設定されていない、または指定インデックスにタスクがない場合、タスクは実行されず、コンソールに警告が出力されます。

## 注意事項

- `triggerTask()` と `triggerModelTask()` は fire-and-forget です。AI 従業員タスクの実行結果は返しません。
- `uploadFile()` は Promise を返します。添付ファイルを使うタスクは、アップロード完了後に実行してください。
- `aiEmployee` の文字列は `AIEmployee.username` と完全一致でのみ検索されます。
- `triggerModelTask()` の `taskIndex` は `0` から始まります。
- `message.workContext` は現在、ページブロックコンテキストのみを表します。
- トップレベルの `triggerTask().chatBoxUid` には、現在のページにマウントされている AI Chat Box ブロックを指定する必要があります。
- `triggerModelTask()` はプリセットタスクに設定された `chatBoxUid` を引き続き使用します。
- `triggerModelTask()` の動的な添付ファイルは、保存済みタスク設定を変更せず、プリセットタスクの既存の `message.attachments` に追加されます。
- `onResponseLoadingChange` は現在の呼び出しが自動送信したモデル応答だけを監視し、後でユーザーが手動送信したメッセージは監視しません。

## 関連

- [ctx.message](./message.md): タスク実行前後に軽量な通知を表示します。
- [ctx.render](./render.md): JSBlock でボタンやフォームを描画します。
- [ctx.model](./model.md): 現在の FlowModel 情報を取得します。
