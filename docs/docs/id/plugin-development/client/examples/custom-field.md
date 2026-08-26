---
title: "Membuat Component Field Kustom"
description: "Praktik plugin NocoBase: membuat Component tampilan Field kustom dengan ClickableFieldModel, mengikat ke interface Field."
keywords: "Field Kustom,FieldModel,ClickableFieldModel,bindModelToInterface,Ekstensi Field,NocoBase"
---

# Membuat Component Field Kustom

Di NocoBase, Component Field digunakan untuk menampilkan dan mengedit data di tabel dan form. Contoh ini menunjukkan cara membuat Component tampilan Field kustom dengan `ClickableFieldModel` — menambahkan tanda kurung siku `[]` di kedua sisi nilai Field, dan mengikatnya ke interface Field tipe `input`.

:::tip Bacaan Pendahuluan

Disarankan memahami konten berikut terlebih dahulu agar pengembangan lebih lancar:

- [Menulis Plugin Pertama Anda](../../write-your-first-plugin) — Pembuatan plugin dan struktur direktori
- [Plugin](../plugin) — Entry point Plugin dan lifecycle `load()`
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel
- [FlowEngine → Ekstensi Field](../flow-engine/field) — Pengantar kelas dasar FieldModel, ClickableFieldModel
- [i18n Internasionalisasi](../component/i18n) — Cara menulis file terjemahan dan penggunaan terjemahan tertunda `tExpr()`

:::

## Hasil Akhir

Yang akan kita buat adalah Component tampilan Field kustom:

- Mewarisi `ClickableFieldModel`, dengan logika rendering kustom
- Menampilkan nilai Field dengan tanda kurung siku `[]` di kedua sisinya
- Mengikat ke Field tipe `input` (single-line text) melalui `bindModelToInterface`

Setelah plugin diaktifkan, di Block tabel temukan kolom Field single-line text, klik tombol konfigurasi kolom, di dropdown menu "Component Field" Anda akan melihat opsi `DisplaySimpleFieldModel`. Setelah berpindah, nilai kolom tersebut akan ditampilkan dalam format `[value]`.

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_20.08.48.mp4" type="video/mp4">
</video>

Source code lengkap lihat [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple). Jika Anda ingin langsung menjalankannya secara lokal untuk melihat hasilnya:

```bash
yarn pm enable @nocobase-example/plugin-field-simple
```

Berikutnya, mari kita bangun plugin ini dari nol, langkah demi langkah.

## Langkah 1: Membuat Skeleton Plugin

Eksekusi di direktori root repository:

```bash
yarn pm create @my-project/plugin-field-simple
```

Untuk penjelasan detail lihat [Menulis Plugin Pertama Anda](../../write-your-first-plugin).

## Langkah 2: Membuat Model Field

Buat `src/client-v2/models/DisplaySimpleFieldModel.tsx`. Ini adalah inti dari plugin — mendefinisikan bagaimana Field dirender dan ke interface Field mana ia diikat.

```tsx
// src/client-v2/models/DisplaySimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    // this.context.record dapat mendapatkan record lengkap baris saat ini
    console.log('Record saat ini:', this.context.record);
    console.log('Index record saat ini:', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Mengatur nama tampilan di dropdown menu "Component Field"
DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

// Mengikat ke interface Field tipe 'input' (single-line text)
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Beberapa poin penting:

- **`renderComponent(value)`** — Menerima nilai Field saat ini sebagai parameter, mengembalikan JSX yang akan dirender
- **`this.context.record`** — Mendapatkan record data lengkap baris saat ini
- **`this.context.recordIndex`** — Mendapatkan index baris saat ini
- **`ClickableFieldModel`** — Mewarisi dari `FieldModel`, memiliki kapabilitas interaksi klik
- **`define({ label })`** — Mengatur nama tampilan di dropdown menu "Component Field", jika tidak ditambahkan akan langsung menampilkan nama kelas
- **`DisplayItemModel.bindModelToInterface()`** — Mengikat model Field ke tipe interface Field yang ditentukan (misalnya `input` mewakili Field single-line text), sehingga di Field tipe yang sesuai dapat memilih Component tampilan ini

## Langkah 3: Menambahkan File Multibahasa

Edit file terjemahan di `src/locale/` plugin, tambahkan terjemahan untuk key yang digunakan `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple field": "简单字段"
}
```

```json
// src/locale/en-US.json
{
  "Simple field": "Simple field"
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

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/DisplaySimpleFieldModel'),
      },
    });
  }
}

export default PluginFieldSimpleClient;
```

## Langkah 5: Mengaktifkan Plugin

```bash
yarn pm enable @my-project/plugin-field-simple
```

Setelah diaktifkan, di Block tabel temukan kolom Field single-line text, klik tombol konfigurasi kolom, di dropdown menu "Component Field" Anda dapat berpindah ke Component tampilan kustom ini.

## Source Code Lengkap

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — Contoh lengkap Component Field kustom

## Ringkasan

Kapabilitas yang digunakan dalam contoh ini:

| Kapabilitas         | Penggunaan                                             | Dokumentasi                                          |
| ------------ | ------------------------------------------------ | --------------------------------------------- |
| Render Field     | `ClickableFieldModel` + `renderComponent(value)` | [FlowEngine → Ekstensi Field](../flow-engine/field) |
| Mengikat Interface Field | `DisplayItemModel.bindModelToInterface()`        | [FlowEngine → Ekstensi Field](../flow-engine/field) |
| Registrasi Model     | `this.flowEngine.registerModelLoaders()`         | [Plugin](../plugin)                      |

## Tautan Terkait

- [Menulis Plugin Pertama Anda](../../write-your-first-plugin) — Membuat skeleton plugin dari nol
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel
- [FlowEngine → Ekstensi Field](../flow-engine/field) — FieldModel, ClickableFieldModel, bindModelToInterface
- [FlowEngine → Ekstensi Block](../flow-engine/block) — Block Kustom
- [Component vs FlowModel](../component-vs-flow-model) — Kapan menggunakan FlowModel
- [Plugin](../plugin) — Entry point Plugin dan lifecycle load()
- [i18n Internasionalisasi](../component/i18n) — Cara menulis file terjemahan dan penggunaan tExpr
- [Dokumentasi FlowEngine Lengkap](../../../flow-engine/index.md) — Referensi lengkap FlowModel, Flow, Context
