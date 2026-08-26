---
title: "ctx.getModel()"
description: "ctx.getModel() mendapatkan instance block model atau form model berdasarkan uid, untuk akses lintas block, linkage, dan refresh data."
keywords: "ctx.getModel,uid,block model,form model,lintas block,RunJS,NocoBase"
---

# ctx.getModel()

Mendapatkan instance model (seperti BlockModel, PageModel, ActionModel, dll.) di engine atau view stack saat ini berdasarkan `uid` model, untuk mengakses model lain di RunJS lintas block, lintas halaman, atau lintas popup.

Jika hanya membutuhkan model atau block tempat konteks eksekusi saat ini berada, lebih utamakan `ctx.model` atau `ctx.blockModel`, tidak perlu menggunakan `ctx.getModel`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSAction** | Mendapatkan model block lain berdasarkan `uid` yang diketahui, membaca/menulis `resource`, `form`, `setProps`, dll. |
| **RunJS Dalam Popup** | Saat dalam popup perlu mengakses model tertentu pada halaman yang membukanya, teruskan `searchInPreviousEngines: true` |
| **Action Kustom** | Lintas view stack mencari form atau sub-model di panel pengaturan berdasarkan `uid`, membaca konfigurasi atau statusnya |

## Definisi Tipe

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parameter

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `uid` | `string` | Identifier unik dari instance model target, ditentukan saat konfigurasi atau pembuatan (seperti `ctx.model.uid`) |
| `searchInPreviousEngines` | `boolean` | Opsional, default `false`. Saat `true` akan mencari ke atas dari engine saat ini di "view stack" hingga root, dapat mendapatkan model di engine tingkat atas (seperti halaman yang membuka popup) |

## Return Value

- Jika ditemukan akan mengembalikan instance subclass `FlowModel` yang sesuai (seperti `BlockModel`, `FormBlockModel`, `ActionModel`).
- Jika tidak ditemukan mengembalikan `undefined`.

## Lingkup Pencarian

- **Default (`searchInPreviousEngines: false`)**: hanya mencari berdasarkan `uid` di **engine saat ini**. Pada popup, multi-level view, setiap view memiliki engine independen, secara default hanya mencari model di view saat ini.
- **`searchInPreviousEngines: true`**: mulai dari engine saat ini, mencari ke atas mengikuti rantai `previousEngine`, segera mengembalikan saat hit. Cocok untuk popup yang ingin mengakses model tertentu pada halaman yang membukanya.

## Contoh

### Mendapatkan Block Lain dan Refresh

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Mengakses Model di Halaman Dari Dalam Popup

```ts
// Dalam popup perlu mengakses block di halaman yang membukanya
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Membaca/Menulis Lintas Model dan Memicu Rerender

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Pengecekan Aman

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Model target tidak ada');
  return;
}
```

## Terkait

- [ctx.model](./model.md): Model dalam konteks eksekusi saat ini
- [ctx.blockModel](./block-model.md): Model parent block tempat JS saat ini berada, biasanya dapat diakses tanpa `getModel`
