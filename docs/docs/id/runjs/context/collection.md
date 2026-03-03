:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/collection).
:::

# ctx.collection

Instans koleksi (Collection) yang terkait dengan konteks eksekusi RunJS saat ini, digunakan untuk mengakses metadata koleksi, definisi bidang (field), kunci utama (primary key), dan konfigurasi lainnya. Biasanya berasal dari `ctx.blockModel.collection` atau `ctx.collectionField?.collection`.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSBlock** | Koleksi yang terikat pada blok; dapat mengakses `name`, `getFields`, `filterTargetKey`, dll. |
| **JSField / JSItem / JSColumn** | Koleksi tempat bidang saat ini berada (atau koleksi dari blok induk), digunakan untuk mengambil daftar bidang, kunci utama, dll. |
| **Kolom Tabel / Blok Detail** | Digunakan untuk perenderan berdasarkan struktur koleksi atau meneruskan `filterByTk` saat membuka pop-up. |

> Catatan: `ctx.collection` tersedia dalam skenario di mana blok data, blok formulir, atau blok tabel terikat pada sebuah koleksi. Pada JSBlock independen yang tidak terikat pada koleksi, nilainya mungkin `null`. Disarankan untuk melakukan pemeriksaan nilai kosong (null check) sebelum digunakan.

## Definisi Tipe

```ts
collection: Collection | null | undefined;
```

## Properti Umum

| Properti | Tipe | Keterangan |
|------|------|------|
| `name` | `string` | Nama koleksi (misalnya `users`, `orders`) |
| `title` | `string` | Judul koleksi (termasuk internasionalisasi) |
| `filterTargetKey` | `string \| string[]` | Nama bidang kunci utama, digunakan untuk `filterByTk` dan `getFilterByTK` |
| `dataSourceKey` | `string` | Key sumber data (misalnya `main`) |
| `dataSource` | `DataSource` | Instans sumber data tempat koleksi berada |
| `template` | `string` | Templat koleksi (misalnya `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Daftar bidang yang dapat ditampilkan sebagai judul |
| `titleCollectionField` | `CollectionField` | Instans bidang judul |

## Metode Umum

| Metode | Keterangan |
|------|------|
| `getFields(): CollectionField[]` | Mengambil semua bidang (termasuk yang diwarisi) |
| `getField(name: string): CollectionField \| undefined` | Mengambil satu bidang berdasarkan nama bidang |
| `getFieldByPath(path: string): CollectionField \| undefined` | Mengambil bidang berdasarkan jalur (mendukung relasi, misalnya `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Mengambil bidang relasi; `types` dapat berupa `['one']`, `['many']`, dll. |
| `getFilterByTK(record): any` | Mengekstrak nilai kunci utama dari sebuah rekaman, digunakan untuk `filterByTk` pada API |

## Hubungan dengan ctx.collectionField dan ctx.blockModel

| Kebutuhan | Penggunaan yang Disarankan |
|------|----------|
| **Koleksi yang terkait dengan konteks saat ini** | `ctx.collection` (setara dengan `ctx.blockModel?.collection` atau `ctx.collectionField?.collection`) |
| **Definisi koleksi dari bidang saat ini** | `ctx.collectionField?.collection` (koleksi tempat bidang tersebut berada) |
| **Koleksi target relasi** | `ctx.collectionField?.targetCollection` (koleksi target dari sebuah bidang relasi) |

Dalam skenario seperti sub-tabel, `ctx.collection` mungkin merupakan koleksi target relasi; dalam formulir/tabel standar, biasanya merupakan koleksi yang terikat pada blok.

## Contoh

### Mengambil Kunci Utama dan Membuka Pop-up

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

### Iterasi Bidang untuk Validasi atau Keterkaitan (Linkage)

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

### Mengambil Bidang Relasi

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Digunakan untuk membangun sub-tabel, sumber daya terkait, dll.
```

## Catatan

- `filterTargetKey` adalah nama bidang kunci utama koleksi; beberapa koleksi mungkin menggunakan kunci komposit `string[]`; jika tidak dikonfigurasi, `'id'` biasanya digunakan sebagai cadangan (fallback).
- Dalam skenario seperti **sub-tabel atau bidang relasi**, `ctx.collection` mungkin merujuk ke koleksi target relasi, yang berbeda dengan `ctx.blockModel.collection`.
- `getFields()` menggabungkan bidang dari koleksi yang diwarisi; bidang lokal akan menimpa bidang warisan dengan nama yang sama.

## Terkait

- [ctx.collectionField](./collection-field.md): Definisi bidang koleksi dari bidang saat ini
- [ctx.blockModel](./block-model.md): Blok induk yang menampung JS saat ini, berisi `collection`
- [ctx.model](./model.md): Model saat ini, yang dapat berisi `collection`