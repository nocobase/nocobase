---
title: "FlowEngine dan Plugin"
description: "FlowEngine dan plugin: bagaimana plugin mendaftarkan FlowModel, memperluas kemampuan, integrasi dengan sistem plugin NocoBase, penggunaan registerFlowModel."
keywords: "FlowEngine,Plugin,registerFlowModel,Ekstensi plugin,Sistem plugin NocoBase,NocoBase"
---

# Hubungan antara FlowEngine dan Plugin

**FlowEngine** bukanlah plugin, melainkan disediakan sebagai **API kernel** untuk digunakan oleh plugin, untuk menghubungkan kemampuan kernel dengan ekstensi bisnis.
Pada NocoBase 2.0, semua API berkumpul di FlowEngine, dan plugin dapat mengakses FlowEngine melalui `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModelLoaders({ ... });
  }
}
```

## Context: Kemampuan Global yang Dikelola Secara Terpusat

FlowEngine menyediakan **Context** terpusat yang mengumpulkan berbagai API yang dibutuhkan untuk berbagai skenario, misalnya:

```ts
class PluginHello extends Plugin {
  async load() {
    // Ekstensi route
    this.engine.context.router;

    // Memulai request
    this.engine.context.api.request();

    // Terkait i18n
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Catatan**:
> Pada versi 2.0, Context menyelesaikan masalah berikut yang ada di 1.x:
>
> * Context yang tersebar, pemanggilan tidak terpadu
> * Context bisa hilang antara render tree React yang berbeda
> * Hanya dapat digunakan di dalam komponen React
>
> Detail lebih lanjut lihat **bab FlowContext**.

---

## Alias Pintas dalam Plugin

Untuk menyederhanakan pemanggilan, FlowEngine menyediakan beberapa alias pada instance plugin:

* `this.context` → setara dengan `this.engine.context`
* `this.router` → setara dengan `this.engine.context.router`

## Contoh: Memperluas Route

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// Digunakan untuk skenario contoh dan testing
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Pada contoh ini:

* Plugin memperluas route untuk path `/` melalui metode `this.router.add`;
* `createMockClient` menyediakan aplikasi Mock yang bersih, memudahkan untuk contoh dan testing;
* `app.getRootComponent()` mengembalikan komponen root, yang dapat langsung di-mount ke halaman.
