:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# プラグイン

NocoBaseでは、**クライアントプラグイン（Client Plugin）** がフロントエンドの機能を拡張し、カスタマイズするための主要な方法です。`@nocobase/client` が提供する `Plugin` 基底クラスを継承することで、開発者はさまざまなライフサイクル段階でロジックを登録したり、ページコンポーネントを追加したり、メニューを拡張したり、サードパーティ機能を統合したりできます。

## プラグインクラスの構造

最も基本的なクライアントプラグインの構造は以下のとおりです。

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // プラグインが追加された後に実行されます
    console.log('Plugin added');
  }

  async beforeLoad() {
    // プラグインがロードされる前に実行されます
    console.log('Before plugin load');
  }

  async load() {
    // プラグインがロードされるときに実行されます（ルーティングやUIコンポーネントの登録など）
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## ライフサイクルの説明

ブラウザのリフレッシュ時やアプリケーションの初期化時に、各プラグインは以下のライフサイクルを順に経ます。

| ライフサイクルメソッド | 実行タイミング | 説明 |
|--------------------|----------------|------|
| **afterAdd()**     | プラグインがプラグインマネージャーに追加された直後に実行されます | この時点ではプラグインインスタンスは作成されていますが、すべてのプラグインの初期化が完了しているわけではありません。設定の読み込みや基本的なイベントのバインディングなど、軽量な初期化に適しています。 |
| **beforeLoad()**   | すべてのプラグインの `load()` の前に実行されます | 有効化されているすべてのプラグインインスタンス（`this.app.pm.get()`）にアクセスできます。他のプラグインに依存する準備ロジックの実行に適しています。 |
| **load()**         | プラグインがロードされるときに実行されます | すべてのプラグインの `beforeLoad()` が完了した後にこのメソッドが実行されます。フロントエンドのルーティングやUIコンポーネントなどのコアロジックの登録に適しています。 |

## 実行順序

ブラウザがリフレッシュされるたびに、`afterAdd()` → `beforeLoad()` → `load()` の順で実行されます。

## プラグインコンテキストとFlowEngine

NocoBase 2.0 以降、クライアント側の拡張APIは主に **FlowEngine** に集約されています。プラグインクラス内では、`this.engine` を介してエンジンインスタンスを取得できます。

```ts
// `load()` メソッド内でエンジンコンテキストにアクセスします
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

詳細については、以下を参照してください。  
- [FlowEngine](/flow-engine)  
- [Context](./context.md)