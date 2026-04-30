---
title: "Kapabilitas Umum"
description: "Kapabilitas umum Context client NocoBase: ctx.api request, ctx.t i18n, ctx.logger logging, ctx.router routing, ctx.viewer manajemen view, ctx.acl kontrol akses."
keywords: "ctx.api,ctx.t,ctx.i18n,ctx.logger,ctx.router,ctx.route,ctx.viewer,ctx.acl,NocoBase"
---

# Kapabilitas Umum

Object Context menyediakan berbagai kapabilitas built-in NocoBase. Namun beberapa kapabilitas hanya tersedia di Plugin, beberapa hanya tersedia di Component, dan beberapa tersedia di kedua sisi tetapi dengan cara penulisan yang berbeda. Mari kita lihat ringkasan terlebih dahulu:

| Kapabilitas | Plugin (`this.xxx`)           | Component (`ctx.xxx`)        | Penjelasan                              |
| ---------- | ----------------------------- | ---------------------------- | --------------------------------- |
| API Request | `this.context.api`            | `ctx.api`                    | Penggunaan sama                          |
| Internasionalisasi | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` otomatis menyuntikkan namespace plugin |
| Logging | `this.context.logger`         | `ctx.logger`                 | Penggunaan sama                          |
| Registrasi Route | `this.router.add()`           | -                            | Hanya Plugin                         |
| Navigasi Halaman | -                             | `ctx.router.navigate()`      | Hanya Component                            |
| Informasi Route | `this.context.location`       | `ctx.route` / `ctx.location` | Disarankan digunakan di Component                  |
| Manajemen View | `this.context.viewer`         | `ctx.viewer`                 | Membuka dialog / drawer, dll.                 |
| FlowEngine | `this.flowEngine`             | -                            | Hanya Plugin                         |

Selanjutnya, mari kita bahas satu per satu berdasarkan namespace.

## API Request (ctx.api)

Memanggil API backend melalui `ctx.api.request()`, dengan penggunaan yang konsisten dengan [Axios](https://axios-http.com/).

### Menggunakan di Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Kirim request langsung di load()
    const response = await this.context.api.request({
      url: 'app:getInfo',
      method: 'get',
    });
    console.log('Informasi aplikasi', response.data);
  }
}
```

### Menggunakan di Component

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    // GET request
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
    });
    console.log(response.data);

    // POST request
    await ctx.api.request({
      url: 'users:create',
      method: 'post',
      data: { name: 'Tao Tao' },
    });
  };

  return <button onClick={handleLoad}>Muat Data</button>;
}
```

### Berkombinasi dengan ahooks useRequest

Di Component, Anda dapat menggunakan `useRequest` dari [ahooks](https://ahooks.js.org/hooks/use-request/index) untuk menyederhanakan manajemen state request:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

export default function PostList() {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>Memuat...</div>;
  if (error) return <div>Request error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
}
```

### Request Interceptor

Melalui `ctx.api.axios` Anda dapat menambahkan request/response interceptor, biasanya diatur di `load()` Plugin:

```ts
async load() {
  // Request interceptor: menambahkan custom header
  this.context.api.axios.interceptors.request.use((config) => {
    config.headers['X-Custom-Header'] = 'my-value';
    return config;
  });

  // Response interceptor: penanganan error terpadu
  this.context.api.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Request error', error);
      return Promise.reject(error);
    },
  );
}
```

### Custom Header NocoBase

NocoBase Server mendukung custom header berikut, biasanya disuntikkan secara otomatis oleh interceptor, tidak perlu diatur secara manual:

| Header            | Penjelasan                              |
| ----------------- | --------------------------------- |
| `X-App`           | Menentukan aplikasi yang sedang diakses dalam skenario multi-app    |
| `X-Locale`        | Bahasa saat ini (misalnya `zh-CN`, `en-US`) |
| `X-Hostname`      | Hostname client                      |
| `X-Timezone`      | Timezone tempat client berada (misalnya `+08:00`)   |
| `X-Role`          | Role saat ini                          |
| `X-Authenticator` | Metode autentikasi user saat ini                      |

## Internasionalisasi (ctx.t / ctx.i18n)

Plugin NocoBase mengelola file multibahasa melalui direktori `src/locale/`, dan menggunakan terjemahan dalam code melalui `ctx.t()`.

### File Multibahasa

Buat file JSON berdasarkan bahasa di `src/locale/` plugin:

```bash
plugin-hello/
└── src/
    └── locale/
        ├── zh-CN.json
        └── en-US.json
```

```json
// zh-CN.json
{
  "Hello": "你好",
  "Your name is {{name}}": "你的名字是 {{name}}"
}
```

```json
// en-US.json
{
  "Hello": "Hello",
  "Your name is {{name}}": "Your name is {{name}}"
}
```

:::warning Perhatian

Pertama kali menambahkan file bahasa perlu restart aplikasi agar berlaku.

:::

### ctx.t()

Mendapatkan teks terjemahan di Component melalui `ctx.t()`:

```tsx
const ctx = useFlowContext();

// Penggunaan dasar
ctx.t('Hello');

// Dengan variabel
ctx.t('Your name is {{name}}', { name: 'NocoBase' });

// Menentukan namespace (namespace default adalah nama paket plugin)
ctx.t('Hello', { ns: '@my-project/plugin-hello' });
```

### this.t()

Di Plugin, lebih nyaman menggunakan `this.t()` — ini akan **menyuntikkan nama paket plugin sebagai namespace secara otomatis**, tidak perlu meneruskan `ns` secara manual:

```ts
class MyPlugin extends Plugin {
  async load() {
    // Otomatis menggunakan nama paket plugin saat ini sebagai ns
    console.log(this.t('Hello'));

    // Setara dengan
    console.log(this.context.t('Hello', { ns: '@my-project/plugin-hello' }));
  }
}
```

### ctx.i18n

`ctx.i18n` adalah instance [i18next](https://www.i18next.com/) tingkat rendah, biasanya menggunakan `ctx.t()` saja sudah cukup. Namun jika Anda perlu mengganti bahasa secara dinamis, mendengarkan perubahan bahasa, dll., Anda dapat menggunakan `ctx.i18n`:

```ts
// Mendapatkan bahasa saat ini
const currentLang = ctx.i18n.language; // 'zh-CN'

// Mendengarkan perubahan bahasa
ctx.i18n.on('languageChanged', (lng) => {
  console.log('Bahasa diubah ke', lng);
});
```

### tExpr()

`tExpr()` digunakan untuk menghasilkan string ekspresi terjemahan tertunda, biasanya digunakan di `FlowModel.define()` — karena define dieksekusi pada saat module loading, ketika instance i18n belum tersedia:

```ts
import { tExpr } from '@nocobase/flow-engine';

HelloBlockModel.define({
  label: tExpr('Hello block'), // Menghasilkan '{{t("Hello block")}}', diterjemahkan saat runtime
});
```

Untuk penggunaan internasionalisasi yang lebih lengkap (cara penulisan file terjemahan, hook useT, tExpr, dll.) lihat [i18n Internasionalisasi](../component/i18n). Untuk daftar lengkap kode bahasa yang didukung NocoBase lihat [Daftar Bahasa](../../languages).

## Logging (ctx.logger)

Output log terstruktur melalui `ctx.logger`, berbasis [pino](https://github.com/pinojs/pino).

### Menggunakan di Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.context.logger.info('Plugin selesai dimuat', { plugin: 'my-plugin' });
    this.context.logger.error('Inisialisasi gagal', { error });
  }
}
```

### Menggunakan di Component

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    ctx.logger.info('Halaman selesai dimuat', { page: 'UserList' });
    ctx.logger.debug('State user saat ini', { user });
  };

  // ...
}
```

Level log dari tertinggi ke terendah: `fatal` > `error` > `warn` > `info` > `debug` > `trace`. Hanya log dengan level lebih besar atau sama dengan level yang dikonfigurasi saat ini yang akan dioutput.

## Routing (ctx.router / ctx.route / ctx.location)

Kapabilitas terkait routing dibagi menjadi tiga bagian: registrasi (hanya Plugin), navigasi dan pengambilan informasi (hanya Component).

### Registrasi Route (this.router / this.pluginSettingsManager)

Daftarkan route halaman melalui `this.router.add()` di `load()` Plugin, dan daftarkan halaman pengaturan plugin melalui `this.pluginSettingsManager`:

```ts
async load() {
  // Mendaftarkan route halaman biasa
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // Mendaftarkan halaman pengaturan plugin (akan tampil di menu "Konfigurasi Plugin")
  this.pluginSettingsManager.addMenuItem({
    key: 'my-settings',
    title: this.t('My Settings'),
    icon: 'SettingOutlined', // Icon Ant Design, lihat https://5x.ant.design/components/icon
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'my-settings',
    key: 'index',
    title: this.t('My Settings'),
    componentLoader: () => import('./pages/MySettingsPage'),
  });
}
```

Untuk penggunaan detail lihat [Router](../router). Untuk contoh halaman pengaturan lengkap lihat [Membuat Halaman Pengaturan Plugin](../examples/settings-page).

:::warning Perhatian

`this.router` adalah RouterManager, digunakan untuk **mendaftarkan route**. `this.pluginSettingsManager` adalah PluginSettingsManager, digunakan untuk **mendaftarkan halaman pengaturan**. Keduanya berbeda dengan `ctx.router` di Component (React Router, digunakan untuk **navigasi halaman**).

:::

### Navigasi Halaman (ctx.router)

Di Component, lakukan navigasi halaman melalui `ctx.router.navigate()`:

```tsx
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

### Informasi Route (ctx.route)

Di Component, dapatkan informasi route saat ini melalui `ctx.route`:

```tsx
const ctx = useFlowContext();

// Mendapatkan parameter dinamis (misalnya route didefinisikan sebagai /users/:id)
const { id } = ctx.route.params;

// Mendapatkan nama route
const { name } = ctx.route;
```

Tipe lengkap `ctx.route`:

```ts
interface RouteOptions {
  name?: string;         // Identifier unik route
  path?: string;         // Template route
  pathname?: string;     // Path lengkap route
  params?: Record<string, any>; // Parameter route
}
```

### URL Saat Ini (ctx.location)

`ctx.location` menyediakan informasi detail URL saat ini, mirip dengan `window.location` di browser:

```tsx
const ctx = useFlowContext();

console.log(ctx.location.pathname); // '/v2/hello'
console.log(ctx.location.search);   // '?page=1'
console.log(ctx.location.hash);     // '#section'
```

Walaupun `ctx.route` dan `ctx.location` juga dapat diakses melalui `this.context` di Plugin, URL saat plugin dimuat tidak pasti, sehingga nilai yang didapat tidak bermakna. Disarankan menggunakannya di Component.

## Manajemen View (ctx.viewer / ctx.view)

`ctx.viewer` menyediakan kapabilitas imperatif untuk membuka dialog, drawer, dll. Tersedia di Plugin maupun Component.

### Menggunakan di Plugin

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Misalnya membuka dialog di logika inisialisasi tertentu
    this.context.viewer.dialog({
      title: 'Selamat Datang',
      content: () => <div>Plugin selesai diinisialisasi</div>,
    });
  }
}
```

### Menggunakan di Component

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const openDetail = () => {
    // Membuka dialog
    ctx.viewer.dialog({
      title: 'Edit User',
      content: () => <UserEditForm />,
    });
  };

  const openDrawer = () => {
    // Membuka drawer
    ctx.viewer.drawer({
      title: 'Detail',
      content: () => <UserDetail />,
    });
  };

  return (
    <div>
      <Button onClick={openDetail}>Edit</Button>
      <Button onClick={openDrawer}>Lihat Detail</Button>
    </div>
  );
}
```

### Method Umum

```tsx
// Tentukan tipe view melalui type
ctx.viewer.open({
  type: 'dialog',  // 'dialog' | 'drawer' | 'popover' | 'embed'
  title: 'Judul',
  content: () => <SomeComponent />,
});
```

### Operasi di Dalam View (ctx.view)

Di dalam Component dialog/drawer, Anda dapat menggunakan `ctx.view` untuk mengoperasikan view saat ini (misalnya menutupnya):

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

function DialogContent() {
  const ctx = useFlowContext();
  return (
    <div>
      <p>Konten dialog</p>
      <Button onClick={() => ctx.view.close()}>Tutup</Button>
    </div>
  );
}
```

## FlowEngine (this.flowEngine)

`this.flowEngine` adalah instance FlowEngine, hanya tersedia di Plugin. Biasanya digunakan untuk mendaftarkan FlowModel:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Mendaftarkan FlowModel (penulisan lazy loading direkomendasikan)
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

FlowModel adalah inti dari sistem konfigurasi visual NocoBase — jika Component Anda perlu muncul di menu "Tambah Block / Field / Action", maka perlu di-wrap dengan FlowModel. Untuk penggunaan detail lihat [FlowEngine](../flow-engine/index.md).

## Kapabilitas Lainnya

Kapabilitas berikut mungkin digunakan dalam skenario yang lebih lanjut, di sini hanya didaftar secara singkat:

| Properti                    | Penjelasan                                            |
| ----------------------- | ----------------------------------------------- |
| `ctx.model`             | Instance FlowModel saat ini (tersedia dalam Context eksekusi Flow) |
| `ctx.ref`               | Referensi Component, digunakan dengan `ctx.onRefReady`            |
| `ctx.exit()`            | Keluar dari eksekusi Flow saat ini                            |
| `ctx.defineProperty()`  | Menambahkan properti kustom secara dinamis ke Context                      |
| `ctx.defineMethod()`    | Menambahkan method kustom secara dinamis ke Context                      |
| `ctx.useResource()`     | Mendapatkan interface operasi resource data                            |
| `ctx.dataSourceManager` | Manajemen data source                                      |

Untuk penggunaan detail kapabilitas ini, lihat [Dokumentasi FlowEngine Lengkap](../../../flow-engine/index.md).

## Tautan Terkait

- [Ikhtisar Context](../ctx/index.md) — Persamaan dan perbedaan dua entry point Context
- [Plugin](../plugin) — Properti shortcut Plugin
- [Pengembangan Component](../component/index.md) — Penggunaan useFlowContext di Component
- [Router](../router) — Registrasi dan navigasi route
- [Dokumentasi FlowEngine Lengkap](../../../flow-engine/index.md) — Referensi FlowEngine lengkap
- [i18n Internasionalisasi](../component/i18n) — Cara penulisan file terjemahan, tExpr, useT
- [Daftar Bahasa](../../languages) — Kode bahasa yang didukung NocoBase
- [Membuat Halaman Pengaturan Plugin](../examples/settings-page) — Contoh penggunaan ctx.api lengkap
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel
