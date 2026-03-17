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

Tambahkan rute halaman biasa melalui `router.add()`. Untuk komponen halaman, gunakan `componentLoader` agar modul halaman baru dimuat saat rute tersebut benar-benar dikunjungi.

Berkas halaman harus menggunakan `export default`:

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
      // Impor dinamis: modul halaman baru dimuat saat rute ini benar-benar dimasuki
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

Mendukung parameter dinamis

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Jika halaman cukup berat atau tidak dibutuhkan pada render pertama, prioritaskan `componentLoader`; `element` tetap cocok untuk rute layout atau halaman inline yang sangat ringan.

## Perluasan Halaman Pengaturan Plugin

Tambahkan halaman pengaturan plugin melalui `pluginSettingsRouter.add()`. Seperti rute halaman biasa, halaman pengaturan juga sebaiknya menggunakan `componentLoader`.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Judul halaman pengaturan
      icon: 'ApiOutlined', // Ikon menu halaman pengaturan
      // Impor dinamis: modul halaman baru dimuat saat halaman pengaturan ini benar-benar dimasuki
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Rute anak
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Impor dinamis: modul halaman baru dimuat saat halaman pengaturan ini benar-benar dimasuki
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```