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

`router.add()` を使って、通常のページルートを追加します。

```tsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

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

    this.router.add('root.home', { path: '/', element: <Home /> });
    this.router.add('root.about', { path: '/about', element: <About /> });
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

## **プラグイン**設定ページの拡張

`pluginSettingsRouter.add()` を使って、**プラグイン**設定ページを追加します。

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // 設定ページのタイトル
      icon: 'ApiOutlined', // 設定ページのメニューアイコン
      Component: HelloSettingPage,
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
      Component: Outlet,
    });

    // サブルート
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      Component: () => <div>Demo1 Page Content</div>,
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      Component: () => <div>Demo2 Page Content</div>,
    });
  }
}
```