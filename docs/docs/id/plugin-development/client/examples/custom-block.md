---
title: "Membuat Block Tampilan Kustom"
description: "Praktik plugin NocoBase: membuat Block tampilan HTML yang dapat dikonfigurasi dengan BlockModel + registerFlow + uiSchema."
keywords: "Block Kustom,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# Membuat Block Tampilan Kustom

Di NocoBase, Block adalah area konten di halaman. Contoh ini menunjukkan cara membuat Block kustom yang paling sederhana dengan `BlockModel` — mendukung pengeditan konten HTML di antarmuka, di mana user dapat memodifikasi konten yang ditampilkan Block melalui panel konfigurasi.

Ini adalah contoh pertama yang melibatkan FlowEngine, akan menggunakan `BlockModel`, `renderComponent`, `registerFlow`, dan `uiSchema`.

:::tip Bacaan Pendahuluan

Disarankan memahami konten berikut terlebih dahulu agar pengembangan lebih lancar:

- [Menulis Plugin Pertama Anda](../../write-your-first-plugin) — Pembuatan plugin dan struktur direktori
- [Plugin](../plugin) — Entry point Plugin dan lifecycle `load()`
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel, renderComponent, registerFlow
- [i18n Internasionalisasi](../component/i18n) — Cara menulis file terjemahan dan penggunaan terjemahan tertunda `tExpr()`

:::

## Hasil Akhir

Yang akan kita buat adalah Block "Simple block":

- Muncul di menu "Tambah Block"
- Merender konten HTML yang dikonfigurasi user
- Memungkinkan user mengedit HTML melalui panel konfigurasi (registerFlow + uiSchema)

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

Source code lengkap lihat [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block). Jika Anda ingin langsung menjalankannya secara lokal untuk melihat hasilnya:

```bash
yarn pm enable @nocobase-example/plugin-simple-block
```

Berikutnya, mari kita bangun plugin ini dari nol, langkah demi langkah.

## Langkah 1: Membuat Skeleton Plugin

Eksekusi di direktori root repository:

```bash
yarn pm create @my-project/plugin-simple-block
```

Ini akan menghasilkan struktur file dasar di `packages/plugins/@my-project/plugin-simple-block`. Untuk penjelasan detail lihat [Menulis Plugin Pertama Anda](../../write-your-first-plugin).

## Langkah 2: Membuat Model Block

Buat `src/client-v2/models/SimpleBlockModel.tsx`. Ini adalah inti dari seluruh plugin — mendefinisikan bagaimana Block dirender dan dikonfigurasi.

```tsx
// src/client-v2/models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

// Mengatur nama tampilan Block di menu "Tambah Block"
SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

// Mendaftarkan panel konfigurasi, memungkinkan user mengedit konten HTML
SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // Dieksekusi sebelum render
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema mendefinisikan UI form panel konfigurasi
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Nilai default panel konfigurasi
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // Menulis nilai panel konfigurasi ke props model
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Beberapa poin penting:

- **`renderComponent()`** — Merender UI Block, membaca konten HTML melalui `this.props.html`
- **`define()`** — Mengatur nama tampilan Block di menu "Tambah Block". `tExpr()` digunakan untuk terjemahan tertunda, karena `define()` dieksekusi pada saat module loading di mana i18n belum diinisialisasi
- **`registerFlow()`** — Menambahkan panel konfigurasi. `uiSchema` menggunakan JSON Schema untuk mendefinisikan form (referensi sintaks [UI Schema](../../../../flow-engine/ui-schema)), `handler` menulis nilai yang diisi user ke `ctx.model.props`, dan `renderComponent()` dapat membacanya

## Langkah 3: Menambahkan File Multibahasa

Edit file terjemahan di `src/locale/` plugin, tambahkan terjemahan untuk semua key yang digunakan oleh `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple block": "简单区块",
  "Simple Block Flow": "简单区块配置",
  "Edit HTML Content": "编辑 HTML 内容",
  "HTML Content": "HTML 内容"
}
```

```json
// src/locale/en-US.json
{
  "Simple block": "Simple block",
  "Simple Block Flow": "Simple Block Flow",
  "Edit HTML Content": "Edit HTML Content",
  "HTML Content": "HTML Content"
}
```

:::warning Perhatian

Pertama kali menambahkan file bahasa perlu restart aplikasi agar berlaku.

:::

Untuk cara penulisan file terjemahan dan penggunaan `tExpr()` lebih lanjut, lihat [i18n Internasionalisasi](../component/i18n).

## Langkah 4: Mendaftarkan di Plugin

Edit `src/client-v2/plugin.tsx`, lazy loading model dengan `registerModelLoaders`:

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleBlockClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        // Lazy loading, module dimuat hanya saat pertama kali digunakan
        loader: () => import('./models/SimpleBlockModel'),
      },
    });
  }
}

export default PluginSimpleBlockClient;
```

`registerModelLoaders` menggunakan dynamic import, code model dimuat hanya ketika benar-benar digunakan untuk pertama kalinya — ini adalah cara registrasi yang direkomendasikan.

## Langkah 5: Mengaktifkan Plugin

```bash
yarn pm enable @my-project/plugin-simple-block
```

Setelah diaktifkan, buat halaman baru, klik "Tambah Block" dan Anda akan melihat "Simple block". Setelah ditambahkan, klik tombol konfigurasi Block untuk mengedit konten HTML.

## Source Code Lengkap

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — Contoh lengkap Block tampilan kustom

## Ringkasan

Kapabilitas yang digunakan dalam contoh ini:

| Kapabilitas     | Penggunaan                               | Dokumentasi                                          |
| -------- | ---------------------------------- | --------------------------------------------- |
| Render Block | `BlockModel` + `renderComponent()` | [FlowEngine → Ekstensi Block](../flow-engine/block) |
| Registrasi Menu | `define({ label })`                | [Ikhtisar FlowEngine](../flow-engine/index.md)    |
| Panel Konfigurasi | `registerFlow()` + `uiSchema`      | [Ikhtisar FlowEngine](../flow-engine/index.md)    |
| Registrasi Model | `registerModelLoaders` (lazy loading) | [Plugin](../plugin)                      |
| Terjemahan Tertunda | `tExpr()`                          | [i18n Internasionalisasi](../component/i18n)              |

## Tautan Terkait

- [Menulis Plugin Pertama Anda](../../write-your-first-plugin) — Membuat skeleton plugin dari nol
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel dan registerFlow
- [FlowEngine → Ekstensi Block](../flow-engine/block) — BlockModel, DataBlockModel, CollectionBlockModel
- [UI Schema](../../../../flow-engine/ui-schema) — Referensi sintaks uiSchema
- [Component vs FlowModel](../component-vs-flow-model) — Kapan menggunakan FlowModel
- [Plugin](../plugin) — Entry point Plugin dan lifecycle load()
- [i18n Internasionalisasi](../component/i18n) — Cara menulis file terjemahan dan penggunaan tExpr
- [Dokumentasi FlowEngine Lengkap](../../../flow-engine/index.md) — Referensi lengkap FlowModel, Flow, Context
