---
title: "ctx.collectionField"
description: "ctx.collectionField adalah instance Collection Field yang sesuai dengan field saat ini, untuk mendapatkan metadata field dan konfigurasi relasi."
keywords: "ctx.collectionField,Collection Field,metadata field,konfigurasi relasi,RunJS,NocoBase"
---

# ctx.collectionField

Instance field data table (CollectionField) yang terkait dengan konteks eksekusi RunJS saat ini, untuk mengakses metadata field, tipe, aturan validasi, dan informasi relasi. Hanya ada saat field terikat ke definisi data table; field kustom/virtual mungkin `null`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSField** | Pada form field, melakukan linkage atau validasi berdasarkan `interface`, `enum`, `targetCollection`, dll. |
| **JSItem** | Pada item sub-table, mengakses metadata field yang sesuai dengan kolom saat ini |
| **JSColumn** | Pada kolom tabel, memilih cara render berdasarkan `collectionField.interface`, atau mengakses `targetCollection` |

> Perhatian: `ctx.collectionField` hanya tersedia saat field terikat ke definisi data table (Collection); pada skenario seperti JSBlock independen, action event tanpa field binding biasanya `undefined`, disarankan melakukan pengecekan null sebelum digunakan.

## Definisi Tipe

```ts
collectionField: CollectionField | null | undefined;
```

## Properti Umum

| Properti | Tipe | Deskripsi |
|------|------|------|
| `name` | `string` | Nama field (seperti `status`, `userId`) |
| `title` | `string` | Judul field (termasuk i18n) |
| `type` | `string` | Tipe data field (`string`, `integer`, `belongsTo`, dll.) |
| `interface` | `string` | Tipe interface field (`input`, `select`, `m2o`, `o2m`, `m2m`, dll.) |
| `collection` | `Collection` | Data table tempat field berada |
| `targetCollection` | `Collection` | Data table target dari field relasi (hanya ada untuk tipe relasi) |
| `target` | `string` | Nama data table target (field relasi) |
| `enum` | `array` | Opsi enum (select, radio, dll.) |
| `defaultValue` | `any` | Nilai default |
| `collectionName` | `string` | Nama data table tempat field berada |
| `foreignKey` | `string` | Nama field foreign key (belongsTo, dll.) |
| `sourceKey` | `string` | Source key relasi (hasMany, dll.) |
| `targetKey` | `string` | Target key relasi |
| `fullpath` | `string` | Path lengkap (seperti `main.users.status`), untuk referensi API atau variabel |
| `resourceName` | `string` | Nama resource (seperti `users.status`) |
| `readonly` | `boolean` | Apakah read-only |
| `titleable` | `boolean` | Apakah dapat ditampilkan sebagai judul |
| `validation` | `object` | Konfigurasi aturan validasi |
| `uiSchema` | `object` | Konfigurasi UI |
| `targetCollectionTitleField` | `CollectionField` | Field judul dari data table target relasi (field relasi) |

## Method Umum

| Method | Deskripsi |
|------|------|
| `isAssociationField(): boolean` | Apakah field relasi (belongsTo, hasMany, hasOne, belongsToMany, dll.) |
| `isRelationshipField(): boolean` | Apakah field tipe relationship (termasuk o2o, m2o, o2m, m2m, dll.) |
| `getComponentProps(): object` | Mendapatkan props default dari komponen field |
| `getFields(): CollectionField[]` | Mendapatkan list field dari data table target relasi (hanya field relasi) |
| `getFilterOperators(): object[]` | Mendapatkan operator filter yang didukung field tersebut (seperti `$eq`, `$ne`, dll.) |

## Contoh

### Render Cabang Berdasarkan Tipe Field

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Field relasi: tampilkan record relasi
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Memeriksa Apakah Field Relasi dan Mengakses Data Table Target

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Proses berdasarkan struktur data table target
}
```

### Mendapatkan Opsi Enum

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Render Bersyarat Berdasarkan Mode Read-only/Display

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Mendapatkan Field Judul dari Data Table Target Relasi

```ts
// Saat menampilkan field relasi, dapat menggunakan titleCollectionField dari data table target untuk mendapatkan nama field judul
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Hubungan dengan ctx.collection

| Kebutuhan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Data table tempat field saat ini berada** | `ctx.collectionField?.collection` atau `ctx.collection` |
| **Metadata field (nama, tipe, interface, enum, dll.)** | `ctx.collectionField` |
| **Data table target relasi** | `ctx.collectionField?.targetCollection` |

`ctx.collection` biasanya merepresentasikan data table yang terikat block saat ini; `ctx.collectionField` merepresentasikan definisi field saat ini di data table. Pada skenario seperti sub-table, field relasi, keduanya mungkin berbeda.

## Hal yang Perlu Diperhatikan

- Pada skenario seperti **JSBlock**, **JSAction (tanpa field binding)**, `ctx.collectionField` biasanya `undefined`, disarankan menggunakan optional chaining sebelum mengakses.
- JS field kustom yang tidak terikat ke field data table, `ctx.collectionField` mungkin `null`.
- `targetCollection` hanya ada pada field tipe relasi (seperti m2o, o2m, m2m); `enum` hanya ada pada field dengan opsi seperti select, radioGroup.

## Terkait

- [ctx.collection](./collection.md): Data table terkait konteks saat ini
- [ctx.model](./model.md): Model dalam konteks eksekusi saat ini
- [ctx.blockModel](./block-model.md): Parent block yang menampung JS saat ini
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Membaca/menulis nilai field saat ini
