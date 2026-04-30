---
title: "Context"
description: "Mekanisme konteks client NocoBase: this.context di Plugin dan useFlowContext() di Component adalah objek yang sama, entry akses berbeda."
keywords: "Context,konteks,useFlowContext,this.context,FlowEngineContext,NocoBase"
---

# Context

Di NocoBase, **Context (Konteks)** adalah jembatan yang menghubungkan kode plugin dengan kapabilitas NocoBase. Melalui konteks Anda dapat membuat request, melakukan internasionalisasi, menulis log, navigasi halaman, dll.

Konteks memiliki dua entry akses:

- **Di Plugin**: `this.context`
- **Di Component React**: `useFlowContext()` (di-import dari `@nocobase/flow-engine`)

Keduanya mengembalikan **objek yang sama** (instance `FlowEngineContext`), hanya skenario penggunaan yang berbeda.

## Penggunaan di Plugin

Di method siklus hidup `load()` plugin, dll., akses melalui `this.context`:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Mengakses kapabilitas konteks melalui this.context
    const { api, logger } = this.context;

    const response = await api.request({ url: 'app:getInfo' });
    logger.info('Info aplikasi', response.data);

    // Internasionalisasi: this.t() akan otomatis menyuntikkan nama paket plugin sebagai namespace
    console.log(this.t('Hello'));
  }
}
```

## Penggunaan di Component

Di Component React, dapatkan objek konteks yang sama melalui `useFlowContext()`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleClick = async () => {
    const response = await ctx.api.request({ url: 'users:list', method: 'get' });
    console.log(response.data);
  };

  return <button onClick={handleClick}>{ctx.t('Load data')}</button>;
}
```

## Property Shortcut Plugin vs Property ctx

Class Plugin menyediakan beberapa property shortcut, untuk memudahkan penggunaan di `load()`. Namun perlu diperhatikan, **beberapa property shortcut class Plugin dan property dengan nama yang sama di ctx mengarah ke hal yang berbeda**:

| Property Shortcut Plugin             | Mengarah ke                  | Tujuan                                 |
| --------------------------- | --------------------- | ------------------------------------ |
| `this.router`               | RouterManager         | Mendaftarkan route, gunakan `.add()`                |
| `this.pluginSettingsManager` | PluginSettingsManager | Mendaftarkan halaman konfigurasi plugin (`addMenuItem` + `addPageTabItem`) |
| `this.flowEngine`           | Instance FlowEngine       | Mendaftarkan FlowModel                       |
| `this.t()`                  | i18n.t() + ns otomatis    | Internasionalisasi, otomatis menyuntikkan nama paket plugin             |
| `this.context`              | FlowEngineContext     | Objek konteks, sama dengan useFlowContext() |

Yang paling mudah dibingungkan adalah `this.router` dan `ctx.router`:

- **`this.router`** (Property shortcut Plugin) → RouterManager, untuk **mendaftarkan route** (`.add()`)
- **`ctx.router`** (Property konteks) → Instance React Router, untuk **navigasi halaman** (`.navigate()`)

```ts
// Di Plugin: mendaftarkan route
async load() {
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });
}
```

```tsx
// Di Component: navigasi halaman
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

## Kapabilitas Umum yang Disediakan Konteks

Berikut adalah kapabilitas konteks umum, namun beberapa kapabilitas hanya tersedia di Plugin, beberapa hanya tersedia di Component, beberapa keduanya ada tetapi cara penulisan berbeda.

| Kapabilitas       | Plugin (`this.xxx`)          | Component (`ctx.xxx`)       | Penjelasan                              |
| ---------- | ----------------------------- | ---------------------------- | --------------------------------- |
| API Request   | `this.context.api`            | `ctx.api`                    | Penggunaan sama                          |
| Internasionalisasi     | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` otomatis menyuntikkan namespace plugin |
| Log       | `this.context.logger`         | `ctx.logger`                 | Penggunaan sama                          |
| Registrasi Route   | `this.router.add()`           | -                            | Hanya Plugin                         |
| Navigasi Halaman   | -                             | `ctx.router.navigate()`      | Hanya Component                            |
| Info Route   | `this.context.location`       | `ctx.route` / `ctx.location` | Disarankan digunakan di Component                  |
| Manajemen View   | `this.context.viewer`         | `ctx.viewer`                 | Membuka modal / drawer, dll.                 |
| FlowEngine | `this.flowEngine`             | -                            | Hanya Plugin                         |

Penggunaan detail dan contoh kode setiap kapabilitas lihat [Kapabilitas Umum](./common-capabilities).

## Tautan Terkait

- [Kapabilitas Umum](./common-capabilities) — Penggunaan detail ctx.api, ctx.t, ctx.logger, dll.
- [Plugin](../plugin) — Entry plugin dan property shortcut
- [Pengembangan Component](../component/index.md) — Penggunaan dasar useFlowContext di Component
