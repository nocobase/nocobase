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

`router.add()` ile normal sayfa rotaları ekleyin. Sayfa bileşenleri için `componentLoader` kullanın; böylece sayfa modülü yalnızca ilgili rotaya gerçekten girildiğinde yüklenir.

Sayfa dosyaları `export default` kullanmalıdır:

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
      // Dinamik içe aktarma: sayfa modülü yalnızca bu rotaya girildiğinde yüklenir
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

Dinamik parametreleri destekler

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Sayfa ağırsa veya ilk render sırasında gerekli değilse `componentLoader` tercih edilmelidir; `element` ise düzen rotaları veya çok hafif satır içi sayfalar için hâlâ uygundur.

## Eklenti Ayar Sayfası Genişletme

`pluginSettingsRouter.add()` ile eklenti ayar sayfaları ekleyin. Normal sayfa rotalarında olduğu gibi ayar sayfalarında da `componentLoader` kullanılmalıdır.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Ayar sayfası başlığı
      icon: 'ApiOutlined', // Ayar sayfası menü simgesi
      // Dinamik içe aktarma: sayfa modülü yalnızca bu ayar sayfasına girildiğinde yüklenir
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Alt yönlendirmeler
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Dinamik içe aktarma: sayfa modülü yalnızca bu ayar sayfasına girildiğinde yüklenir
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```