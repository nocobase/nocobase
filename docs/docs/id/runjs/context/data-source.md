---
title: "ctx.dataSource"
description: "ctx.dataSource adalah instance data source saat ini, untuk mengakses Collection, Repository, dan menentukan data source pada skenario multi-data-source."
keywords: "ctx.dataSource,data source,Collection,Repository,multi-data-source,konteks RunJS,NocoBase"
---

# ctx.dataSource

Instance data source (`DataSource`) yang terikat dengan konteks eksekusi RunJS saat ini, digunakan untuk mengakses data table, metadata field, dan mengelola konfigurasi data table **dalam data source saat ini**. Biasanya sesuai dengan data source yang dipilih halaman/block saat ini (seperti database utama `main`).

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **Operasi Single Data Source** | Saat data source saat ini diketahui, mendapatkan metadata data table dan field |
| **Manajemen Data Table** | Mendapatkan/menambah/memperbarui/menghapus data table di data source saat ini |
| **Mendapatkan Field Berdasarkan Path** | Menggunakan format `collectionName.fieldPath` untuk mendapatkan definisi field (mendukung path relasi) |

> Perhatian: `ctx.dataSource` merepresentasikan data source tunggal dari konteks saat ini; jika ingin enumerate atau mengakses data source lain, gunakan [ctx.dataSourceManager](./data-source-manager.md).

## Definisi Tipe

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Properti read-only
  get flowEngine(): FlowEngine;   // Instance FlowEngine saat ini
  get displayName(): string;      // Nama tampilan (mendukung i18n)
  get key(): string;              // Key data source, seperti 'main'
  get name(): string;             // Sama dengan key

  // Pembacaan data table
  getCollections(): Collection[];                      // Mendapatkan semua data table
  getCollection(name: string): Collection | undefined; // Mendapatkan data table berdasarkan nama
  getAssociation(associationName: string): CollectionField | undefined; // Mendapatkan field relasi (seperti users.roles)

  // Manajemen data table
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Metadata field
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Properti Umum

| Properti | Tipe | Deskripsi |
|------|------|------|
| `key` | `string` | Key data source, seperti `'main'` |
| `name` | `string` | Sama dengan key |
| `displayName` | `string` | Nama tampilan (mendukung i18n) |
| `flowEngine` | `FlowEngine` | Instance FlowEngine saat ini |

## Method Umum

| Method | Deskripsi |
|------|------|
| `getCollections()` | Mendapatkan semua data table di data source saat ini (sudah diurutkan, disaring yang tersembunyi) |
| `getCollection(name)` | Mendapatkan data table berdasarkan nama; `name` dapat berupa `collectionName.fieldName` untuk mendapatkan data table target relasi |
| `getAssociation(associationName)` | Mendapatkan definisi field relasi berdasarkan `collectionName.fieldName` |
| `getCollectionField(fieldPath)` | Mendapatkan definisi field berdasarkan `collectionName.fieldPath`, mendukung path relasi seperti `users.profile.avatar` |

## Hubungan dengan ctx.dataSourceManager

| Kebutuhan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Data source tunggal yang terikat konteks saat ini** | `ctx.dataSource` |
| **Entry point semua data source** | `ctx.dataSourceManager` |
| **Mendapatkan data table di dalam data source saat ini** | `ctx.dataSource.getCollection(name)` |
| **Mendapatkan data table lintas data source** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Mendapatkan field di dalam data source saat ini** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Mendapatkan field lintas data source** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Contoh

### Mendapatkan Data Table dan Field

```ts
// Mendapatkan semua data table
const collections = ctx.dataSource.getCollections();

// Mendapatkan data table berdasarkan nama
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Mendapatkan definisi field berdasarkan "data table.path field" (mendukung relasi)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Mendapatkan Field Relasi

```ts
// Mendapatkan definisi field relasi berdasarkan collectionName.fieldName
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Proses berdasarkan struktur data table target
}
```

### Iterasi Data Table untuk Pemrosesan Dinamis

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Validasi atau UI Dinamis Berdasarkan Metadata Field

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // UI atau validasi berdasarkan interface, enum, validation, dll.
}
```

## Hal yang Perlu Diperhatikan

- Format path `getCollectionField(fieldPath)` adalah `collectionName.fieldPath`, segmen pertama adalah nama data table, selanjutnya adalah path field (mendukung relasi, seperti `user.name`).
- `getCollection(name)` mendukung bentuk `collectionName.fieldName`, mengembalikan data table target dari field relasi.
- `ctx.dataSource` pada konteks RunJS biasanya ditentukan oleh data source dari block/halaman saat ini; jika konteks tidak terikat dengan data source, mungkin `undefined`, disarankan melakukan pengecekan null sebelum digunakan.

## Terkait

- [ctx.dataSourceManager](./data-source-manager.md): Manajer data source, mengelola semua data source
- [ctx.collection](./collection.md): Data table terkait konteks saat ini
- [ctx.collectionField](./collection-field.md): Definisi field data table dari field saat ini
