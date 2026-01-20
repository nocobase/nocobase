:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Bidang

## Gambaran Umum

Kelas manajemen bidang **koleksi** (kelas abstrak). Ini juga merupakan kelas dasar untuk semua jenis bidang. Setiap jenis bidang lainnya diimplementasikan dengan mewarisi kelas ini.

Untuk cara menyesuaikan bidang, silakan lihat [Memperluas Jenis Bidang]

## Konstruktor

Biasanya tidak dipanggil langsung oleh pengembang, melainkan terutama melalui metode `db.collection({ fields: [] })` sebagai titik masuk proxy.

Saat memperluas bidang, ini terutama diimplementasikan dengan mewarisi kelas abstrak `Field` dan kemudian mendaftarkannya ke dalam instans Database.

**Tanda Tangan**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parameter**

| Nama Parameter       | Tipe           | Nilai Default | Deskripsi                                     |
| -------------------- | -------------- | ------ | ---------------------------------------- |
| `options`            | `FieldOptions` | -      | Objek konfigurasi bidang                 |
| `options.name`       | `string`       | -      | Nama bidang                              |
| `options.type`       | `string`       | -      | Tipe bidang, sesuai dengan nama tipe bidang yang terdaftar di db |
| `context`            | `FieldContext` | -      | Objek konteks bidang                     |
| `context.database`   | `Database`     | -      | Instans database                         |
| `context.collection` | `Collection`   | -      | Instans **koleksi**                      |

## Anggota Instans

### `name`

Nama bidang.

### `type`

Tipe bidang.

### `dataType`

Tipe penyimpanan database bidang.

### `options`

Parameter konfigurasi inisialisasi bidang.

### `context`

Objek konteks bidang.

## Metode Konfigurasi

### `on()`

Metode definisi singkat berdasarkan peristiwa **koleksi**. Setara dengan `db.on(this.collection.name + '.' + eventName, listener)`.

Biasanya tidak perlu menimpa metode ini saat mewarisi.

**Tanda Tangan**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parameter**

| Nama Parameter | Tipe                       | Nilai Default | Deskripsi       |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string`                   | -      | Nama peristiwa |
| `listener`  | `(...args: any[]) => void` | -      | Pendengar peristiwa |

### `off()`

Metode penghapusan singkat berdasarkan peristiwa **koleksi**. Setara dengan `db.off(this.collection.name + '.' + eventName, listener)`.

Biasanya tidak perlu menimpa metode ini saat mewarisi.

**Tanda Tangan**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parameter**

| Nama Parameter | Tipe                       | Nilai Default | Deskripsi       |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string`                   | -      | Nama peristiwa |
| `listener`  | `(...args: any[]) => void` | -      | Pendengar peristiwa |

### `bind()`

Konten yang akan dieksekusi ketika bidang ditambahkan ke **koleksi**. Biasanya digunakan untuk menambahkan pendengar peristiwa **koleksi** dan pemrosesan lainnya.

Saat mewarisi, Anda perlu memanggil metode `super.bind()` yang sesuai terlebih dahulu.

**Tanda Tangan**

- `bind()`

### `unbind()`

Konten yang akan dieksekusi ketika bidang dihapus dari **koleksi**. Biasanya digunakan untuk menghapus pendengar peristiwa **koleksi** dan pemrosesan lainnya.

Saat mewarisi, Anda perlu memanggil metode `super.unbind()` yang sesuai terlebih dahulu.

**Tanda Tangan**

- `unbind()`

### `get()`

Mendapatkan nilai item konfigurasi bidang.

**Tanda Tangan**

- `get(key: string): any`

**Parameter**

| Nama Parameter | Tipe     | Nilai Default | Deskripsi       |
| ------ | -------- | ------ | ---------- |
| `key`  | `string` | -      | Nama item konfigurasi |

**Contoh**

```ts
const field = db.collection('users').getField('name');

// Mendapatkan nilai item konfigurasi nama bidang, mengembalikan 'name'
console.log(field.get('name'));
```

### `merge()`

Menggabungkan nilai item konfigurasi bidang.

**Tanda Tangan**

- `merge(options: { [key: string]: any }): void`

**Parameter**

| Nama Parameter | Tipe                     | Nilai Default | Deskripsi               |
| --------- | ------------------------ | ------ | ------------------ |
| `options` | `{ [key: string]: any }` | -      | Objek item konfigurasi yang akan digabungkan |

**Contoh**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Menambahkan konfigurasi indeks
  index: true,
});
```

### `remove()`

Menghapus bidang dari **koleksi** (hanya dari memori).

**Contoh**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// benar-benar menghapus dari db
await books.sync();
```

## Metode Database

### `removeFromDb()`

Menghapus bidang dari database.

**Tanda Tangan**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parameter**

| Nama Parameter         | Tipe          | Nilai Default | Deskripsi     |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | -      | Instans transaksi |

### `existsInDb()`

Menentukan apakah bidang ada di database.

**Tanda Tangan**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameter**

| Nama Parameter         | Tipe          | Nilai Default | Deskripsi     |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | -      | Instans transaksi |

## Daftar Jenis Bidang Bawaan

NocoBase memiliki beberapa jenis bidang bawaan yang umum digunakan. Anda dapat langsung menggunakan nama `type` yang sesuai untuk menentukan jenis saat mendefinisikan bidang untuk sebuah **koleksi**. Jenis bidang yang berbeda memiliki konfigurasi parameter yang berbeda; silakan lihat daftar di bawah ini untuk detailnya.

Semua item konfigurasi untuk jenis bidang, kecuali yang dijelaskan di bawah ini, akan diteruskan ke Sequelize. Jadi, semua item konfigurasi bidang yang didukung oleh Sequelize dapat digunakan di sini (seperti `allowNull`, `defaultValue`, dll.).

Selain itu, jenis bidang sisi server terutama mengatasi masalah penyimpanan database dan beberapa algoritma, dan pada dasarnya tidak terkait dengan jenis tampilan bidang dan komponen yang digunakan di frontend. Untuk jenis bidang frontend, silakan lihat instruksi tutorial yang sesuai.

### `'boolean'`

Tipe nilai boolean.

**Contoh**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

Tipe bilangan bulat (32-bit).

**Contoh**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

Tipe bilangan bulat besar (64-bit).

**Contoh**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

Tipe floating-point presisi ganda (64-bit).

**Contoh**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

Tipe bilangan riil (hanya untuk PG).

### `'decimal'`

Tipe bilangan desimal.

### `'string'`

Tipe string. Setara dengan tipe `VARCHAR` di sebagian besar database.

**Contoh**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

Tipe teks. Setara dengan tipe `TEXT` di sebagian besar database.

**Contoh**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

Tipe kata sandi (ekstensi NocoBase). Mengenkripsi kata sandi berdasarkan metode `scrypt` dari paket `crypto` bawaan Node.js.

**Contoh**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Panjang, default 64
      randomBytesSize: 8, // Panjang byte acak, default 8
    },
  ],
});
```

**Parameter**

| Nama Parameter    | Tipe     | Nilai Default | Deskripsi         |
| ----------------- | -------- | ------ | ------------ |
| `length`          | `number` | 64     | Panjang karakter |
| `randomBytesSize` | `number` | 8      | Ukuran byte acak |

### `'date'`

Tipe tanggal.

### `'time'`

Tipe waktu.

### `'array'`

Tipe array (hanya untuk PG).

### `'json'`

Tipe JSON.

### `'jsonb'`

Tipe JSONB (hanya untuk PG, yang lain akan kompatibel sebagai tipe `'json'`).

### `'uuid'`

Tipe UUID.

### `'uid'`

Tipe UID (ekstensi NocoBase). Tipe pengidentifikasi string acak pendek.

### `'formula'`

Tipe formula (ekstensi NocoBase). Memungkinkan konfigurasi perhitungan formula matematika berdasarkan [mathjs](https://www.npmjs.com/package/mathjs). Formula dapat mereferensikan nilai kolom lain dalam catatan yang sama untuk perhitungan.

**Contoh**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

Tipe radio (ekstensi NocoBase). Paling banyak satu baris data di seluruh **koleksi** dapat memiliki nilai bidang ini sebagai `true`; semua yang lain akan menjadi `false` atau `null`.

**Contoh**

Hanya ada satu pengguna yang ditandai sebagai `root` di seluruh sistem. Setelah nilai `root` pengguna lain diubah menjadi `true`, semua catatan lain dengan `root` sebagai `true` akan diubah menjadi `false`:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

Tipe pengurutan (ekstensi NocoBase). Mengurutkan berdasarkan bilangan bulat, secara otomatis menghasilkan nomor urut baru untuk catatan baru, dan mengatur ulang nomor urut saat data dipindahkan.

Jika sebuah **koleksi** mendefinisikan opsi `sortable`, bidang yang sesuai juga akan secara otomatis dibuat.

**Contoh**

Postingan dapat diurutkan berdasarkan pengguna yang memilikinya:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // Mengurutkan data yang dikelompokkan berdasarkan nilai userId yang sama
    },
  ],
});
```

### `'virtual'`

Tipe virtual. Tidak benar-benar menyimpan data, hanya digunakan untuk definisi getter/setter khusus.

### `'belongsTo'`

Tipe asosiasi banyak-ke-satu. Kunci asing disimpan di **koleksi** itu sendiri, berlawanan dengan `hasOne`/`hasMany`.

**Contoh**

Setiap postingan milik seorang penulis:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Jika tidak dikonfigurasi, defaultnya adalah nama koleksi dalam bentuk jamak dari name
      foreignKey: 'authorId', // Jika tidak dikonfigurasi, defaultnya adalah format <name> + Id
      sourceKey: 'id', // Jika tidak dikonfigurasi, defaultnya adalah id dari koleksi target
    },
  ],
});
```

### `'hasOne'`

Tipe asosiasi satu-ke-satu. Kunci asing disimpan di **koleksi** terkait, berlawanan dengan `belongsTo`.

**Contoh**

Setiap pengguna memiliki satu profil:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Dapat dihilangkan
    },
  ],
});
```

### `'hasMany'`

Tipe asosiasi satu-ke-banyak. Kunci asing disimpan di **koleksi** terkait, berlawanan dengan `belongsTo`.

**Contoh**

Setiap pengguna dapat memiliki beberapa postingan:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

Tipe asosiasi banyak-ke-banyak. Menggunakan **koleksi** perantara untuk menyimpan kunci asing kedua belah pihak. Jika **koleksi** yang sudah ada tidak ditentukan sebagai **koleksi** perantara, **koleksi** perantara akan dibuat secara otomatis.

**Contoh**

Setiap postingan dapat memiliki beberapa tag, dan setiap tag juga dapat ditambahkan ke beberapa postingan:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Dapat dihilangkan jika namanya sama
      through: 'postsTags', // Koleksi perantara akan dibuat secara otomatis jika tidak dikonfigurasi
      foreignKey: 'postId', // Kunci asing koleksi sumber di koleksi perantara
      sourceKey: 'id', // Kunci utama koleksi sumber
      otherKey: 'tagId', // Kunci asing koleksi target di koleksi perantara
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Kelompok hubungan yang sama menunjuk ke koleksi perantara yang sama
    },
  ],
});
```