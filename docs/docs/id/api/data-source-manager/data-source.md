:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# DataSource (abstrak)

`DataSource` adalah kelas abstrak yang digunakan untuk merepresentasikan jenis sumber data, seperti database, API, dan lain-lain.

## Anggota

### collectionManager

Instans CollectionManager untuk sumber data, yang harus mengimplementasikan antarmuka [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

Instans resourceManager untuk sumber data.

### acl

Instans ACL untuk sumber data.

## API

### constructor()

Konstruktor, membuat instans `DataSource`.

#### Tanda Tangan

- `constructor(options: DataSourceOptions)`

### init()

Fungsi inisialisasi, dipanggil segera setelah `constructor`.

#### Tanda Tangan

- `init(options: DataSourceOptions)`

### name

#### Tanda Tangan

- `get name()`

Mengembalikan nama instans sumber data.

### middleware()

Mendapatkan middleware untuk DataSource, yang digunakan untuk dipasang ke Server untuk menerima permintaan.

### testConnection()

Metode statis yang dipanggil selama operasi pengujian koneksi. Ini dapat digunakan untuk validasi parameter, dan subkelas mengimplementasikan logika spesifiknya.

#### Tanda Tangan

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Tanda Tangan

- `async load(options: any = {})`

Operasi pemuatan untuk sumber data. Subkelas mengimplementasikan logikanya.

### createCollectionManager()

#### Tanda Tangan
- `abstract createCollectionManager(options?: any): ICollectionManager`

Membuat instans CollectionManager untuk sumber data. Subkelas mengimplementasikan logikanya.

### createResourceManager()

Membuat instans ResourceManager untuk sumber data. Subkelas dapat menimpa implementasinya. Secara default, ini membuat `ResourceManager` dari `@nocobase/resourcer`.

### createACL()

- Membuat instans ACL untuk DataSource. Subkelas dapat menimpa implementasinya. Secara default, ini membuat `ACL` dari `@nocobase/acl`.