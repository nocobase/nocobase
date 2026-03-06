:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/data-source).
:::

# ctx.dataSource

Instans `DataSource` yang terikat pada konteks eksekusi RunJS saat ini, digunakan untuk mengakses koleksi, metadata bidang (field), dan mengelola konfigurasi koleksi **di dalam sumber data saat ini**. Biasanya ini sesuai dengan sumber data yang dipilih pada halaman atau blok saat ini (misalnya basis data utama `main`).

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **Operasi Sumber Data Tunggal** | Mendapatkan metadata koleksi dan bidang ketika sumber data saat ini telah diketahui. |
| **Manajemen Koleksi** | Mendapatkan, menambah, memperbarui, atau menghapus koleksi di bawah sumber data saat ini. |
| **Mendapatkan Bidang berdasarkan Jalur** | Menggunakan format `namaKoleksi.jalurBidang` untuk mendapatkan definisi bidang (mendukung jalur relasi). |

> Catatan: `ctx.dataSource` mewakili satu sumber data untuk konteks saat ini; untuk mengenumerasi atau mengakses sumber data lain, silakan gunakan [ctx.dataSourceManager](./data-source-manager.md).

## Definisi Tipe

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Properti baca-saja
  get flowEngine(): FlowEngine;   // Instans FlowEngine saat ini
  get displayName(): string;      // Nama tampilan (mendukung i18n)
  get key(): string;              // Key sumber data, misal 'main'
  get name(): string;             // Sama dengan key

  // Pembacaan koleksi
  getCollections(): Collection[];                      // Mendapatkan semua koleksi
  getCollection(name: string): Collection | undefined; // Mendapatkan koleksi berdasarkan nama
  getAssociation(associationName: string): CollectionField | undefined; // Mendapatkan bidang relasi (misal users.roles)

  // Manajemen koleksi
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Metadata bidang
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Properti Umum

| Properti | Tipe | Keterangan |
|------|------|------|
| `key` | `string` | Key sumber data, misal `'main'` |
| `name` | `string` | Sama dengan key |
| `displayName` | `string` | Nama tampilan (mendukung i18n) |
| `flowEngine` | `FlowEngine` | Instans FlowEngine saat ini |

## Metode Umum

| Metode | Keterangan |
|------|------|
| `getCollections()` | Mendapatkan semua koleksi di bawah sumber data saat ini (sudah diurutkan dan difilter dari yang tersembunyi). |
| `getCollection(name)` | Mendapatkan koleksi berdasarkan nama; `name` dapat berupa `namaKoleksi.namaBidang` untuk mendapatkan koleksi target dari sebuah relasi. |
| `getAssociation(associationName)` | Mendapatkan definisi bidang relasi berdasarkan `namaKoleksi.namaBidang`. |
| `getCollectionField(fieldPath)` | Mendapatkan definisi bidang berdasarkan `namaKoleksi.jalurBidang`, mendukung jalur relasi seperti `users.profile.avatar`. |

## Hubungan dengan ctx.dataSourceManager

| Kebutuhan | Penggunaan yang Disarankan |
|------|----------|
| **Sumber data tunggal yang terikat pada konteks saat ini** | `ctx.dataSource` |
| **Titik masuk untuk semua sumber data** | `ctx.dataSourceManager` |
| **Mendapatkan koleksi di dalam sumber data saat ini** | `ctx.dataSource.getCollection(name)` |
| **Mendapatkan koleksi lintas sumber data** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Mendapatkan bidang di dalam sumber data saat ini** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Mendapatkan bidang lintas sumber data** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Contoh

### Mendapatkan Koleksi dan Bidang

```ts
// Mendapatkan semua koleksi
const collections = ctx.dataSource.getCollections();

// Mendapatkan koleksi berdasarkan nama
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Mendapatkan definisi bidang berdasarkan "namaKoleksi.jalurBidang" (mendukung relasi)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Mendapatkan Bidang Relasi

```ts
// Mendapatkan definisi bidang relasi berdasarkan namaKoleksi.namaBidang
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Proses berdasarkan struktur koleksi target
}
```

### Iterasi Koleksi untuk Pemrosesan Dinamis

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Melakukan Validasi atau UI Dinamis Berdasarkan Metadata Bidang

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Melakukan logika UI atau validasi berdasarkan interface, enum, validasi, dll.
}
```

## Catatan

- Format jalur untuk `getCollectionField(fieldPath)` adalah `namaKoleksi.jalurBidang`, di mana segmen pertama adalah nama koleksi dan segmen berikutnya adalah jalur bidang (mendukung relasi, misal `user.name`).
- `getCollection(name)` mendukung format `namaKoleksi.namaBidang`, yang mengembalikan koleksi target dari bidang relasi tersebut.
- Dalam konteks RunJS, `ctx.dataSource` biasanya ditentukan oleh sumber data dari blok atau halaman saat ini. Jika tidak ada sumber data yang terikat pada konteks, nilainya mungkin `undefined`; disarankan untuk melakukan pemeriksaan nilai kosong sebelum digunakan.

## Terkait

- [ctx.dataSourceManager](./data-source-manager.md): Manajer sumber data, mengelola semua sumber data.
- [ctx.collection](./collection.md): Koleksi yang terkait dengan konteks saat ini.
- [ctx.collectionField](./collection-field.md): Definisi bidang koleksi untuk bidang saat ini.