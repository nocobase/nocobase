---
title: "ctx.blockModel"
description: "ctx.blockModel adalah model parent block tempat JS Field/Block saat ini berada, dapat mengakses form, collection, dan resource, untuk linkage JSField, JSItem, dan JSColumn."
keywords: "ctx.blockModel,BlockModel,form,collection,resource,JSField,JSItem,RunJS,NocoBase"
---

# ctx.blockModel

Model parent block tempat JS Field / JS Block saat ini berada (instance BlockModel). Pada skenario seperti JSField, JSItem, JSColumn, `ctx.blockModel` menunjuk ke form block atau table block yang menampung logika JS saat ini; pada JSBlock independen mungkin `null` atau sama dengan `ctx.model`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSField** | Mengakses `form`, `collection`, `resource` dari parent form block di dalam form field, untuk linkage atau validasi |
| **JSItem** | Pada item sub-table mengakses resource dan informasi data table dari parent table/form block |
| **JSColumn** | Pada kolom tabel mengakses `resource` (seperti `getSelectedRows`), `collection` dari parent table block |
| **Action Form / Event Flow** | Mengakses `form` untuk validasi sebelum submit, `resource` untuk refresh, dll. |

> Perhatian: `ctx.blockModel` hanya tersedia pada konteks RunJS yang memiliki parent block; pada JSBlock independen (tanpa parent form/table) mungkin `null`, disarankan melakukan pengecekan null sebelum digunakan.

## Definisi Tipe

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Tipe spesifik tergantung pada tipe parent block: form block umumnya `FormBlockModel`, `EditFormModel`, table block umumnya `TableBlockModel`.

## Properti Umum

| Properti | Tipe | Deskripsi |
|------|------|------|
| `uid` | `string` | Identifier unik model block |
| `collection` | `Collection` | Data table yang terikat ke block saat ini |
| `resource` | `Resource` | Instance resource yang digunakan block (`SingleRecordResource` / `MultiRecordResource` dll.) |
| `form` | `FormInstance` | Form block: instance Ant Design Form, mendukung `getFieldsValue`, `validateFields`, `setFieldsValue`, dll. |
| `emitter` | `EventEmitter` | Event emitter, dapat memantau `formValuesChange`, `onFieldReset`, dll. |

## Hubungan dengan ctx.model dan ctx.form

| Kebutuhan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Parent block tempat JS saat ini berada** | `ctx.blockModel` |
| **Membaca/menulis field form** | `ctx.form` (setara dengan `ctx.blockModel?.form`, lebih praktis pada form block) |
| **Model dalam konteks eksekusi saat ini** | `ctx.model` (di JSField adalah field model, di JSBlock adalah block model) |

Pada JSField, `ctx.model` adalah field model, `ctx.blockModel` adalah form/table block yang menampung field tersebut; `ctx.form` biasanya adalah `ctx.blockModel.form`.

## Contoh

### Tabel: Mendapatkan Baris yang Dipilih dan Memprosesnya

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Silakan pilih data terlebih dahulu');
  return;
}
```

### Skenario Form: Validasi dan Refresh

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Memantau Perubahan Form

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Lakukan linkage atau re-render berdasarkan nilai form terbaru
});
```

### Memicu Re-render Block

```ts
ctx.blockModel?.rerender?.();
```

## Hal yang Perlu Diperhatikan

- `ctx.blockModel` mungkin `null` pada **JSBlock independen** (tanpa parent form/table block), disarankan menggunakan optional chaining sebelum mengakses propertinya: `ctx.blockModel?.resource?.refresh?.()`.
- Pada **JSField / JSItem / JSColumn**, `ctx.blockModel` adalah form atau table block yang menampung field saat ini; pada **JSBlock**, mungkin diri sendiri atau block tingkat atas, tergantung hierarki sebenarnya.
- `resource` hanya ada pada data block; `form` hanya ada pada form block, table block biasanya tidak memiliki `form`.

## Terkait

- [ctx.model](./model.md): Model dalam konteks eksekusi saat ini
- [ctx.form](./form.md): Instance form, sering digunakan pada form block
- [ctx.resource](./resource.md): Instance resource (setara dengan `ctx.blockModel?.resource`, jika ada langsung gunakan)
- [ctx.getModel()](./get-model.md): Mendapatkan model block lain berdasarkan uid
