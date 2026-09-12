---
title: "Ekstensi Block"
description: "Pengembangan ekstensi Block NocoBase: BlockModel, DataBlockModel, CollectionBlockModel, TableBlockModel class dasar dan cara registrasi."
keywords: "ekstensi Block,Block,BlockModel,DataBlockModel,CollectionBlockModel,TableBlockModel,renderComponent,NocoBase"
---

# Ekstensi Block

Di NocoBase, **Block** adalah area konten di halaman — seperti tabel, form, chart, detail, dll. Dengan extends class dasar series BlockModel, Anda dapat membuat Block kustom dan mendaftarkannya ke menu "Tambah Block".

## Pemilihan Class Dasar

NocoBase menyediakan tiga class dasar Block, pilih berdasarkan kebutuhan data Anda:

| Class Dasar                   | Hubungan Inheritance                              | Skenario yang Berlaku                                   |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| `BlockModel`           | Block paling dasar                          | Block tampilan yang tidak memerlukan data source                     |
| `DataBlockModel`       | Inherits dari `BlockModel`                     | Memerlukan data tetapi tidak terikat pada tabel data NocoBase           |
| `CollectionBlockModel` | Inherits dari `DataBlockModel`                 | Mengikat tabel data NocoBase, otomatis mengambil data         |
| `TableBlockModel`      | Inherits dari `CollectionBlockModel`           | Block tabel lengkap, dengan kolom field, action bar, pagination, dll. |

Rantai inheritance: `BlockModel` → `DataBlockModel` → `CollectionBlockModel` → `TableBlockModel`.

Biasanya, jika Anda menginginkan Block tabel siap pakai, langsung gunakan `TableBlockModel` — ini dilengkapi kemampuan lengkap seperti kolom field, action bar, pagination, sorting, dll., adalah class dasar yang paling banyak digunakan. Jika Anda perlu rendering yang sepenuhnya kustom (seperti list card, timeline, dll.), gunakan `CollectionBlockModel` dan tulis sendiri `renderComponent`. Jika hanya untuk menampilkan konten statis atau UI kustom, `BlockModel` sudah cukup.

Posisi `DataBlockModel` agak khusus — ini sendiri tidak menambahkan property atau method baru, body class kosong. Tujuannya adalah **identifier kategorisasi**: Block yang inherits `DataBlockModel` akan dikelompokkan ke grup menu "Block Data" di UI. Jika Block Anda perlu mengelola sendiri logika pengambilan data (tidak mengikuti binding Collection standar NocoBase), dapat inherits `DataBlockModel`. Misalnya `ChartBlockModel` plugin chart — ini menggunakan `ChartResource` kustom untuk mengambil data, tidak memerlukan binding tabel data standar. Sebagian besar skenario Anda tidak perlu langsung menggunakan `DataBlockModel`, gunakan `CollectionBlockModel` atau `TableBlockModel` sudah cukup.

## Contoh BlockModel

Block paling sederhana — mendukung edit konten HTML:

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Contoh ini mencakup tiga langkah pengembangan Block:

1. **`renderComponent()`** — Merender UI Block, membaca property melalui `this.props`
2. **`define()`** — Mengatur nama tampilan Block di menu "Tambah Block"
3. **`registerFlow()`** — Menambahkan panel konfigurasi visual, pengguna dapat mengedit konten HTML di antarmuka

## Contoh CollectionBlockModel

Jika Block perlu mengikat tabel data NocoBase, gunakan `CollectionBlockModel`. Ini akan otomatis menangani pengambilan data:

```tsx
// models/ManyRecordBlockModel.tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

export class ManyRecordBlockModel extends CollectionBlockModel {
  // Mendeklarasikan ini adalah Block multi record
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h3>Block Tabel Data</h3>
        {/* resource.getData() mengambil data tabel data */}
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records'),
});
```

Dibandingkan dengan `BlockModel`, `CollectionBlockModel` memiliki tambahan ini:

- **`static scene`** — Mendeklarasikan skenario Block. Nilai umum: `BlockSceneEnum.many` (list multi record), `BlockSceneEnum.one` (detail/form record tunggal). Enum lengkap juga termasuk `new`, `select`, `filter`, `subForm`, `bulkEditForm`, dll.
- **`createResource()`** — Membuat data resource, `MultiRecordResource` digunakan untuk mengambil multi record
- **`this.resource.getData()`** — Mengambil data tabel data

## Contoh TableBlockModel

`TableBlockModel` inherits dari `CollectionBlockModel`, adalah Block tabel lengkap bawaan NocoBase — dilengkapi kapabilitas seperti kolom field, action bar, pagination, sorting, dll. Saat pengguna memilih "Table" di "Tambah Block" inilah yang digunakan.

Biasanya, jika `TableBlockModel` bawaan sudah memenuhi kebutuhan, pengguna langsung menambahkan di antarmuka, developer tidak perlu melakukan apa pun. Hanya saat Anda perlu **melakukan kustomisasi berbasis TableBlockModel**, baru perlu inherits — seperti:

- Override `customModelClasses` untuk mengganti grup operasi atau model kolom field bawaan
- Membatasi hanya tersedia untuk tabel data tertentu melalui `filterCollection`
- Mendaftarkan Flow tambahan untuk menambah item konfigurasi kustom

```tsx
// Contoh: Block tabel yang dibatasi hanya tersedia untuk tabel data todoItems
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Untuk contoh kustomisasi `TableBlockModel` lengkap lihat [Membuat Plugin Manajemen Data Front-Back End](../examples/fullstack-plugin).

## Mendaftarkan Block

Daftarkan di `load()` Plugin:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        loader: () => import('./models/SimpleBlockModel'),
      },
      ManyRecordBlockModel: {
        loader: () => import('./models/ManyRecordBlockModel'),
      },
    });
  }
}
```

Setelah registrasi selesai, klik "Tambah Block" di antarmuka NocoBase akan terlihat Block kustom Anda.

## Source Code Lengkap

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — Contoh BlockModel
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-collection-block) — Contoh CollectionBlockModel

## Tautan Terkait

- [Praktik Plugin: Membuat Block Tampilan Kustom](../examples/custom-block) — Membangun Block BlockModel yang dapat dikonfigurasi dari nol
- [Praktik Plugin: Membuat Plugin Manajemen Data Front-Back End](../examples/fullstack-plugin) — Contoh lengkap TableBlockModel + Field kustom + Action kustom
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel dan registerFlow
- [Ekstensi Field](./field) — Component Field kustom
- [Ekstensi Action](./action) — Tombol Action kustom
- [Cheatsheet Resource API](../../../api/flow-engine/resource.md) — Method signature lengkap MultiRecordResource / SingleRecordResource
- [Definisi FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Parameter lengkap dan tipe event registerFlow
- [Dokumentasi Lengkap FlowEngine](../../../flow-engine/index.md) — Referensi lengkap
