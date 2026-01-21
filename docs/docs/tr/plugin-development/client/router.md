:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Yönlendirici (Router)

NocoBase istemcisi, `router.add()` ve `pluginSettingsRouter.add()` metotları aracılığıyla sayfaları ve eklenti ayar sayfalarını genişletmeyi destekleyen esnek bir yönlendirici yöneticisi sunar.

## Kayıtlı Varsayılan Sayfa Yönlendirmeleri

| Ad             | Yol                | Bileşen             | Açıklama                      |
| :------------- | :----------------- | :------------------ | :---------------------------- |
| admin          | /admin/\*          | AdminLayout         | Yönetim sayfaları             |
| admin.page     | /admin/:name       | AdminDynamicPage    | Dinamik olarak oluşturulan sayfalar |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Eklenti ayar sayfaları        |

## Normal Sayfa Genişletme

`router.add()` metodu aracılığıyla normal sayfa yönlendirmeleri ekleyebilirsiniz.

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

Dinamik parametreleri destekler

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Eklenti Ayar Sayfası Genişletme

`pluginSettingsRouter.add()` metodu aracılığıyla eklenti ayar sayfaları ekleyebilirsiniz.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Ayar sayfası başlığı
      icon: 'ApiOutlined', // Ayar sayfası menü simgesi
      Component: HelloSettingPage,
    });
  }
}
```

Çok Katmanlı Yönlendirme Örneği

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Üst düzey yönlendirme
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Alt yönlendirmeler
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