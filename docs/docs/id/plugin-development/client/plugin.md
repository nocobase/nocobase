---
title: "Plugin Client"
description: "Entry plugin client NocoBase: extends class Plugin, siklus hidup afterAdd/beforeLoad/load, registrasi route dan FlowModel."
keywords: "Plugin,plugin client,siklus hidup,afterAdd,beforeLoad,load,NocoBase"
---

# Plugin

Di NocoBase, **Plugin Client** adalah cara utama untuk memperluas dan menyesuaikan fungsi front-end. Anda dapat extends class dasar `Plugin` yang disediakan oleh `@nocobase/client-v2` di `src/client-v2/plugin.tsx` direktori plugin Anda, kemudian mendaftarkan route, model, dan resource lainnya dalam siklus hidup `load()`, dll.

Sebagian besar waktu Anda hanya perlu peduli pada `load()` — biasanya logika inti didaftarkan pada tahap `load()`.

:::tip Prasyarat

Sebelum mengembangkan plugin client, harap pastikan Anda telah membaca bab [Menulis Plugin Pertama](../write-your-first-plugin.md), dan telah menggenerate struktur direktori dan file plugin dasar.

:::

## Struktur Dasar

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Dieksekusi setelah plugin ditambahkan
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Dieksekusi sebelum load() semua plugin
    console.log('Before load');
  }

  async load() {
    // Dieksekusi saat plugin dimuat, mendaftarkan route, model, dll.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Siklus Hidup

Setiap kali browser di-refresh atau aplikasi diinisialisasi, plugin akan mengeksekusi `afterAdd()` → `beforeLoad()` → `load()` secara berurutan:

| Method           | Waktu Eksekusi                       | Penjelasan                                                                        |
| -------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `afterAdd()`   | Setelah instance plugin dibuat                 | Pada saat ini belum semua plugin selesai diinisialisasi. Cocok untuk inisialisasi ringan, seperti membaca konfigurasi.            |
| `beforeLoad()` | Sebelum `load()` semua plugin       | Dapat mengakses instance plugin lain yang sudah aktif melalui `this.app.pm.get()`. Cocok untuk menangani dependensi antar plugin. |
| `load()`       | Setelah semua `beforeLoad()` selesai dieksekusi | **Siklus hidup yang paling sering digunakan.** Mendaftarkan route, FlowModel, dan resource inti lainnya di sini.               |

Biasanya, mengembangkan plugin client cukup menulis `load()` saja.

## Apa yang Dilakukan di load()

`load()` adalah entry point inti untuk mendaftarkan fungsi plugin. Operasi umum:

**Mendaftarkan Route Halaman:**

```ts
async load() {
  // Mendaftarkan halaman independen
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // Mendaftarkan halaman pengaturan plugin (menu + halaman)
  this.pluginSettingsManager.addMenuItem({
    key: 'hello-settings',
    title: this.t('Hello Settings'),
    icon: 'SettingOutlined',
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'hello-settings',
    key: 'index',
    title: this.t('Hello Settings'),
    componentLoader: () => import('./pages/HelloSettingPage'),
  });
}
```

Untuk penggunaan detail lihat [Router](./router).

**Mendaftarkan FlowModel:**

```ts
async load() {
  this.flowEngine.registerModelLoaders({
    HelloModel: {
      // Dynamic import, modul yang sesuai akan dimuat saat model ini benar-benar digunakan pertama kali
      loader: () => import('./HelloModel'),
    },
  });
}
```

`registerModelLoaders` menggunakan loading sesuai kebutuhan (dynamic import), modul akan dimuat hanya saat model digunakan pertama kali, ini adalah cara registrasi yang direkomendasikan. Untuk penggunaan detail lihat [FlowEngine](./flow-engine/index.md).

## Property Umum Plugin

Dalam class plugin, property berikut dapat langsung diakses melalui `this`:

| Property                        | Penjelasan                                                     |
| --------------------------- | -------------------------------------------------------- |
| `this.router`               | Manajer route, untuk mendaftarkan route halaman                             |
| `this.pluginSettingsManager` | Manajer halaman pengaturan plugin (`addMenuItem` + `addPageTabItem`)      |
| `this.flowEngine`           | Instance FlowEngine, untuk mendaftarkan FlowModel                      |
| `this.engine`               | Alias untuk `this.flowEngine`                                 |
| `this.context`              | Objek konteks, mengembalikan objek yang sama dengan `useFlowContext()` di Component  |
| `this.app`                  | Instance Application                                         |
| `this.app.eventBus`         | Event bus level aplikasi (`EventTarget`), untuk listen event siklus hidup     |

Jika perlu mengakses lebih banyak kapabilitas NocoBase (seperti `api`, `t`(i18n), `logger`), dapat diperoleh melalui `this.context`:

```ts
async load() {
  const { api, t, logger } = this.context;
}
```

Untuk lebih banyak kapabilitas konteks lihat [Context](./ctx/index.md).

## Tautan Terkait

- [Router](./router) — Mendaftarkan route halaman dan halaman pengaturan plugin
- [Pengembangan Component](./component/index.md) — Cara menulis Component React yang di-mount oleh route
- [Context](./ctx/index.md) — Menggunakan kapabilitas bawaan NocoBase melalui konteks
- [FlowEngine](./flow-engine/index.md) — Mendaftarkan Block, Field, Action, dan Component konfigurasi visual lainnya
- [Menulis Plugin Pertama](../write-your-first-plugin.md) — Membuat plugin dari nol
