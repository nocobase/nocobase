:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# DataSourceManager: Manajemen Sumber Data

NocoBase menyediakan `DataSourceManager` untuk mengelola banyak sumber data. Setiap `DataSource` memiliki instans `Database`, `ResourceManager`, dan `ACL` sendiri, sehingga memudahkan pengembang untuk mengelola dan memperluas berbagai sumber data secara fleksibel.

## Konsep Dasar

Setiap instans `DataSource` mencakup hal-hal berikut:

- **`dataSource.collectionManager`**: Digunakan untuk mengelola koleksi dan kolom.
- **`dataSource.resourceManager`**: Menangani operasi terkait sumber daya (misalnya, CRUD, dll.).
- **`dataSource.acl`**: Kontrol akses (ACL) untuk operasi sumber daya.

Untuk akses yang mudah, alias disediakan untuk anggota sumber data utama:

- `app.db` setara dengan `dataSourceManager.get('main').collectionManager.db`
- `app.acl` setara dengan `dataSourceManager.get('main').acl`
- `app.resourceManager` setara dengan `dataSourceManager.get('main').resourceManager`

## Metode Umum

### dataSourceManager.get(dataSourceKey)

Metode ini mengembalikan instans `DataSource` yang ditentukan.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Mendaftarkan middleware untuk semua sumber data. Ini akan memengaruhi operasi pada semua sumber data.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Dieksekusi sebelum pemuatan sumber data. Umumnya digunakan untuk pendaftaran kelas statis, seperti kelas model dan pendaftaran tipe kolom:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Tipe kolom kustom
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Dieksekusi setelah pemuatan sumber data. Umumnya digunakan untuk mendaftarkan operasi, mengatur kontrol akses, dll.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Mengatur izin akses
});
```

## Ekstensi Sumber Data

Untuk ekstensi sumber data yang lengkap, silakan merujuk ke bab ekstensi sumber data.