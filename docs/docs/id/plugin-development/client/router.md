---
title: "Router"
description: "Route client NocoBase: registrasi route halaman this.router.add, registrasi halaman pengaturan plugin pluginSettingsManager (addMenuItem + addPageTabItem)."
keywords: "Router,route,router.add,pluginSettingsManager,addMenuItem,addPageTabItem,componentLoader,registrasi halaman,NocoBase"
---

# Router

Di NocoBase, plugin mendaftarkan halaman melalui route. Dua cara umum:

- `this.router.add()` — Mendaftarkan route halaman biasa
- `this.pluginSettingsManager.addMenuItem()` + `addPageTabItem()` — Mendaftarkan halaman pengaturan plugin

Registrasi route biasanya dilakukan dalam method `load()` plugin, lihat [Plugin](./plugin).

:::warning Perhatian

Plugin NocoBase v2, route yang didaftarkan secara default akan memiliki prefix `/v2`, perlu menyertakan prefix ini saat diakses.

:::

## Route Default

NocoBase telah mendaftarkan route default berikut:

| Nama           | Path                  | Component                | Penjelasan           |
| -------------- | --------------------- | ------------------- | -------------- |
| admin          | /v2/admin/\*          | AdminLayout         | Halaman admin   |
| admin.page     | /v2/admin/:name       | AdminDynamicPage    | Halaman yang dibuat dinamis |
| admin.settings | /v2/admin/settings/\* | AdminSettingsLayout | Halaman konfigurasi plugin   |

## Route Halaman

Mendaftarkan route halaman melalui `this.router.add()`. Disarankan menggunakan `componentLoader` untuk loading sesuai kebutuhan, sehingga kode halaman akan dimuat hanya saat benar-benar diakses.

:::warning Perhatian

File halaman harus menggunakan `export default` untuk mengekspor Component.

:::

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Mendaftarkan dalam `load()` plugin:

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/hello',
      // Loading sesuai kebutuhan, modul ini dimuat saat mengakses /v2/hello
      componentLoader: () => import('./pages/HelloPage'),
    });
  }
}
```

Parameter pertama `router.add()` adalah nama route, mendukung penggunaan titik `.` untuk merepresentasikan hubungan parent-child. Misalnya `root.home` merepresentasikan child route dari `root`.

Dalam Component, dapat menggunakan `ctx.router.navigate('/hello')` untuk navigasi ke route ini.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { Button } from 'antd';

export default function SomeComponent() {
  const ctx = useFlowContext();
  return (
    <Button onClick={() => ctx.router.navigate('/hello')}>
      Go to Hello Page
    </Button>
  );
}
```

Untuk detail dapat merujuk ke bagian routing di [Pengembangan Component](./component/index.md).

### Nested Route

Implementasi nesting melalui penamaan dengan titik, parent route menggunakan `<Outlet />` untuk merender konten child route:

```tsx
import { Outlet } from 'react-router-dom';

class MyPlugin extends Plugin {
  async load() {
    // Parent route, menggunakan element untuk langsung menulis layout
    this.router.add('root', {
      element: (
        <div>
          <nav>Navigation Bar</nav>
          <Outlet />
        </div>
      ),
    });

    // Child route, menggunakan componentLoader untuk loading sesuai kebutuhan
    this.router.add('root.home', {
      path: '/', // -> /v2/
      componentLoader: () => import('./pages/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about', // -> /v2/about
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}
```

### Parameter Dinamis

Path route mendukung parameter dinamis:

```tsx
this.router.add('root.user', {
  path: '/user/:id', // -> /v2/user/:id
  componentLoader: () => import('./pages/UserPage'),
});
```

Dalam Component, dapat memperoleh parameter dinamis melalui `ctx.route.params`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function UserPage() {
  const ctx = useFlowContext();
  const { id } = ctx.route.params; // Memperoleh parameter dinamis id
  return <h1>User ID: {id}</h1>;
}
```

Untuk detail dapat merujuk ke bagian routing di [Pengembangan Component](./component/index.md).

### componentLoader vs element

- **`componentLoader`** (Direkomendasikan): Loading sesuai kebutuhan, cocok untuk Component halaman, file halaman perlu `export default`
- **`element`**: Langsung memasukkan JSX, cocok untuk Component layout atau halaman inline yang sangat ringan

Jika halaman itu sendiri memiliki dependensi yang berat, disarankan untuk memprioritaskan penggunaan `componentLoader`.

## Halaman Pengaturan Plugin

Mendaftarkan halaman pengaturan plugin melalui `this.pluginSettingsManager`. Registrasi dibagi menjadi dua langkah — pertama gunakan `addMenuItem()` untuk mendaftarkan menu entry, lalu gunakan `addPageTabItem()` untuk mendaftarkan halaman aktual. Halaman pengaturan akan muncul di menu "Konfigurasi Plugin" NocoBase.

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Mendaftarkan menu entry
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello Settings'),
      icon: 'ApiOutlined', // Nama icon Ant Design, referensi https://5x.ant.design/components/icon
    });

    // Mendaftarkan halaman (saat key adalah 'index' di-map ke path root menu)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Hello Settings'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

Setelah didaftarkan, path akses adalah `/admin/settings/hello`. Saat hanya ada satu halaman di bawah menu, tab bar atas akan otomatis tersembunyi.

### Halaman Pengaturan Multi-Tab

Jika halaman pengaturan memerlukan beberapa sub-halaman, daftarkan beberapa `addPageTabItem` untuk `menuKey` yang sama — tab bar akan otomatis muncul di bagian atas:

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Mendaftarkan menu entry
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    // Tab 1: Pengaturan Dasar (key adalah 'index', di-map ke /admin/settings/hello)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Basic Settings'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    // Tab 2: Pengaturan Lanjutan (di-map ke /admin/settings/hello/advanced)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('Advanced Settings'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```

### Parameter addMenuItem

| Field       | Tipe                  | Wajib | Penjelasan                                             |
| ---------- | --------------------- | ---- | ------------------------------------------------ |
| `key`      | `string`              | Ya   | Identifier unik menu, tidak boleh mengandung `.`                       |
| `title`    | `ReactNode`           | Tidak   | Judul menu                                         |
| `icon`     | `string \| ReactNode` | Tidak   | Icon menu, saat string akan dirender sebagai `Icon` bawaan             |
| `sort`     | `number`              | Tidak   | Nilai sorting, semakin kecil semakin di depan, default `0`                     |
| `showTabs` | `boolean`             | Tidak   | Apakah menampilkan tab bar atas, default ditentukan otomatis berdasarkan jumlah halaman      |
| `hidden`   | `boolean`             | Tidak   | Apakah menyembunyikan navigation entry                                 |

### Parameter addPageTabItem

| Field              | Tipe        | Wajib | Penjelasan                                                        |
| ----------------- | ----------- | ---- | ----------------------------------------------------------- |
| `menuKey`         | `string`    | Ya   | `key` menu yang dimiliki, sesuai dengan `key` `addMenuItem`               |
| `key`             | `string`    | Ya   | Identifier unik halaman. `'index'` merepresentasikan halaman default, di-map ke path root menu      |
| `title`           | `ReactNode` | Tidak   | Judul halaman (ditampilkan pada tab)                                   |
| `componentLoader` | `Function`  | Tidak   | Lazy loading Component halaman (Direkomendasikan)                                      |
| `Component`       | `Component` | Tidak   | Langsung memasukkan Component (alternatif untuk `componentLoader`)                 |
| `sort`            | `number`    | Tidak   | Nilai sorting, semakin kecil semakin di depan                                          |
| `hidden`          | `boolean`   | Tidak   | Apakah disembunyikan di tab                                           |
| `link`            | `string`    | Tidak   | Link eksternal, setelah diset klik tab akan redirect ke alamat eksternal                   |

## Tautan Terkait

- [Plugin](./plugin) — Route didaftarkan dalam `load()`
- [Pengembangan Component](./component/index.md) — Cara menulis Component halaman yang di-mount oleh route
- [Contoh Praktis Plugin: Membuat Halaman Pengaturan Plugin](./examples/settings-page) — Contoh halaman pengaturan lengkap
