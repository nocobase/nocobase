---
title: "ctx.collection"
description: "ctx.collection adalah instance data table yang terkait dengan konteks RunJS saat ini, mengakses metadata seperti name, getFields, filterTargetKey."
keywords: "ctx.collection,Collection,data table,getFields,filterTargetKey,metadata,RunJS,NocoBase"
---

# ctx.collection

Instance data table (Collection) yang terkait dengan konteks eksekusi RunJS saat ini, untuk mengakses metadata data table, definisi field, dan konfigurasi primary key. Biasanya berasal dari `ctx.blockModel.collection` atau `ctx.collectionField?.collection`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock** | Data table yang terikat ke block, dapat mengakses `name`, `getFields`, `filterTargetKey`, dll. |
| **JSField / JSItem / JSColumn** | Data table tempat field saat ini berada (atau data table parent block), untuk mendapatkan list field, primary key, dll. |
| **Kolom Tabel / Detail Block** | Render berdasarkan struktur data table, meneruskan `filterByTk` saat membuka popup, dll. |

> Perhatian: `ctx.collection` tersedia pada skenario yang terikat dengan data table seperti data block, form block, table block; jika JSBlock independen tidak terikat dengan data table mungkin `null`, disarankan melakukan pengecekan null sebelum digunakan.

## Definisi Tipe

```ts
collection: Collection | null | undefined;
```

## Properti Umum

| Properti | Tipe | Deskripsi |
|------|------|------|
| `name` | `string` | Nama data table (seperti `users`, `orders`) |
| `title` | `string` | Judul data table (mendukung i18n) |
| `filterTargetKey` | `string \| string[]` | Nama field primary key, untuk `filterByTk`, `getFilterByTK` |
| `dataSourceKey` | `string` | Key data source (seperti `main`) |
| `dataSource` | `DataSource` | Instance data source tempat data table berada |
| `template` | `string` | Template data table (seperti `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | List field yang dapat ditampilkan sebagai judul |
| `titleCollectionField` | `CollectionField` | Instance field judul |

## Method Umum

| Method | Deskripsi |
|------|------|
| `getFields(): CollectionField[]` | Mendapatkan semua field (termasuk inheritance) |
| `getField(name: string): CollectionField \| undefined` | Mendapatkan field tunggal berdasarkan nama field |
| `getFieldByPath(path: string): CollectionField \| undefined` | Mendapatkan field berdasarkan path (mendukung relasi, seperti `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Mendapatkan field relasi, `types` dapat `['one']`, `['many']`, dll. |
| `getFilterByTK(record): any` | Mengekstrak nilai primary key dari record, untuk `filterByTk` API |

## Hubungan dengan ctx.collectionField, ctx.blockModel

| Kebutuhan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Data table terkait konteks saat ini** | `ctx.collection` (setara `ctx.blockModel?.collection` atau `ctx.collectionField?.collection`) |
| **Definisi data table dari field saat ini** | `ctx.collectionField?.collection` (data table tempat field berada) |
| **Data table target relasi** | `ctx.collectionField?.targetCollection` (data table target dari field relasi) |

Pada skenario sub-table, `ctx.collection` mungkin merupakan data table target relasi; pada form/table biasa, biasanya merupakan data table yang terikat block.

## Contoh

### Mendapatkan Primary Key dan Membuka Popup

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Iterasi Field untuk Validasi atau Linkage

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} wajib diisi`);
    return;
  }
}
```

### Mendapatkan Field Relasi

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Untuk membangun sub-table, resource relasi, dll.
```

## Hal yang Perlu Diperhatikan

- `filterTargetKey` adalah nama field primary key dari data table; sebagian data table mungkin merupakan composite primary key `string[]`; saat tidak dikonfigurasi biasanya menggunakan `'id'` sebagai fallback.
- Pada skenario seperti **sub-table, field relasi**, `ctx.collection` mungkin menunjuk ke data table target relasi, berbeda dari `ctx.blockModel.collection`.
- `getFields()` akan menggabungkan field dari data table yang di-inherit, field sendiri menimpa field warisan dengan nama yang sama.

## Terkait

- [ctx.collectionField](./collection-field.md): Definisi field data table dari field saat ini
- [ctx.blockModel](./block-model.md): Parent block yang menampung JS saat ini, berisi `collection`
- [ctx.model](./model.md): Model saat ini, dapat berisi `collection`
