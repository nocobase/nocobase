---
title: "DataSourceManager Manajemen Data Source"
description: "Manajemen data source server NocoBase: app.dataSourceManager, multi data source, addDataSource, getDataSource."
keywords: "DataSourceManager,manajemen data source,multi data source,addDataSource,getDataSource,NocoBase"
---

# DataSourceManager Manajemen Data Source

NocoBase menyediakan `DataSourceManager` untuk mengelola beberapa data source. Setiap `DataSource` memiliki instance `Database`, `ResourceManager`, dan `ACL` sendiri, sehingga Anda dapat mengelola dan memperluas data source yang berbeda dengan fleksibel.

## Konsep Dasar

Setiap instance `DataSource` berisi konten berikut:

- **`dataSource.collectionManager`**: Digunakan untuk mengelola tabel data dan field.
- **`dataSource.resourceManager`**: Menangani operasi terkait resource (seperti CRUD, dll.).
- **`dataSource.acl`**: Access Control List (ACL) untuk operasi resource.

Untuk memudahkan akses, NocoBase menyediakan alias singkat untuk member terkait data source utama:

- `app.db` setara dengan `dataSourceManager.get('main').collectionManager.db`
- `app.acl` setara dengan `dataSourceManager.get('main').acl`
- `app.resourceManager` setara dengan `dataSourceManager.get('main').resourceManager`

## Method Umum

### dataSourceManager.get(dataSourceKey)

Mengembalikan instance `DataSource` yang ditentukan.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Mendaftarkan middleware untuk semua data source, akan mempengaruhi operasi semua data source.

```ts
dataSourceManager.use(async (ctx, next) => {
  console.log('Middleware ini berlaku untuk semua data source');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Dieksekusi sebelum data source dimuat. Biasanya digunakan untuk registrasi class statis, seperti registrasi class model dan tipe field:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Mendaftarkan tipe field kustom
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Dieksekusi setelah data source dimuat. Biasanya digunakan untuk mendaftarkan operasi, mengatur kontrol akses, dll.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Pengguna login dapat mengakses
});
```

## Ekstensi Data Source

Untuk cara ekstensi data source yang lengkap, silakan merujuk ke bagian ekstensi data source.

## Tautan Terkait

- [Database](./database.md) — CRUD, Repository, transaksi, dan event database
- [Collections Tabel Data](./collections.md) — Mendefinisikan atau memperluas struktur tabel data dengan kode
- [ResourceManager Manajemen Resource](./resource-manager.md) — Mendaftarkan API kustom dan operasi resource
- [ACL Kontrol Hak Akses](./acl.md) — Hak akses role, snippet hak akses, dan kontrol akses
- [Plugin](./plugin.md) — Siklus hidup class plugin, member method, dan objek `app`