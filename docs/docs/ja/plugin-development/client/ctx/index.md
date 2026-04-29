---
title: "Context コンテキスト"
description: "NocoBase クライアントのコンテキスト機構：Plugin 内の this.context とコンポーネント内の useFlowContext() は同一のオブジェクトで、アクセス方法が異なります。"
keywords: "Context,コンテキスト,useFlowContext,this.context,FlowEngineContext,NocoBase"
---

# Context コンテキスト

NocoBase では、**コンテキスト（Context）** はプラグインコードと NocoBase の機能をつなぐ橋渡し役です。コンテキストを通じて、リクエスト送信、国際化、ログ出力、ページナビゲーションなどが行えます。

コンテキストには2つのアクセス方法があります：

- **Plugin 内**：`this.context`
- **React コンポーネント内**：`useFlowContext()`（`@nocobase/flow-engine` からインポート）

これら2つが返すのは**同一のオブジェクト**（`FlowEngineContext` インスタンス）であり、使用シーンが異なるだけです。

## Plugin 内での使用

プラグインの `load()` などのライフサイクルメソッド内で、`this.context` 経由でアクセスします：

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // this.context 経由でコンテキスト機能にアクセス
    const { api, logger } = this.context;

    const response = await api.request({ url: 'app:getInfo' });
    logger.info('アプリケーション情報', response.data);

    // 国際化：this.t() はプラグインのパッケージ名を namespace として自動注入
    console.log(this.t('Hello'));
  }
}
```

## コンポーネント内での使用

React コンポーネント内では、`useFlowContext()` で同じコンテキストオブジェクトを取得します：

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleClick = async () => {
    const response = await ctx.api.request({ url: 'users:list', method: 'get' });
    console.log(response.data);
  };

  return <button onClick={handleClick}>{ctx.t('Load data')}</button>;
}
```

## Plugin ショートカットプロパティ vs ctx プロパティ

Plugin クラスにはいくつかのショートカットプロパティがあり、`load()` 内で便利に使えます。ただし、**Plugin クラスのショートカットプロパティと ctx 上の同名プロパティが異なるものを指す場合がある**ので注意が必要です：

| Plugin ショートカットプロパティ | 指す先 | 用途 |
| --- | --- | --- |
| `this.router` | RouterManager | ルートの登録。`.add()` を使用 |
| `this.pluginSettingsManager` | PluginSettingsManager | プラグイン設定ページの登録（`addMenuItem` + `addPageTabItem`） |
| `this.flowEngine` | FlowEngine インスタンス | FlowModel の登録 |
| `this.t()` | i18n.t() + 自動 ns | 国際化。プラグインのパッケージ名を自動注入 |
| `this.context` | FlowEngineContext | コンテキストオブジェクト。useFlowContext() と同一 |

最も混乱しやすいのは `this.router` と `ctx.router` です：

- **`this.router`**（Plugin ショートカットプロパティ）→ RouterManager、**ルートの登録**に使用（`.add()`）
- **`ctx.router`**（コンテキストプロパティ）→ React Router インスタンス、**ページナビゲーション**に使用（`.navigate()`）

```ts
// Plugin 内：ルートの登録
async load() {
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });
}
```

```tsx
// コンポーネント内：ページナビゲーション
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

## コンテキストが提供する共通機能

ここでは主な機能を一覧にしますが、一部は Plugin でのみ利用可能、一部はコンポーネントでのみ利用可能、一部は両方で使えるが書き方が異なります。

| 機能       | Plugin（`this.xxx`）          | Component（`ctx.xxx`）       | 説明                              |
| ---------- | ----------------------------- | ---------------------------- | --------------------------------- |
| API リクエスト | `this.context.api`            | `ctx.api`                    | 使い方は同じ                      |
| 国際化     | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` はプラグインの namespace を自動注入 |
| ログ       | `this.context.logger`         | `ctx.logger`                 | 使い方は同じ                      |
| ルート登録 | `this.router.add()`           | -                            | Plugin のみ                       |
| ページ遷移 | -                             | `ctx.router.navigate()`      | コンポーネントのみ                |
| ルート情報 | `this.context.location`       | `ctx.route` / `ctx.location` | コンポーネント内での使用を推奨    |
| ビュー管理 | `this.context.viewer`         | `ctx.viewer`                 | ダイアログ / ドロワーを開くなど   |
| FlowEngine | `this.flowEngine`             | -                            | Plugin のみ                       |

各機能の詳しい使い方とコード例は[共通機能](./common-capabilities)をご覧ください。

## 関連リンク

- [共通機能](./common-capabilities) — ctx.api、ctx.t、ctx.logger などの詳しい使い方
- [Plugin プラグイン](../plugin) — プラグインエントリとショートカットプロパティ
- [Component コンポーネント開発](../component/index.md) — コンポーネントでの useFlowContext の基本的な使い方
