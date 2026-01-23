:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# createMockClient

サンプルやテストを行う際には、`createMockClient` を使ってモックアプリケーションを素早く構築することが一般的に推奨されています。モックアプリケーションは、どのプラグインも有効化されていないクリーンな空のアプリケーションで、サンプルとテストのためだけに利用されます。

例えば、以下のサンプルコードをご覧ください。

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// サンプルやテストのシナリオ向け
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` は `apiMock` を提供しており、モックのAPIデータを構築できます。

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    const { data } = await this.context.api.request({
      method: 'get',
      url: 'users',
    });
  }
}

// サンプルやテストのシナリオ向け
const app = createMockClient({
  plugins: [PluginHelloModel],
});

app.apiMock.onGet('users').reply(200, {
  data: {
    id: 1,
    name: 'John Doe',
  },
});

export default app.getRootComponent();
```

`createMockClient` を利用することで、プラグインを通じて機能を素早く拡張できます。`Plugin` でよく使われるAPIには、以下のようなものがあります。

- `plugin.router`: ルートを拡張します
- `plugin.engine`: フロントエンドエンジン（NocoBase 2.0）
- `plugin.context`: コンテキスト（NocoBase 2.0）

サンプル1：`router` を使ってルートを追加します。

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

// サンプルやテストのシナリオ向け
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

詳細については、今後の章でご紹介します。