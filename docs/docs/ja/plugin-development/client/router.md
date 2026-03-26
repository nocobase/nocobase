:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ルーター

NocoBase クライアントは、柔軟なルーターマネージャーを提供しています。`router.add()` や `pluginSettingsRouter.add()` を使うことで、ページや**プラグイン**の設定ページを拡張できます。

## デフォルトで登録されているページルート

| 名前           | パス               | コンポーネント            | 説明           |
| -------------- | ------------------ | ------------------- |--------------|
| admin          | /admin/\*          | AdminLayout         | 管理画面のページ    |
| admin.page     | /admin/:name       | AdminDynamicPage    | 動的に作成されるページ |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | **プラグイン**の設定ページ |

## 通常ページの拡張

`router.add()` を使って通常のページルートを追加します。ページコンポーネントには `componentLoader` を使用し、実際にそのルートへ入ったときにだけページモジュールが読み込まれるようにします。

ページファイルでは `export default` を使用する必要があります。

```tsx
// routes/HomePage.tsx
export default function HomePage() {
  return <h1>Home</h1>;
}
```

```tsx
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Layout = () => (
  <div>
    <div>
      <Link to="/">Home</Link> | <Link to="/about">About</Link>
    </div>
    <Outlet />
  </div>
);

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', { element: <Layout /> });

    this.router.add('root.home', {
      path: '/',
      // 動的インポート: このルートに入ったときにのみページモジュールを読み込みます
      componentLoader: () => import('./routes/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about',
      componentLoader: () => import('./routes/AboutPage'),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin]
});

export default app.getRootComponent();
```

動的パラメーターのサポート

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

ページが重い、または初回レンダリング時に不要な場合は、`componentLoader` を優先してください。`element` はレイアウトルートや非常に軽量なインラインページに引き続き適しています。

## **プラグイン**設定ページの拡張

`pluginSettingsRouter.add()` を使ってプラグイン設定ページを追加します。通常のページルートと同様に、設定ページでも `componentLoader` を使用してください。

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // 設定ページのタイトル
      icon: 'ApiOutlined', // 設定ページのメニューアイコン
      // 動的インポート: この設定ページに入ったときにのみページモジュールを読み込みます
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

多階層ルーターの例

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // トップレベルルート
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      element: <Outlet />,
    });

    // サブルート
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // 動的インポート: この設定ページに入ったときにのみページモジュールを読み込みます
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```