:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

Manajer sumber data (instans `DataSourceManager`), digunakan untuk mengelola dan mengakses beberapa sumber data (seperti basis data utama `main`, basis data log `logging`, dll.). Digunakan saat terdapat beberapa sumber data atau saat diperlukan akses metadata lintas sumber data.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **Multi-sumber data** | Mencantumkan semua sumber data, atau mendapatkan sumber data tertentu berdasarkan key. |
| **Akses lintas sumber data** | Mengakses metadata menggunakan format "key sumber data + nama koleksi" ketika sumber data dari konteks saat ini tidak diketahui. |
| **Mendapatkan field berdasarkan jalur lengkap** | Menggunakan format `dataSourceKey.collectionName.fieldPath` untuk mengambil definisi field di berbagai sumber data yang berbeda. |

> Catatan: Jika Anda hanya beroperasi pada sumber data saat ini, prioritaskan penggunaan `ctx.dataSource`. Gunakan `ctx.dataSourceManager` hanya saat Anda perlu mencantumkan atau beralih di antara sumber data.

## Definisi Tipe

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Pengelolaan sumber data
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Membaca sumber data
  getDataSources(): DataSource[];                     // Mendapatkan semua sumber data
  getDataSource(key: string): DataSource | undefined;  // Mendapatkan sumber data berdasarkan key

  // Mengakses metadata secara langsung berdasarkan sumber data + koleksi
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Hubungan dengan ctx.dataSource

| Kebutuhan | Penggunaan yang Disarankan |
|------|----------|
| **Sumber data tunggal yang terikat dengan konteks saat ini** | `ctx.dataSource` (misalnya, sumber data dari halaman/blok saat ini) |
| **Titik masuk untuk semua sumber data** | `ctx.dataSourceManager` |
| **Mencantumkan atau beralih sumber data** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Mendapatkan koleksi dalam sumber data saat ini** | `ctx.dataSource.getCollection(name)` |
| **Mendapatkan koleksi lintas sumber data** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Mendapatkan field dalam sumber data saat ini** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Mendapatkan field lintas sumber data** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Contoh

### Mendapatkan Sumber Data Tertentu

```ts
// Mendapatkan sumber data bernama 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Mendapatkan semua koleksi di bawah sumber data ini
const collections = mainDS?.getCollections();
```

### Mengakses Metadata Koleksi Lintas Sumber Data

```ts
// Mendapatkan koleksi berdasarkan dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Mendapatkan primary key dari koleksi
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Mendapatkan Definisi Field berdasarkan Jalur Lengkap

```ts
// Format: dataSourceKey.collectionName.fieldPath
// Mendapatkan definisi field berdasarkan "key sumber data.nama koleksi.jalur field"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Mendukung jalur field relasi
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Melakukan Iterasi Melalui Semua Sumber Data

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Sumber Data: ${ds.key}, Nama Tampilan: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Koleksi: ${col.name}`);
  }
}
```

### Memilih Sumber Data Secara Dinamis Berdasarkan Variabel

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Catatan

- Format jalur untuk `getCollectionField` adalah `dataSourceKey.collectionName.fieldPath`, di mana segmen pertama adalah key sumber data, diikuti oleh nama koleksi dan jalur field.
- `getDataSource(key)` mengembalikan `undefined` jika sumber data tidak ada; disarankan untuk melakukan pemeriksaan nilai null sebelum digunakan.
- `addDataSource` akan melempar pengecualian jika key sudah ada; `upsertDataSource` akan menimpa yang sudah ada atau menambahkan yang baru.

## Terkait

- [ctx.dataSource](./data-source.md): Instans sumber data saat ini
- [ctx.collection](./collection.md): Koleksi yang terkait dengan konteks saat ini
- [ctx.collectionField](./collection-field.md): Definisi field koleksi untuk field saat ini