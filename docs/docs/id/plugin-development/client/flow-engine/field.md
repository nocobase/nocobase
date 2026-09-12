---
title: "Ekstensi Field"
description: "Pengembangan ekstensi Field NocoBase: FieldModel, ClickableFieldModel class dasar, rendering Field, mengikat interface Field."
keywords: "ekstensi Field,Field,FieldModel,ClickableFieldModel,renderComponent,bindModelToInterface,NocoBase"
---

# Ekstensi Field

Di NocoBase, **Component Field** digunakan untuk menampilkan dan mengedit data di tabel dan form. Dengan extends class dasar terkait FieldModel, Anda dapat menyesuaikan cara rendering Field — seperti menampilkan data dalam format khusus, atau mengedit dengan Component kustom.

## Contoh: Field Tampilan Kustom

Contoh berikut membuat Field tampilan sederhana — menambahkan kurung siku `[]` di kedua sisi nilai field:

![20260407201138](https://static-docs.nocobase.com/20260407201138.png)

```tsx
// models/SimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    // this.context.record dapat mendapatkan record lengkap baris saat ini
    console.log('Record saat ini:', this.context.record);
    console.log('Index record saat ini:', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Mengikat ke interface field tipe 'input'
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Beberapa poin kunci:

- **`renderComponent(value)`** — Menerima nilai field saat ini sebagai parameter, return JSX yang dirender
- **`this.context.record`** — Mendapatkan record data lengkap baris saat ini
- **`this.context.recordIndex`** — Mendapatkan index baris saat ini
- **`ClickableFieldModel`** — Inherits dari `FieldModel`, dengan kemampuan interaksi klik
- **`DisplayItemModel.bindModelToInterface()`** — Mengikat model field ke tipe interface field yang ditentukan (seperti `input` merepresentasikan field tipe input teks), sehingga di field tipe yang sesuai dapat memilih Component tampilan ini

## Mendaftarkan Field

Di `load()` Plugin gunakan `registerModelLoaders` untuk loading dan registrasi sesuai kebutuhan:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/SimpleFieldModel'),
      },
    });
  }
}
```

Setelah registrasi selesai, di Block tabel temukan kolom field tipe yang sesuai (seperti contoh di atas mengikat `input`, sesuai dengan field teks satu baris), klik tombol konfigurasi kolom, di dropdown menu "Component Field" dapat beralih ke Component tampilan kustom ini. Untuk contoh praktis lengkap lihat [Membuat Component Field Kustom](../examples/custom-field).

![20260407201221](https://static-docs.nocobase.com/20260407201221.png)

## Source Code Lengkap

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — Contoh Component Field kustom

## Tautan Terkait

- [Praktik Plugin: Membuat Component Field Kustom](../examples/custom-field) — Membangun Component tampilan field kustom dari nol
- [Praktik Plugin: Membuat Plugin Manajemen Data Front-Back End](../examples/fullstack-plugin) — Aplikasi praktis Field kustom dalam plugin lengkap
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel
- [Ekstensi Block](./block) — Block kustom
- [Ekstensi Action](./action) — Tombol Action kustom
- [Definisi FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Parameter lengkap dan tipe event registerFlow
- [Dokumentasi Lengkap FlowEngine](../../../flow-engine/index.md) — Referensi lengkap
