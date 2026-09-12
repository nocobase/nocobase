---
title: "Field"
description: "API Field Database NocoBase: mendefinisikan tipe field Collection, field skalar, konfigurasi field asosiasi."
keywords: "Field API,definisi field,tipe field,field skalar,field asosiasi,NocoBase"
---

# Field

## Ikhtisar

Class manajemen field tabel data (abstract class). Sekaligus class dasar untuk semua tipe field, tipe field lainnya semua diimplementasikan dengan extends class ini.

Untuk cara mendefinisikan field kustom lihat [Memperluas Tipe Field]

## Constructor

Biasanya tidak dipanggil langsung oleh developer, terutama dipanggil melalui method `db.collection({ fields: [] })` sebagai entry point proxy.

Saat memperluas field terutama melalui extends abstract class `Field`, lalu mendaftarkannya ke instance Database.

**Signature**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| -------------------- | -------------- | ------ | ---------------------------------------- |
| `options` | `FieldOptions` | - | Objek konfigurasi field |
| `options.name` | `string` | - | Nama field |
| `options.type` | `string` | - | Tipe field, sesuai dengan nama tipe field yang didaftarkan di db |
| `context` | `FieldContext` | - | Objek konteks field |
| `context.database` | `Database` | - | Instance database |
| `context.collection` | `Collection` | - | Instance tabel data |

## Anggota Instance

### `name`

Nama field.

### `type`

Tipe field.

### `dataType`

Tipe penyimpanan database dari field.

### `options`

Parameter konfigurasi inisialisasi field.

### `context`

Objek konteks field.

## Method Konfigurasi

### `on()`

Cara definisi shortcut berbasis event tabel data. Setara dengan `db.on(this.collection.name + '.' + eventName, listener)`.

Saat extends biasanya tidak perlu meng-override method ini.

**Signature**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string` | - | Nama event |
| `listener` | `(...args: any[]) => void` | - | Event listener |

### `off()`

Cara penghapusan shortcut berbasis event tabel data. Setara dengan `db.off(this.collection.name + '.' + eventName, listener)`.

Saat extends biasanya tidak perlu meng-override method ini.

**Signature**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string` | - | Nama event |
| `listener` | `(...args: any[]) => void` | - | Event listener |

### `bind()`

Konten yang dieksekusi saat field ditambahkan ke tabel data. Biasanya digunakan untuk menambahkan event listener tabel data dan pemrosesan lainnya.

Saat extends, harus memanggil method `super.bind()` yang sesuai terlebih dahulu.

**Signature**

- `bind()`

### `unbind()`

Konten yang dieksekusi saat field dihapus dari tabel data. Biasanya digunakan untuk menghapus event listener tabel data dan pemrosesan lainnya.

Saat extends, harus memanggil method `super.unbind()` yang sesuai terlebih dahulu.

**Signature**

- `unbind()`

### `get()`

Mendapatkan nilai item konfigurasi field.

**Signature**

- `get(key: string): any`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------ | -------- | ------ | ---------- |
| `key` | `string` | - | Nama item konfigurasi |

**Contoh**

```ts
const field = db.collection('users').getField('name');

// Mendapatkan nilai item konfigurasi nama field, mengembalikan 'name'
console.log(field.get('name'));
```

### `merge()`

Menggabungkan nilai item konfigurasi field.

**Signature**

- `merge(options: { [key: string]: any }): void`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| --------- | ------------------------ | ------ | ------------------ |
| `options` | `{ [key: string]: any }` | - | Objek item konfigurasi yang akan digabungkan |

**Contoh**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Menambahkan satu konfigurasi index
  index: true,
});
```

### `remove()`

Menghapus field dari tabel data (hanya menghapus dari memori).

**Contoh**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// really remove from db
await books.sync();
```

## Method Database

### `removeFromDb()`

Menghapus field dari database.

**Signature**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | - | Instance transaction |

### `existsInDb()`

Memeriksa apakah field ada di database.

**Signature**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | - | Instance transaction |

## Daftar Tipe Field Bawaan

NocoBase menyediakan beberapa tipe field umum bawaan, dapat langsung digunakan saat mendefinisikan field tabel data dengan menggunakan nama type yang sesuai untuk menentukan tipenya. Tipe field yang berbeda memiliki konfigurasi parameter yang berbeda, untuk detail lihat daftar di bawah.

Selain item konfigurasi tambahan yang dijelaskan di bawah, semua item konfigurasi tipe field akan diteruskan ke Sequelize, sehingga semua item konfigurasi field yang didukung Sequelize dapat digunakan di sini (seperti `allowNull`, `defaultValue`, dll).

Selain itu, tipe field di sisi server terutama mengatasi masalah penyimpanan database dan beberapa algoritma, pada dasarnya tidak terkait dengan tipe tampilan field di frontend dan komponen yang digunakan. Untuk tipe field frontend dapat dilihat pada penjelasan tutorial yang sesuai.

### `'boolean'`

Tipe nilai logika.

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

Integer (32-bit).

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

Long integer (64-bit).

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

Double precision floating point (64-bit).

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

Tipe real number (hanya berlaku untuk PG).

### `'decimal'`

Tipe decimal number.

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

Tipe text. Setara dengan tipe `TEXT` di sebagian besar database.

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

Tipe password (ekstensi NocoBase). Berdasarkan method `scrypt` dari paket native crypto Node.js untuk enkripsi password.

**Contoh**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // panjang, default 64
      randomBytesSize: 8, // panjang random bytes, default 8
    },
  ],
});
```

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ----------------- | -------- | ------ | ------------ |
| `length` | `number` | 64 | Panjang karakter |
| `randomBytesSize` | `number` | 8 | Ukuran random bytes |

### `'date'`

Tipe tanggal.

### `'time'`

Tipe waktu.

### `'array'`

Tipe array (hanya berlaku untuk PG).

### `'json'`

Tipe JSON.

### `'jsonb'`

Tipe JSONB (hanya berlaku untuk PG, lainnya akan dikompatibilitas sebagai tipe `'json'`).

### `'uuid'`

Tipe UUID.

### `'uid'`

Tipe UID (ekstensi NocoBase). Tipe identifier string acak pendek.

### `'formula'`

Tipe formula (ekstensi NocoBase). Dapat dikonfigurasi perhitungan rumus matematika berdasarkan [mathjs](https://www.npmjs.com/package/mathjs), dalam rumus dapat mereferensikan nilai kolom lain dari record yang sama untuk berpartisipasi dalam perhitungan.

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

Tipe radio (ekstensi NocoBase). Maksimal satu baris data di seluruh tabel yang nilai field-nya `true`, lainnya semua `false` atau `null`.

**Contoh**

Seluruh sistem hanya memiliki satu user yang ditandai sebagai root, setelah nilai root user lain diubah menjadi `true`, semua record lain dengan root `true` akan diubah menjadi `false`:

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

Tipe sort (ekstensi NocoBase). Sorting berdasarkan integer, otomatis menghasilkan nomor urut baru untuk record baru, melakukan reorder nomor saat memindahkan data.

Jika tabel data mendefinisikan opsi `sortable`, juga akan otomatis menghasilkan field yang sesuai.

**Contoh**

Artikel dapat di-sort berdasarkan user pemilik:

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
      scopeKey: 'userId', // Sort data yang dikelompokkan dengan nilai userId yang sama
    },
  ],
});
```

### `'virtual'`

Tipe virtual. Tidak benar-benar menyimpan data, hanya digunakan saat definisi getter/setter khusus.

### `'belongsTo'`

Tipe asosiasi many-to-one. Foreign key disimpan di tabel sendiri, berlawanan dengan hasOne/hasMany.

**Contoh**

Setiap artikel dimiliki oleh seorang author:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Jika tidak dikonfigurasi, default adalah nama tabel jamak dari name
      foreignKey: 'authorId', // Jika tidak dikonfigurasi, default adalah format <name> + Id
      sourceKey: 'id', // Jika tidak dikonfigurasi, default adalah id dari tabel target
    },
  ],
});
```

### `'hasOne'`

Tipe asosiasi one-to-one. Foreign key disimpan di tabel asosiasi, berlawanan dengan belongsTo.

**Contoh**

Setiap user memiliki satu profile:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Dapat dilewati
    },
  ],
});
```

### `'hasMany'`

Tipe asosiasi one-to-many. Foreign key disimpan di tabel asosiasi, berlawanan dengan belongsTo.

**Contoh**

Setiap user dapat memiliki banyak artikel:

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

Tipe asosiasi many-to-many. Menggunakan tabel perantara untuk menyimpan foreign key dari kedua belah pihak, jika tidak menentukan tabel yang sudah ada sebagai tabel perantara, akan otomatis dibuat tabel perantara.

**Contoh**

Setiap artikel dapat memiliki banyak tag, dan setiap tag juga dapat ditambahkan ke banyak artikel:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Jika nama sama dapat dilewati
      through: 'postsTags', // Tabel perantara jika tidak dikonfigurasi akan otomatis dihasilkan
      foreignKey: 'postId', // Foreign key tabel sendiri di tabel perantara
      sourceKey: 'id', // Primary key tabel sendiri
      otherKey: 'tagId', // Foreign key tabel asosiasi di tabel perantara
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Set relasi yang sama menunjuk ke tabel perantara yang sama
    },
  ],
});
```
