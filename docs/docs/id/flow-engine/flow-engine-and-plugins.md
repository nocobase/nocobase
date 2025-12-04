:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Hubungan antara FlowEngine dan Plugin

**FlowEngine** bukanlah sebuah plugin, melainkan sebuah **API inti** yang disediakan untuk digunakan oleh plugin, berfungsi untuk menghubungkan kapabilitas inti dengan ekstensi bisnis.
Di NocoBase 2.0, semua API terpusat di FlowEngine, dan plugin dapat mengakses FlowEngine melalui `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Kapabilitas Global yang Dikelola Secara Terpusat

FlowEngine menyediakan sebuah **Context** terpusat yang menyatukan API yang diperlukan untuk berbagai skenario, misalnya:

```ts
class PluginHello extends Plugin {
  async load() {
    // Ekstensi router
    this.engine.context.router;

    // Membuat permintaan
    this.engine.context.api.request();

    // Terkait internasionalisasi
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Catatan**:
> Context di versi 2.0 menyelesaikan masalah-masalah berikut dari versi 1.x:
>
> * Konteks yang tersebar, panggilan yang tidak konsisten
> * Konteks hilang di antara pohon render React yang berbeda
> * Hanya dapat digunakan di dalam komponen React
>
> Untuk detail lebih lanjut, lihat **bab FlowContext**.

---

## Alias Pintasan di Plugin

Untuk menyederhanakan panggilan, FlowEngine menyediakan beberapa alias pada instance plugin:

* `this.context` → setara dengan `this.engine.context`
* `this.router` → setara dengan `this.engine.context.router`

## Contoh: Memperluas Router

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

// Untuk skenario contoh dan pengujian
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Dalam contoh ini:

* Plugin memperluas rute untuk jalur `/` menggunakan metode `this.router.add`;
* `createMockClient` menyediakan aplikasi mock yang bersih untuk demonstrasi dan pengujian yang mudah;
* `app.getRootComponent()` mengembalikan komponen root, yang dapat langsung dipasang ke halaman.