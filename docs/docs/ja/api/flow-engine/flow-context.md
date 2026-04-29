---
title: "FlowContext"
description: "NocoBase FlowContext API：registerFlow の handler における ctx オブジェクトの全プロパティとメソッドのリファレンスです。"
keywords: "FlowContext,FlowRuntimeContext,ctx,registerFlow,handler,FlowEngine,NocoBase"
---

# FlowContext

`registerFlow` の step handler において、`ctx` パラメータは `FlowRuntimeContext` のインスタンスです。委譲チェーンを通じて、モデルレベルおよびエンジンレベルのすべてのプロパティとメソッドにアクセスできます。

委譲チェーンは以下の通りです：

```
FlowRuntimeContext（現在の flow のランタイムコンテキスト）
  → FlowModelContext（model.context、モデルレベル）
    → FlowEngineContext（engine.context、グローバルレベル）
```

## よく使うプロパティ

プラグイン開発で最もよく使う `ctx` のプロパティです：

| プロパティ | 型 | 説明 |
|------|------|------|
| `ctx.model` | `FlowModel` | 現在の FlowModel インスタンス |
| `ctx.api` | `APIClient` | HTTP リクエストクライアント、`@nocobase/sdk` から提供されます |
| `ctx.viewer` | `FlowViewer` | ポップアップ / ドロワーマネージャー、`dialog()`、`drawer()` などのメソッドを提供します |
| `ctx.message` | `MessageInstance` | Antd の message インスタンス、例：`ctx.message.success('OK')` |
| `ctx.notification` | `NotificationInstance` | Antd の notification インスタンス |
| `ctx.modal` | `HookAPI` | Antd の Modal.useModal インスタンス |
| `ctx.t(key, options?)` | `(string, object?) => string` | 国際化翻訳メソッド |
| `ctx.router` | `Router` | react-router のルーターインスタンス |
| `ctx.route` | `RouteOptions` | 現在のルート情報（observable） |
| `ctx.location` | `Location` | 現在の URL の location オブジェクト（observable） |
| `ctx.ref` | `React.RefObject` | 現在のモデルビューコンテナの DOM ref |
| `ctx.flowKey` | `string` | 現在の flow の key |
| `ctx.mode` | `'runtime' \| 'settings'` | 現在の実行モード、runtime はランタイム、settings は設定パネル |
| `ctx.token` | `string` | 現在のユーザーの認証 token |
| `ctx.role` | `string` | 現在のユーザーのロール |
| `ctx.auth` | `object` | 認証情報：`{ roleName, locale, token, user }` |
| `ctx.themeToken` | `object` | Antd テーマ token、テーマカラーなどの取得に使用します |
| `ctx.dataSourceManager` | `DataSourceManager` | データソースマネージャー |
| `ctx.engine` | `FlowEngine` | FlowEngine インスタンス |
| `ctx.app` | `Application` | NocoBase Application インスタンス |
| `ctx.i18n` | `i18n` | i18next インスタンス |

## よく使うメソッド

### リクエスト関連

| メソッド | 説明 |
|------|------|
| `ctx.request(options)` | HTTP リクエストを発行します。内部 URL は `APIClient` 経由、外部 URL は `axios` 経由で処理されます |
| `ctx.makeResource(ResourceClass)` | Resource インスタンスを作成します（例：`MultiRecordResource`、`SingleRecordResource`） |
| `ctx.initResource(className)` | model context 上で resource を初期化します |

### ポップアップ関連

| メソッド | 説明 |
|------|------|
| `ctx.viewer.dialog(options)` | ダイアログを開きます。`options.content` は `(view) => JSX` を受け取り、`view.close()` で閉じます |
| `ctx.viewer.drawer(options)` | ドロワーを開きます |
| `ctx.openView(uid, options)` | 登録済みのビューを開きます（popup / drawer / dialog） |

### Flow 実行制御

| メソッド | 説明 |
|------|------|
| `ctx.exit()` | 現在の flow の実行を中断します |
| `ctx.exitAll()` | すべての flow の実行を中断します |
| `ctx.getStepParams(stepKey)` | 指定した step の保存済みパラメータを取得します |
| `ctx.setStepParams(stepKey, params)` | 指定した step のパラメータを設定します |
| `ctx.getStepResults(stepKey)` | 以前の特定の step の実行結果を取得します |

### Action とイベント

| メソッド | 説明 |
|------|------|
| `ctx.runAction(actionName, params?)` | 登録済みの action を実行します |
| `ctx.getAction(name)` | 登録済みの action 定義を取得します |
| `ctx.getActions()` | すべての登録済み action を取得します |
| `ctx.getEvents()` | すべての登録済みイベントを取得します |

### 権限

| メソッド | 説明 |
|------|------|
| `ctx.aclCheck(params)` | ACL 権限を確認します |
| `ctx.acl` | ACL インスタンス |

### その他

| メソッド | 説明 |
|------|------|
| `ctx.resolveJsonTemplate(template)` | `{{ ctx.xxx }}` 式のテンプレートを解析します |
| `ctx.getVar(path)` | 単一の `ctx.xxx.yyy` 式パスを解析します |
| `ctx.runjs(code, variables?, options?)` | JavaScript コードを動的に実行します |
| `ctx.requireAsync(url)` | モジュールを動的にロードします（CommonJS スタイル） |
| `ctx.importAsync(url)` | モジュールを動的にロードします（ESM スタイル） |
| `ctx.loadCSS(href)` | CSS ファイルを動的にロードします |
| `ctx.onRefReady(ref, callback, timeout)` | React ref の準備完了後にコールバックを実行します |
| `ctx.defineProperty(key, options)` | 新しいプロパティを動的に登録します |
| `ctx.defineMethod(name, fn, info?)` | 新しいメソッドを動的に登録します |

## プラグイン開発での典型的な使い方

### click handler でメッセージを表示する

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('操作が成功しました'));
      },
    },
  },
});
```

### ダイアログでレコードを作成する

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    openDialog: {
      async handler(ctx) {
        ctx.viewer.dialog({
          title: ctx.t('新規レコード'),
          content: (view) => <MyForm onClose={() => view.close()} />,
        });
      },
    },
  },
});
```

### 現在の行データを取得する（レコードレベルの操作）

```ts
MyRecordAction.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showRecord: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        ctx.message.info(`${index} 行目: ${record.title}`);
      },
    },
  },
});
```

### resource を通じてデータを操作する

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource;
  // レコードを作成
  await resource.create({ title: 'New item', completed: false });
  // データを更新
  await resource.refresh();
}
```

## 関連リンク

- [FlowEngine 概要（プラグイン開発）](../../plugin-development/client/flow-engine/index.md) — FlowModel の基本的な使い方と registerFlow
- [FlowDefinition フロー定義](../../flow-engine/definitions/flow-definition.md) — registerFlow の完全なパラメータ説明
- [FlowEngine 完全ドキュメント](../../flow-engine/index.md) — FlowModel、Flow の完全なリファレンス
