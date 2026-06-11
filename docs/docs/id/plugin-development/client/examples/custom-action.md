---
title: "Membuat Tombol Action Kustom"
description: "Praktik plugin NocoBase: membuat tombol Action kustom dengan ActionModel + ActionSceneEnum, mendukung Action level collection dan record."
keywords: "Action Kustom,ActionModel,ActionSceneEnum,Tombol Action,NocoBase"
---

# Membuat Tombol Action Kustom

Di NocoBase, Action adalah tombol di dalam Block yang digunakan untuk memicu logika bisnis — seperti "Tambah Baru", "Edit", "Hapus", dll. Contoh ini menunjukkan cara membuat tombol Action kustom dengan `ActionModel`, dan mengontrol skenario kemunculan tombol melalui `ActionSceneEnum`.

:::tip Bacaan Pendahuluan

Disarankan memahami konten berikut terlebih dahulu agar pengembangan lebih lancar:

- [Menulis Plugin Pertama Anda](../../write-your-first-plugin) — Pembuatan plugin dan struktur direktori
- [Plugin](../plugin) — Entry point Plugin dan lifecycle `load()`
- [FlowEngine → Ekstensi Action](../flow-engine/action) — Pengantar dasar ActionModel, ActionSceneEnum
- [i18n Internasionalisasi](../component/i18n) — Cara menulis file terjemahan dan penggunaan terjemahan tertunda `tExpr()`

:::

## Hasil Akhir

Kita akan membuat tiga tombol Action kustom yang masing-masing sesuai dengan tiga skenario Action:

- **Action level collection** (`collection`) — Muncul di action bar atas Block, misalnya di sebelah tombol "Tambah Baru"
- **Action level record** (`record`) — Muncul di kolom action setiap baris tabel, misalnya di sebelah "Edit", "Hapus"
- **Berlaku untuk keduanya** (`both`) — Muncul di kedua skenario

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

Source code lengkap lihat [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action). Jika Anda ingin langsung menjalankannya secara lokal untuk melihat hasilnya:

```bash
yarn pm enable @nocobase-example/plugin-simple-action
```

Berikutnya, mari kita bangun plugin ini dari nol, langkah demi langkah.

## Langkah 1: Membuat Skeleton Plugin

Eksekusi di direktori root repository:

```bash
yarn pm create @my-project/plugin-simple-action
```

Untuk penjelasan detail lihat [Menulis Plugin Pertama Anda](../../write-your-first-plugin).

## Langkah 2: Membuat Model Action

Setiap Action perlu mendeklarasikan skenario kemunculannya, ditentukan melalui properti `static scene`:

| Skenario       | Nilai                           | Penjelasan                                     |
| ---------- | ---------------------------- | ---------------------------------------- |
| collection | `ActionSceneEnum.collection` | Berlaku untuk collection, misalnya tombol "Tambah Baru"           |
| record     | `ActionSceneEnum.record`     | Berlaku untuk record tunggal, misalnya tombol "Edit", "Hapus" |
| both       | `ActionSceneEnum.both`       | Tersedia di kedua skenario                           |

### Action Level Collection

Buat `src/client-v2/models/SimpleCollectionActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});

// Mendengarkan event klik melalui registerFlow, memberikan feedback kepada user dengan ctx.message
SimpleCollectionActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple collection action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Collection action clicked'));
      },
    },
  },
});
```

### Action Level Record

Buat `src/client-v2/models/SimpleRecordActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});

// Action level record dapat mendapatkan data dan index baris saat ini melalui ctx.model.context
SimpleRecordActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple record action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        const id = record?.id;
        ctx.message.info(ctx.t('Record action clicked, record ID: {{id}}, row index: {{index}}', { id, index }));
      },
    },
  },
});
```

### Berlaku untuk Kedua Skenario

Buat `src/client-v2/models/SimpleBothActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});

SimpleBothActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple both action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.info(ctx.t('Both action clicked'));
      },
    },
  },
});
```

Struktur ketiga cara penulisan ini sama — perbedaannya hanya pada nilai `static scene` dan teks tombol. Setiap tombol mendengarkan event klik melalui `registerFlow({ on: 'click' })`, dan menampilkan pesan dengan `ctx.message`, sehingga user dapat melihat tombol benar-benar berfungsi.

## Langkah 3: Menambahkan File Multibahasa

Edit file terjemahan di `src/locale/` plugin:

```json
// src/locale/zh-CN.json
{
  "Simple collection action": "简单数据表操作",
  "Simple record action": "简单记录操作",
  "Simple both action": "简单通用操作",
  "Collection action clicked": "数据表操作被点击了",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "记录操作被点击了，记录 ID：{{id}}，行索引：{{index}}",
  "Both action clicked": "通用操作被点击了"
}
```

```json
// src/locale/en-US.json
{
  "Simple collection action": "Simple collection action",
  "Simple record action": "Simple record action",
  "Simple both action": "Simple both action",
  "Collection action clicked": "Collection action clicked",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "Record action clicked, record ID: {{id}}, row index: {{index}}",
  "Both action clicked": "Both action clicked"
}
```

:::warning Perhatian

Pertama kali menambahkan file bahasa perlu restart aplikasi agar berlaku.

:::

Untuk cara penulisan file terjemahan dan penggunaan `tExpr()` lebih lanjut, lihat [i18n Internasionalisasi](../component/i18n).

## Langkah 4: Mendaftarkan di Plugin

Edit `src/client-v2/plugin.tsx`, daftarkan dengan lazy loading menggunakan `registerModelLoaders`:

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}

export default PluginSimpleActionClient;
```

## Langkah 5: Mengaktifkan Plugin

```bash
yarn pm enable @my-project/plugin-simple-action
```

Setelah diaktifkan, di "Konfigurasi Action" pada Block tabel Anda dapat menambahkan tombol Action kustom ini.

## Source Code Lengkap

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — Contoh lengkap tiga skenario Action

## Ringkasan

Kapabilitas yang digunakan dalam contoh ini:

| Kapabilitas     | Penggunaan                                         | Dokumentasi                                           |
| -------- | -------------------------------------------- | ---------------------------------------------- |
| Tombol Action | `ActionModel` + `static scene`               | [FlowEngine → Ekstensi Action](../flow-engine/action) |
| Skenario Action | `ActionSceneEnum.collection / record / both / all` | [FlowEngine → Ekstensi Action](../flow-engine/action) |
| Registrasi Menu | `define({ label })`                          | [Ikhtisar FlowEngine](../flow-engine/index.md)     |
| Registrasi Model | `this.flowEngine.registerModelLoaders()`     | [Plugin](../plugin)                       |
| Terjemahan Tertunda | `tExpr()`                                    | [i18n Internasionalisasi](../component/i18n)               |

## Tautan Terkait

- [Menulis Plugin Pertama Anda](../../write-your-first-plugin) — Membuat skeleton plugin dari nol
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel
- [FlowEngine → Ekstensi Action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [FlowEngine → Ekstensi Block](../flow-engine/block) — Block Kustom
- [FlowEngine → Ekstensi Field](../flow-engine/field) — Component Field Kustom
- [Component vs FlowModel](../component-vs-flow-model) — Kapan menggunakan FlowModel
- [Plugin](../plugin) — Entry point Plugin dan lifecycle load()
- [i18n Internasionalisasi](../component/i18n) — Cara menulis file terjemahan dan penggunaan tExpr
- [Dokumentasi FlowEngine Lengkap](../../../flow-engine/index.md) — Referensi lengkap FlowModel, Flow, Context
