:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Koleksi

## Gambaran Umum

`Koleksi` digunakan untuk mendefinisikan model data dalam sistem, seperti nama model, bidang (field), indeks, relasi, dan informasi lainnya.
Umumnya, ini dipanggil melalui metode `collection` dari sebuah instans `Database` sebagai titik masuk perantara.

```javascript
const { Database } = require('@nocobase/database')

// Membuat instans database
const db = new Database({...});

// Mendefinisikan model data
db.collection({
  name: 'users',
  // Mendefinisikan bidang (field) model
  fields: [
    // Bidang (field) skalar
    {
      name: 'name',
      type: 'string',
    },

    // Bidang (field) relasi
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Untuk jenis bidang (field) lainnya, silakan lihat [Bidang](/api/database/field).

## Konstruktor

**Tanda Tangan (Signature)**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parameter**

| Parameter             | Tipe                                                        | Nilai Default | Deskripsi                                                                              |
| :-------------------- | :---------------------------------------------------------- | :------------ | :------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -             | Pengidentifikasi koleksi                                                               |
| `options.tableName?`  | `string`                                                    | -             | Nama tabel database. Jika tidak disediakan, nilai dari `options.name` akan digunakan.  |
| `options.fields?`     | `FieldOptions[]`                                            | -             | Definisi bidang (field). Lihat [Bidang](./field) untuk detailnya.                      |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -             | Tipe Model Sequelize. Jika menggunakan `string`, nama model harus sudah didaftarkan sebelumnya pada `db`. |
| `options.repository?` | `string \| RepositoryType`                                  | -             | Tipe repositori data. Jika menggunakan `string`, tipe repositori harus sudah didaftarkan sebelumnya pada `db`. |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -             | Konfigurasi bidang (field) yang dapat diurutkan. Secara default, tidak diurutkan.      |
| `options.autoGenId?`  | `boolean`                                                   | `true`        | Apakah akan secara otomatis menghasilkan kunci primer unik. Defaultnya adalah `true`.  |
| `context.database`    | `Database`                                                  | -             | Database dalam konteks saat ini.                                                       |

**Contoh**

Membuat sebuah koleksi postingan:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // Instans database yang sudah ada
    database: db,
  },
);
```

## Anggota Instans

### `options`

Parameter konfigurasi awal untuk koleksi. Sama dengan parameter `options` pada konstruktor.

### `context`

Konteks tempat koleksi saat ini berada, saat ini terutama adalah instans database.

### `name`

Nama koleksi.

### `db`

Instans database tempatnya berada.

### `filterTargetKey`

Nama bidang (field) yang digunakan sebagai kunci primer.

### `isThrough`

Apakah ini adalah koleksi perantara (through collection).

### `model`

Mencocokkan tipe Model Sequelize.

### `repository`

Instans repositori data.

## Metode Konfigurasi Bidang (Field)

### `getField()`

Mendapatkan objek bidang (field) dengan nama yang sesuai yang telah didefinisikan dalam koleksi.

**Tanda Tangan (Signature)**

- `getField(name: string): Field`

**Parameter**

| Parameter | Tipe     | Nilai Default | Deskripsi            |
| :-------- | :------- | :------------ | :------------------- |
| `name`    | `string` | -             | Nama bidang (field) |

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

Mengatur sebuah bidang (field) untuk koleksi.

**Tanda Tangan (Signature)**

- `setField(name: string, options: FieldOptions): Field`

**Parameter**

| Parameter | Tipe           | Nilai Default | Deskripsi                                       |
| :-------- | :------------- | :------------ | :---------------------------------------------- |
| `name`    | `string`       | -             | Nama bidang (field)                            |
| `options` | `FieldOptions` | -             | Konfigurasi bidang (field). Lihat [Bidang](./field) untuk detailnya. |

**Contoh**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Mengatur beberapa bidang (field) secara massal untuk koleksi.

**Tanda Tangan (Signature)**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parameter**

| Parameter     | Tipe             | Nilai Default | Deskripsi                                       |
| :------------ | :--------------- | :------------ | :---------------------------------------------- |
| `fields`      | `FieldOptions[]` | -             | Konfigurasi bidang (field). Lihat [Bidang](./field) untuk detailnya. |
| `resetFields` | `boolean`        | `true`        | Apakah akan mereset bidang (field) yang sudah ada. |

**Contoh**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Menghapus objek bidang (field) dengan nama yang sesuai yang telah didefinisikan dalam koleksi.

**Tanda Tangan (Signature)**

- `removeField(name: string): void | Field`

**Parameter**

| Parameter | Tipe     | Nilai Default | Deskripsi            |
| :-------- | :------- | :------------ | :------------------- |
| `name`    | `string` | -             | Nama bidang (field) |

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

Mereset (mengosongkan) bidang (field) dari koleksi.

**Tanda Tangan (Signature)**

- `resetFields(): void`

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

Memeriksa apakah objek bidang (field) dengan nama yang sesuai telah didefinisikan dalam koleksi.

**Tanda Tangan (Signature)**

- `hasField(name: string): boolean`

**Parameter**

| Parameter | Tipe     | Nilai Default | Deskripsi            |
| :-------- | :------- | :------------ | :------------------- |
| `name`    | `string` | -             | Nama bidang (field) |

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

Mencari objek bidang (field) dalam koleksi yang memenuhi kriteria.

**Tanda Tangan (Signature)**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parameter**

| Parameter   | Tipe                        | Nilai Default | Deskripsi         |
| :---------- | :-------------------------- | :------------ | :---------------- |
| `predicate` | `(field: Field) => boolean` | -             | Kriteria pencarian |

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

Mengulang objek bidang (field) dalam koleksi.

**Tanda Tangan (Signature)**

- `forEachField(callback: (field: Field) => void): void`

**Parameter**

| Parameter  | Tipe                     | Nilai Default | Deskripsi       |
| :--------- | :----------------------- | :------------ | :-------------- |
| `callback` | `(field: Field) => void` | -             | Fungsi callback |

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## Metode Konfigurasi Indeks

### `addIndex()`

Menambahkan indeks ke koleksi.

**Tanda Tangan (Signature)**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parameter**

| Parameter | Tipe                                                         | Nilai Default | Deskripsi                                    |
| :-------- | :----------------------------------------------------------- | :------------ | :------------------------------------------- |
| `index`   | `string \| string[]`                                         | -             | Nama bidang (field) yang akan dikonfigurasi indeksnya. |
| `index`   | `{ fields: string[], unique?: boolean, [key: string]: any }` | -             | Konfigurasi lengkap.                         |

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

Menghapus indeks dari koleksi.

**Tanda Tangan (Signature)**

- `removeIndex(fields: string[])`

**Parameter**

| Parameter | Tipe       | Nilai Default | Deskripsi                                            |
| :-------- | :--------- | :------------ | :--------------------------------------------------- |
| `fields`  | `string[]` | -             | Kombinasi nama bidang (field) untuk indeks yang akan dihapus. |

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## Metode Konfigurasi Koleksi

### `remove()`

Menghapus koleksi.

**Tanda Tangan (Signature)**

- `remove(): void`

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## Metode Operasi Database

### `sync()`

Menyinkronkan definisi koleksi ke database. Selain logika default `Model.sync` di Sequelize, ini juga memproses koleksi yang sesuai dengan bidang (field) relasi.

**Tanda Tangan (Signature)**

- `sync(): Promise<void>`

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

Memeriksa apakah koleksi ada dalam database.

**Tanda Tangan (Signature)**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameter**

| Parameter              | Tipe          | Nilai Default | Deskripsi          |
| :--------------------- | :------------ | :------------ | :----------------- |
| `options?.transaction` | `Transaction` | -             | Instans transaksi |

**Contoh**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**Tanda Tangan (Signature)**

- `removeFromDb(): Promise<void>`

**Contoh**

```ts
const books = db.collection({
  name: 'books',
});

// Sinkronkan koleksi buku ke database
await db.sync();

// Hapus koleksi buku dari database
await books.removeFromDb();
```