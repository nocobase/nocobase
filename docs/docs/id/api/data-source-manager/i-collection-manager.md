:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# ICollectionManager

Antarmuka `ICollectionManager` digunakan untuk mengelola instans `koleksi` dari sebuah `sumber data`.

## API

### registerFieldTypes()

Mendaftarkan tipe bidang (field types) dalam sebuah `koleksi`.

#### Signature

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Mendaftarkan `Interface` dari sebuah `koleksi`.

#### Signature

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Mendaftarkan `Collection Template`.

#### Signature

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Mendaftarkan `Model`.

#### Signature

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Mendaftarkan `Repository`.

#### Signature

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Mendapatkan instans `Repository` yang terdaftar.

#### Signature

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Mendefinisikan sebuah `koleksi`.

#### Signature

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Memodifikasi properti dari `koleksi` yang sudah ada.

#### Signature

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Memeriksa apakah sebuah `koleksi` ada.

#### Signature

- `hasCollection(name: string): boolean`

### getCollection()

Mendapatkan instans `koleksi`.

#### Signature

- `getCollection(name: string): ICollection`

### getCollections()

Mendapatkan semua instans `koleksi`.

#### Signature

- `getCollections(): Array<ICollection>`

### getRepository()

Mendapatkan instans `Repository`.

#### Signature

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Melakukan sinkronisasi `sumber data`. Logika implementasinya dilakukan oleh subkelas.

#### Signature

- `sync(): Promise<void>`