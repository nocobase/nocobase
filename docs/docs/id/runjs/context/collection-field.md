:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/collection-field).
:::

# ctx.collectionField

Instansi field koleksi (`CollectionField`) yang terkait dengan konteks eksekusi RunJS saat ini, digunakan untuk mengakses metadata field, tipe, aturan validasi, dan informasi relasi. Instansi ini hanya ada jika field terikat pada definisi koleksi; field kustom/virtual mungkin bernilai `null`.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSField** | Melakukan keterkaitan (linkage) atau validasi dalam field formulir berdasarkan `interface`, `enum`, `targetCollection`, dll. |
| **JSItem** | Mengakses metadata field yang sesuai dengan kolom saat ini dalam item sub-tabel. |
| **JSColumn** | Memilih metode rendering berdasarkan `collectionField.interface` atau mengakses `targetCollection` dalam kolom tabel. |

> Catatan: `ctx.collectionField` hanya tersedia saat field terikat pada definisi Koleksi (Collection); dalam skenario seperti blok independen JSBlock atau event tindakan tanpa pengikatan field, nilainya biasanya `undefined`. Disarankan untuk melakukan pemeriksaan nilai kosong sebelum digunakan.

## Definisi Tipe

```ts
collectionField: CollectionField | null | undefined;
```

## Properti Umum

| Properti | Tipe | Keterangan |
|------|------|------|
| `name` | `string` | Nama field (misalnya, `status`, `userId`) |
| `title` | `string` | Judul field (termasuk internasionalisasi) |
| `type` | `string` | Tipe data field (`string`, `integer`, `belongsTo`, dll.) |
| `interface` | `string` | Tipe antarmuka field (`input`, `select`, `m2o`, `o2m`, `m2m`, dll.) |
| `collection` | `Collection` | Koleksi tempat field berada |
| `targetCollection` | `Collection` | Koleksi target dari field asosiasi (hanya ada untuk tipe asosiasi) |
| `target` | `string` | Nama koleksi target (untuk field asosiasi) |
| `enum` | `array` | Opsi enumerasi (select, radio, dll.) |
| `defaultValue` | `any` | Nilai default |
| `collectionName` | `string` | Nama koleksi pemilik field |
| `foreignKey` | `string` | Nama field kunci asing (belongsTo, dll.) |
| `sourceKey` | `string` | Kunci sumber asosiasi (hasMany, dll.) |
| `targetKey` | `string` | Kunci target asosiasi |
| `fullpath` | `string` | Jalur lengkap (misalnya, `main.users.status`), digunakan untuk API atau referensi variabel |
| `resourceName` | `string` | Nama sumber daya (misalnya, `users.status`) |
| `readonly` | `boolean` | Apakah field bersifat hanya baca |
| `titleable` | `boolean` | Apakah field dapat ditampilkan sebagai judul |
| `validation` | `object` | Konfigurasi aturan validasi |
| `uiSchema` | `object` | Konfigurasi UI |
| `targetCollectionTitleField` | `CollectionField` | Field judul dari koleksi target (untuk field asosiasi) |

## Metode Umum

| Metode | Keterangan |
|------|------|
| `isAssociationField(): boolean` | Apakah merupakan field asosiasi (belongsTo, hasMany, hasOne, belongsToMany, dll.) |
| `isRelationshipField(): boolean` | Apakah merupakan field relasi (termasuk o2o, m2o, o2m, m2m, dll.) |
| `getComponentProps(): object` | Mendapatkan props default dari komponen field |
| `getFields(): CollectionField[]` | Mendapatkan daftar field dari koleksi target (hanya untuk field asosiasi) |
| `getFilterOperators(): object[]` | Mendapatkan operator filter yang didukung oleh field ini (misalnya, `$eq`, `$ne`, dll.) |

## Contoh

### Rendering percabangan berdasarkan tipe field

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Field asosiasi: tampilkan rekaman terkait
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Menentukan apakah field asosiasi dan mengakses koleksi target

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Proses sesuai dengan struktur koleksi target
}
```

### Mendapatkan opsi enumerasi

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Rendering kondisional berdasarkan mode hanya baca/tampilan

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Mendapatkan field judul dari koleksi target

```ts
// Saat menampilkan field asosiasi, gunakan targetCollectionTitleField untuk mendapatkan nama field judul
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Hubungan dengan ctx.collection

| Kebutuhan | Penggunaan yang Disarankan |
|------|----------|
| **Koleksi pemilik field saat ini** | `ctx.collectionField?.collection` atau `ctx.collection` |
| **Metadata field (nama, tipe, antarmuka, enum, dll.)** | `ctx.collectionField` |
| **Koleksi target asosiasi** | `ctx.collectionField?.targetCollection` |

`ctx.collection` biasanya mewakili koleksi yang terikat pada blok saat ini; `ctx.collectionField` mewakili definisi field saat ini dalam koleksi tersebut. Dalam skenario seperti sub-tabel atau field asosiasi, keduanya mungkin berbeda.

## Catatan

- Dalam skenario seperti **JSBlock** atau **JSAction (tanpa pengikatan field)**, `ctx.collectionField` biasanya bernilai `undefined`. Disarankan untuk menggunakan optional chaining sebelum mengaksesnya.
- Jika field JS kustom tidak terikat pada field koleksi, `ctx.collectionField` mungkin bernilai `null`.
- `targetCollection` hanya ada untuk field tipe asosiasi (misalnya, m2o, o2m, m2m); `enum` hanya ada untuk field dengan opsi seperti select atau radioGroup.

## Terkait

- [ctx.collection](./collection.md): Koleksi yang terkait dengan konteks saat ini
- [ctx.model](./model.md): Model tempat konteks eksekusi saat ini berada
- [ctx.blockModel](./block-model.md): Blok induk yang memuat JS saat ini
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Membaca dan menulis nilai field saat ini