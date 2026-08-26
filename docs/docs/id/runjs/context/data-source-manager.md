---
title: "ctx.dataSourceManager"
description: "ctx.dataSourceManager adalah manajer data source, untuk mendapatkan instance multi-data-source, Collection, dan Repository."
keywords: "ctx.dataSourceManager,manajer data source,Collection,Repository,multi-data-source,RunJS,NocoBase"
---

# ctx.dataSourceManager

Manajer data source (instance `DataSourceManager`), untuk mengelola dan mengakses berbagai data source (seperti database utama `main`, database log `logging`, dll.). Digunakan saat ada multi-data-source atau perlu mengakses metadata lintas data source.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **Multi-Data-Source** | Enumerate semua data source, mendapatkan data source tertentu berdasarkan key |
| **Akses Lintas Data Source** | Saat data source dari konteks saat ini tidak diketahui, mengakses metadata berdasarkan "key data source + nama data table" |
| **Mendapatkan Field Berdasarkan Path Lengkap** | Menggunakan format `dataSourceKey.collectionName.fieldPath` untuk mendapatkan definisi field lintas data source |

> Perhatian: Jika hanya beroperasi pada data source saat ini, lebih utamakan `ctx.dataSource`; gunakan `ctx.dataSourceManager` saat perlu enumerate atau berpindah data source.

## Definisi Tipe

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Manajemen data source
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Pembacaan data source
  getDataSources(): DataSource[];                     // Mendapatkan semua data source
  getDataSource(key: string): DataSource | undefined;  // Mendapatkan data source berdasarkan key

  // Mengakses metadata berdasarkan data source + data table
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Hubungan dengan ctx.dataSource

| Kebutuhan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Data source tunggal yang terikat konteks saat ini** | `ctx.dataSource` (seperti data source dari halaman/block saat ini) |
| **Entry point semua data source** | `ctx.dataSourceManager` |
| **Enumerate atau berpindah data source** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Mendapatkan data table di dalam data source saat ini** | `ctx.dataSource.getCollection(name)` |
| **Mendapatkan data table lintas data source** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Mendapatkan field di dalam data source saat ini** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Mendapatkan field lintas data source** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Contoh

### Mendapatkan Data Source Tertentu

```ts
// Mendapatkan data source bernama 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Mendapatkan semua data table di bawah data source tersebut
const collections = mainDS?.getCollections();
```

### Mengakses Metadata Data Table Lintas Data Source

```ts
// Mendapatkan data table berdasarkan dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Mendapatkan primary key data table
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Mendapatkan Definisi Field Berdasarkan Path Lengkap

```ts
// Format: dataSourceKey.collectionName.fieldPath
// Mendapatkan definisi field berdasarkan "key data source.data table.path field"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Mendukung path field relasi
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Iterasi Semua Data Source

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Data source: ${ds.key}, Nama tampilan: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Data table: ${col.name}`);
  }
}
```

### Memilih Data Source secara Dinamis Berdasarkan Variabel

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Hal yang Perlu Diperhatikan

- Format path `getCollectionField` adalah `dataSourceKey.collectionName.fieldPath`, segmen pertama adalah key data source, selanjutnya adalah nama data table dan path field.
- `getDataSource(key)` mengembalikan `undefined` jika data source tidak ada, disarankan melakukan pengecekan null sebelum digunakan.
- `addDataSource` akan melempar exception jika key sudah ada; `upsertDataSource` akan menimpa atau menambah.

## Terkait

- [ctx.dataSource](./data-source.md): Instance data source saat ini
- [ctx.collection](./collection.md): Data table terkait konteks saat ini
- [ctx.collectionField](./collection-field.md): Definisi field data table dari field saat ini
