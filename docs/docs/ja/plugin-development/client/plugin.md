---
title: "Plugin クライアントプラグイン"
description: "NocoBase クライアントプラグインの入口：Plugin 基底クラスの継承、afterAdd/beforeLoad/load ライフサイクル、ルーティングと FlowModel の登録。"
keywords: "Plugin,クライアントプラグイン,ライフサイクル,afterAdd,beforeLoad,load,NocoBase"
---

# Plugin プラグイン

NocoBase では、**クライアントプラグイン（Client Plugin）** がフロントエンド機能を拡張・カスタマイズするための主要な手段です。プラグインディレクトリの `src/client-v2/plugin.tsx` で `@nocobase/client-v2` が提供する `Plugin` 基底クラスを継承し、`load()` などのライフサイクルでルーティングやモデルなどのリソースを登録します。

ほとんどの場合、`load()` だけを意識すれば十分です。通常、コアロジックは `load()` フェーズで登録します。

:::tip 前提条件

クライアントプラグインの開発を始める前に、[最初のプラグインを作成する](../write-your-first-plugin.md) のセクションを読み、基本的なプラグインのディレクトリ構造とファイルを生成済みであることを確認してください。

:::

## 基本構造

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // プラグインが追加された後に実行
    console.log('Plugin added');
  }

  async beforeLoad() {
    // すべてのプラグインの load() の前に実行
    console.log('Before load');
  }

  async load() {
    // プラグインの読み込み時に実行、ルーティングやモデルなどを登録
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## ライフサイクル

ブラウザのリフレッシュやアプリケーションの初期化のたびに、プラグインは `afterAdd()` → `beforeLoad()` → `load()` の順で実行されます。

| メソッド           | 実行タイミング                       | 説明                                                                        |
| -------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `afterAdd()`   | プラグインインスタンスの作成後                 | この時点ではすべてのプラグインの初期化が完了しているわけではありません。設定の読み込みなど、軽量な初期化に適しています。            |
| `beforeLoad()` | すべてのプラグインの `load()` の前       | `this.app.pm.get()` で他の有効なプラグインインスタンスにアクセスできます。プラグイン間の依存処理に適しています。 |
| `load()`       | すべての `beforeLoad()` 完了後 | **最もよく使うライフサイクルです。** ここでルーティングや FlowModel などのコアリソースを登録します。               |

通常、クライアントプラグインの開発では `load()` を書くだけで十分です。

## load() で行うこと

`load()` はプラグイン機能を登録するためのコアエントリポイントです。よくある操作を紹介します。

**ページルーティングの登録：**

```ts
async load() {
  // 独立したページを登録
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // プラグイン設定ページを登録（メニュー + ページ）
  this.pluginSettingsManager.addMenuItem({
    key: 'hello-settings',
    title: this.t('Hello 設定'),
    icon: 'SettingOutlined',
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'hello-settings',
    key: 'index',
    title: this.t('Hello 設定'),
    componentLoader: () => import('./pages/HelloSettingPage'),
  });
}
```

詳しい使い方は [Router ルーティング](./router) を参照してください。

**FlowModel の登録：**

```ts
async load() {
  this.flowEngine.registerModelLoaders({
    HelloModel: {
      // 動的インポート、このモデルが初めて使用される時に対応するモジュールが読み込まれます
      loader: () => import('./HelloModel'),
    },
  });
}
```

`registerModelLoaders` は遅延読み込み（動的インポート）を使用しており、モデルが初めて使用されるときに対応するモジュールが読み込まれます。これが推奨される登録方法です。詳しい使い方は [FlowEngine](./flow-engine/index.md) を参照してください。

## プラグインの主要プロパティ

プラグインクラス内で、以下のプロパティに `this` からアクセスできます。

| プロパティ                        | 説明                                                     |
| --------------------------- | -------------------------------------------------------- |
| `this.router`               | ルーティングマネージャー、ページルーティングの登録に使用                             |
| `this.pluginSettingsManager` | プラグイン設定ページマネージャー（`addMenuItem` + `addPageTabItem`）      |
| `this.flowEngine`           | FlowEngine インスタンス、FlowModel の登録に使用                      |
| `this.engine`               | `this.flowEngine` のエイリアス                                 |
| `this.context`              | コンテキストオブジェクト、コンポーネントの `useFlowContext()` と同じオブジェクトを返します  |
| `this.app`                  | Application インスタンス                                         |
| `this.app.eventBus`         | アプリケーションレベルのイベントバス（`EventTarget`）、ライフサイクルイベントの監視に使用     |

NocoBase のさらなる機能（`api`、`t`(i18n)、`logger` など）にアクセスする必要がある場合は、`this.context` から取得できます。

```ts
async load() {
  const { api, t, logger } = this.context;
}
```

その他のコンテキスト機能については [Context コンテキスト](./ctx/index.md) を参照してください。

## 関連リンク

- [Router ルーティング](./router) — ページルーティングとプラグイン設定ページの登録
- [Component コンポーネント開発](./component/index.md) — ルーティングにマウントする React コンポーネントの書き方
- [Context コンテキスト](./ctx/index.md) — コンテキストを通じた NocoBase 組み込み機能の利用
- [FlowEngine](./flow-engine/index.md) — ブロック、フィールド、アクションなどビジュアル設定コンポーネントの登録
- [最初のプラグインを作成する](../write-your-first-plugin.md) — ゼロからプラグインを作成
