:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Router

Klien NocoBase menyediakan pengelola router yang fleksibel, yang mendukung perluasan halaman dan halaman pengaturan plugin melalui `router.add()` dan `pluginSettingsRouter.add()`.

## Rute Halaman Default yang Terdaftar

| Nama           | Jalur              | Komponen            | Deskripsi                 |
| -------------- | ----------------- | ------------------- | ------------------------- |
| admin          | /admin/\*         | AdminLayout         | Halaman admin             |
| admin.page     | /admin/:name      | AdminDynamicPage    | Halaman yang dibuat secara dinamis |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Halaman pengaturan plugin |

## Perluasan Halaman Reguler

Tambahkan rute halaman reguler melalui `router.add()`.

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

Mendukung parameter dinamis

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Perluasan Halaman Pengaturan Plugin

Tambahkan halaman pengaturan plugin melalui `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Judul halaman pengaturan
      icon: 'ApiOutlined', // Ikon menu halaman pengaturan
      Component: HelloSettingPage,
    });
  }
}
```

Contoh routing multi-level

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Rute tingkat atas
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Rute anak
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