---
title: "Ekstensi Action"
description: "Pengembangan ekstensi Action NocoBase: ActionModel class dasar, ActionSceneEnum skenario Action, tombol Action kustom."
keywords: "ekstensi Action,Action,ActionModel,ActionSceneEnum,tombol Action,NocoBase"
---

# Ekstensi Action

Di NocoBase, **Action** adalah tombol di Block, digunakan untuk memicu logika bisnis — seperti "Tambah Baru", "Edit", "Delete", dll. Dengan extends class dasar `ActionModel`, Anda dapat menambahkan tombol Action kustom.

## Skenario Action

Setiap Action perlu mendeklarasikan skenario kemunculannya, ditentukan melalui property `static scene`:

| Skenario       | Nilai                           | Penjelasan                                       |
| ---------- | ---------------------------- | ------------------------------------------ |
| collection | `ActionSceneEnum.collection` | Berlaku untuk tabel data, seperti tombol "Tambah Baru"               |
| record     | `ActionSceneEnum.record`     | Berlaku untuk record tunggal, seperti tombol "Edit", "Delete"     |
| both       | `ActionSceneEnum.both`       | Kedua skenario tersedia                             |
| all        | `ActionSceneEnum.all`        | Semua skenario tersedia (termasuk konteks khusus seperti modal, dll.) |

## Contoh

### Action Level Tabel Data

Berlaku untuk seluruh tabel data, muncul di action bar atas Block:

```tsx
// models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});
```

### Action Level Record

Berlaku untuk record tunggal, muncul di kolom Action setiap baris tabel:

```tsx
// models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});
```

### Kedua Skenario Berlaku

Jika Action tidak membedakan skenario, gunakan `ActionSceneEnum.both`:

```tsx
// models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});
```

Struktur tiga cara penulisan sama — perbedaan hanya pada nilai `static scene` dan teks tombol di `defaultProps`.

## Mendaftarkan Action

Di `load()` Plugin gunakan `registerModelLoaders` untuk loading dan registrasi sesuai kebutuhan:

```ts
// plugin.tsx
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
```

Setelah registrasi selesai, di "Konfigurasi Action" Block dapat menambahkan tombol Action kustom Anda.

## Source Code Lengkap

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — Contoh lengkap tiga skenario Action

## Tautan Terkait

- [Praktik Plugin: Membuat Tombol Action Kustom](../examples/custom-action) — Membangun tombol Action tiga skenario dari nol
- [Praktik Plugin: Membuat Plugin Manajemen Data Front-Back End](../examples/fullstack-plugin) — Aplikasi praktis Action kustom + ctx.viewer.dialog dalam plugin lengkap
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel
- [Ekstensi Block](./block) — Block kustom
- [Ekstensi Field](./field) — Component Field kustom
- [Definisi FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Parameter lengkap dan tipe event registerFlow
- [Dokumentasi Lengkap FlowEngine](../../../flow-engine/index.md) — Referensi lengkap
