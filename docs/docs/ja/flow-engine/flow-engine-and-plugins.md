:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# FlowEngine とプラグインの関係

**FlowEngine** はプラグインではなく、**コアAPI**としてプラグインに提供され、コア機能とビジネス拡張を連携させる役割を担います。
NocoBase 2.0では、すべてのAPIがFlowEngineに集約されており、プラグインは`this.engine`を通じてFlowEngineにアクセスできます。

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context：集中管理されたグローバル機能

FlowEngineは、さまざまなシナリオで必要となるAPIを一つにまとめた、集中管理型の**Context**を提供します。例えば、次のように利用できます。

```ts
class PluginHello extends Plugin {
  async load() {
    // ルーティングの拡張
    this.engine.context.router;

    // リクエストの送信
    this.engine.context.api.request();

    // 国際化（i18n）関連
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **注記**：
> Contextは、2.0で1.xの以下の問題を解決しました。
>
> *   コンテキストが分散しており、呼び出しが一貫していなかった
> *   異なるReactレンダリングツリー間でコンテキストが失われていた
> *   Reactコンポーネント内でのみ使用可能だった
>
> 詳細については、**FlowContextの章**をご覧ください。

## プラグインにおけるショートカットエイリアス

呼び出しを簡素化するため、FlowEngineはプラグインインスタンスにいくつかのエイリアスを提供しています。

*   `this.context` → `this.engine.context`と同等
*   `this.router` → `this.engine.context.router`と同等

## 示例：ルーティングの拡張

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// サンプルおよびテストシナリオ用
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

この例では：

*   プラグインが`this.router.add`メソッドを使って`/`パスのルーティングを拡張しています。
*   `createMockClient`は、サンプルやテストを容易にするためのクリーンなモックアプリケーションを提供します。
*   `app.getRootComponent()`はルートコンポーネントを返し、これを直接ページにマウントできます。