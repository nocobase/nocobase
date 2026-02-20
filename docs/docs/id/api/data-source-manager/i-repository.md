:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# IRepository

Antarmuka `Repository` mendefinisikan serangkaian metode operasi model untuk mengadaptasi operasi CRUD pada **sumber data**.

## API

### find()

Mengembalikan daftar model yang sesuai dengan parameter kueri.

#### Signature

- `find(options?: any): Promise<IModel[]>`

### findOne()

Mengembalikan satu model yang sesuai dengan parameter kueri. Jika terdapat beberapa model yang cocok, hanya model pertama yang akan dikembalikan.

#### Signature

- `findOne(options?: any): Promise<IModel>`

### count()

Mengembalikan jumlah model yang sesuai dengan parameter kueri.

#### Signature

- `count(options?: any): Promise<Number>`

### findAndCount()

Mengembalikan daftar dan jumlah model yang sesuai dengan parameter kueri.

#### Signature

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Membuat objek data model.

#### Signature

- `create(options: any): void`

### update()

Memperbarui objek data model berdasarkan kondisi kueri.

#### Signature

- `update(options: any): void`

### destroy()

Menghapus objek data model berdasarkan kondisi kueri.

#### Signature

- `destroy(options: any): void`