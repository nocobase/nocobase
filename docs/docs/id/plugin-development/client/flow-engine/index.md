---
title: "Ikhtisar FlowEngine"
description: "Panduan pengembangan plugin NocoBase FlowEngine: penggunaan dasar FlowModel, renderComponent, registerFlow, konfigurasi uiSchema, pemilihan class dasar."
keywords: "FlowEngine,FlowModel,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# FlowEngine

Di NocoBase, **FlowEngine** adalah engine inti yang menggerakkan konfigurasi visual. Block, Field, tombol Action di antarmuka NocoBase semuanya dikelola melalui FlowEngine — termasuk rendering, panel konfigurasi, dan persistensi konfigurasinya.

![20260403215904](https://static-docs.nocobase.com/20260403215904.png)

Bagi developer plugin, FlowEngine menyediakan dua konsep inti:

- **FlowModel** — Model Component yang dapat dikonfigurasi, bertanggung jawab merender UI dan mengelola props
- **Flow** — Alur konfigurasi, mendefinisikan panel konfigurasi Component dan logika pemrosesan data

Jika Component Anda perlu muncul di menu "Tambah Block / Field / Action", atau perlu mendukung pengguna melakukan konfigurasi visual di antarmuka, perlu dibungkus dengan FlowModel. Jika tidak memerlukan kapabilitas ini, Component React biasa sudah cukup — lihat [Component vs FlowModel](../component-vs-flow-model).

## Apa itu FlowModel

Berbeda dengan Component React biasa, FlowModel selain bertanggung jawab merender UI, juga mengelola sumber props, definisi panel konfigurasi, dan persistensi konfigurasi. Sederhananya: props Component biasa di-hardcode, props FlowModel di-generate dinamis melalui Flow.

Untuk memahami arsitektur menyeluruh FlowEngine secara mendalam, dapat melihat [Dokumentasi Lengkap FlowEngine](../../../flow-engine/index.md). Berikut diperkenalkan dari sudut pandang developer plugin, cara menggunakannya.

## Contoh Minimal

Sebuah FlowModel dari pembuatan hingga registrasi, dibagi menjadi tiga langkah:

### 1. Extends Class Dasar, Implementasikan renderComponent

```tsx
// models/HelloBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Hello FlowEngine!</h3>
        <p>Ini adalah Block kustom.</p>
      </div>
    );
  }
}

// define() mengatur nama tampilan di menu
HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

`renderComponent()` adalah method rendering model ini, mirip dengan `render()` Component React. `tExpr()` digunakan untuk terjemahan tertunda — karena `define()` dieksekusi saat module dimuat, pada saat ini i18n belum diinisialisasi. Untuk detail lihat [Kapabilitas Umum Context → tExpr](../ctx/common-capabilities#texpr).

### 2. Daftarkan di Plugin

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        // Loading sesuai kebutuhan, modul dimuat saat pertama kali digunakan
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

### 3. Gunakan di Antarmuka

Setelah registrasi selesai, melalui pengaktifan plugin (untuk pengaktifan plugin dapat merujuk ke [Ikhtisar Plugin Development](../../index.md)), buat halaman baru di antarmuka NocoBase, klik "Tambah Block" akan terlihat "Hello block" Anda.

![20260403221815](https://static-docs.nocobase.com/20260403221815.png)

## Menambahkan Item Konfigurasi dengan registerFlow

Hanya bisa rendering tidak cukup — nilai inti FlowModel adalah **dapat dikonfigurasi**. Melalui `registerFlow()` Anda dapat menambahkan panel konfigurasi ke model, memungkinkan pengguna memodifikasi property di antarmuka.

Contoh Block yang mendukung edit konten HTML:

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    // Nilai this.props berasal dari pengaturan Flow handler
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // Eksekusi sebelum render
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema mendefinisikan UI panel konfigurasi
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Nilai default
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // Di handler set nilai panel konfigurasi ke props model
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Beberapa poin kunci:

- **`on: 'beforeRender'`** — Berarti Flow ini dieksekusi sebelum rendering, nilai panel konfigurasi akan ditulis ke `this.props` sebelum rendering
- **`uiSchema`** — Menggunakan format JSON Schema untuk mendefinisikan UI panel konfigurasi, sintaks referensi [UI Schema](../../../flow-engine/ui-schema)
- **`handler(ctx, params)`** — `params` adalah nilai yang diisi pengguna di panel konfigurasi, diset ke model melalui `ctx.model.props`
- **`defaultParams`** — Nilai default panel konfigurasi

## Cara Penulisan uiSchema Umum

`uiSchema` berbasis JSON Schema, v2 kompatibel dengan sintaks uiSchema, namun skenario penggunaan terbatas — terutama digunakan di panel konfigurasi Flow untuk mendeskripsikan UI form. Sebagian besar rendering Component runtime direkomendasikan menggunakan Component Antd langsung, tidak perlu menggunakan uiSchema.

Berikut tercantum beberapa Component yang paling sering digunakan (referensi lengkap lihat [UI Schema](../../../flow-engine/ui-schema)):

```ts
uiSchema: {
  // Input teks
  title: {
    type: 'string',
    title: 'Judul',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // Teks multi-baris
  content: {
    type: 'string',
    title: 'Konten',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  // Dropdown selection
  type: {
    type: 'string',
    title: 'Tipe',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: 'Utama', value: 'primary' },
      { label: 'Default', value: 'default' },
      { label: 'Dashed', value: 'dashed' },
    ],
  },
  // Switch
  bordered: {
    type: 'boolean',
    title: 'Tampilkan Border',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}
```

Setiap field dibungkus dengan `'x-decorator': 'FormItem'`, sehingga akan otomatis dilengkapi judul dan layout.

## Penjelasan Parameter define()

`FlowModel.define()` digunakan untuk mengatur metadata model, mengontrol cara tampilannya di menu. Yang paling sering digunakan dalam pengembangan plugin adalah `label`, namun masih mendukung lebih banyak parameter:

| Parameter | Tipe | Penjelasan |
|------|------|------|
| `label` | `string \| ReactNode` | Nama tampilan di menu "Tambah Block / Field / Action", mendukung terjemahan tertunda `tExpr()` |
| `icon` | `ReactNode` | Icon di menu |
| `sort` | `number` | Bobot sorting, semakin kecil semakin di depan. Default `0` |
| `hide` | `boolean \| (ctx) => boolean` | Apakah disembunyikan di menu, mendukung penilaian dinamis |
| `group` | `string` | Identifier grup, untuk dikelompokkan ke grup menu tertentu |
| `children` | `SubModelItem[] \| (ctx) => SubModelItem[]` | Item submenu, mendukung function asinkron untuk konstruksi dinamis |
| `toggleable` | `boolean \| (model) => boolean` | Apakah mendukung perilaku toggle (unik di bawah parent yang sama) |
| `searchable` | `boolean` | Apakah submenu mengaktifkan pencarian |

Sebagian besar plugin hanya perlu mengatur `label`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
});
```

Jika perlu mengontrol sorting atau menyembunyikan, dapat menambahkan `sort` dan `hide`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
  sort: 10,       // Diletakkan di belakang
  hide: (ctx) => !ctx.someCondition,  // Sembunyikan kondisi
});
```

## Pemilihan Class Dasar FlowModel

NocoBase menyediakan beberapa class dasar FlowModel, pilih berdasarkan tipe yang ingin Anda perluas:

| Class Dasar                   | Tujuan                               | Dokumentasi Detail             |
| ---------------------- | ---------------------------------- | -------------------- |
| `BlockModel`           | Block biasa                           | [Ekstensi Block](./block)  |
| `DataBlockModel`       | Block yang perlu mengambil data sendiri             | [Ekstensi Block](./block)  |
| `CollectionBlockModel` | Mengikat tabel data, otomatis mengambil data           | [Ekstensi Block](./block)  |
| `TableBlockModel`      | Block tabel lengkap, dengan kolom field, action bar, dll. | [Ekstensi Block](./block)  |
| `FieldModel`           | Component field                           | [Ekstensi Field](./field)  |
| `ActionModel`          | Tombol Action                           | [Ekstensi Action](./action) |

Biasanya, untuk membuat Block tabel gunakan `TableBlockModel` (paling sering digunakan, siap pakai), perlu rendering yang sepenuhnya kustom gunakan `CollectionBlockModel` atau `BlockModel`, untuk Field gunakan `FieldModel`, untuk tombol Action gunakan `ActionModel`.

## Tautan Terkait

- [Ekstensi Block](./block) — Mengembangkan Block dengan class dasar series BlockModel
- [Ekstensi Field](./field) — Mengembangkan Field kustom dengan FieldModel
- [Ekstensi Action](./action) — Mengembangkan tombol Action dengan ActionModel
- [Component vs FlowModel](../component-vs-flow-model) — Tidak yakin menggunakan cara mana?
- [Definisi FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Penjelasan parameter lengkap registerFlow dan daftar tipe event
- [Dokumentasi Lengkap FlowEngine](../../../flow-engine/index.md) — Referensi lengkap FlowModel, Flow, Context
- [Memulai Cepat FlowEngine](../../../flow-engine/quickstart) — Membangun Component tombol yang dapat di-orchestrate dari nol
- [Ikhtisar Plugin Development](../../index.md) — Pengantar menyeluruh tentang plugin development
- [UI Schema](../../../flow-engine/ui-schema) — Referensi sintaks uiSchema
