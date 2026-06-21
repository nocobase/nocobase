---
title: "Collection"
description: "API Collection Database NocoBase: mendefinisikan model data, field, index, asosiasi, dikonfigurasi melalui db.collection()."
keywords: "Collection,model data,db.collection,definisi field,Database API,NocoBase"
---

# Collection

## Ikhtisar

`Collection` digunakan untuk mendefinisikan model data dalam sistem, seperti nama model, field, index, asosiasi, dll.
Umumnya dipanggil melalui method `collection` dari instance `Database` sebagai entry point proxy.

```javascript
const { Database } = require('@nocobase/database')

// Membuat instance database
const db = new Database({...});

// Mendefinisikan model data
db.collection({
  name: 'users',
  // Mendefinisikan field model
  fields: [
    // Field skalar
    {
      name: 'name',
      type: 'string',
    },

    // Field asosiasi
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Untuk tipe field lainnya lihat [Fields](/api/database/field).

## Constructor

**Signature**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name` | `string` | - | Identifier collection |
| `options.tableName?` | `string` | - | Nama tabel database, jika tidak dimasukkan akan menggunakan nilai `options.name` |
| `options.fields?` | `FieldOptions[]` | - | Definisi field, lihat [Field](./field) |
| `options.model?` | `string \| ModelStatic<Model>` | - | Tipe Model Sequelize, jika menggunakan `string`, perlu mendaftarkan nama model tersebut di db sebelumnya |
| `options.repository?` | `string \| RepositoryType` | - | Tipe data repository, jika menggunakan `string`, perlu mendaftarkan tipe repository tersebut di db sebelumnya |
| `options.sortable?` | `string \| boolean \| { name?: string; scopeKey?: string }` | - | Konfigurasi field sortable data, default tidak sortable |
| `options.autoGenId?` | `boolean` | `true` | Apakah otomatis menghasilkan primary key unik, default `true` |
| `context.database` | `Database` | - | Database lingkungan konteks tempat berada |

**Contoh**

Membuat tabel artikel:

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
    // Instance database yang sudah ada
    database: db,
  },
);
```

## Anggota Instance

### `options`

Parameter awal konfigurasi tabel data. Konsisten dengan parameter `options` dari constructor.

### `context`

Lingkungan konteks tempat tabel data saat ini berada, saat ini terutama instance database.

### `name`

Nama tabel data.

### `db`

Instance database yang dimiliki.

### `filterTargetKey`

Nama field yang berfungsi sebagai primary key.

### `isThrough`

Apakah merupakan tabel perantara.

### `model`

Tipe Model yang sesuai dengan Sequelize.

### `repository`

Instance data repository.

## Method Konfigurasi Field

### `getField()`

Mendapatkan objek field dengan nama yang sesuai yang sudah didefinisikan di tabel data.

**Signature**

- `getField(name: string): Field`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Nama field |

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

Mengatur field pada tabel data.

**Signature**

- `setField(name: string, options: FieldOptions): Field`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| --------- | -------------- | ------ | ------------------------------- |
| `name` | `string` | - | Nama field |
| `options` | `FieldOptions` | - | Konfigurasi field, lihat [Field](./field) |

**Contoh**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Mengatur beberapa field sekaligus pada tabel data.

**Signature**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields` | `FieldOptions[]` | - | Konfigurasi field, lihat [Field](./field) |
| `resetFields` | `boolean` | `true` | Apakah mereset field yang sudah ada |

**Contoh**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Menghapus objek field dengan nama yang sesuai yang sudah didefinisikan di tabel data.

**Signature**

- `removeField(name: string): void | Field`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Nama field |

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

Mereset (mengosongkan) field tabel data.

**Signature**

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

Memeriksa apakah objek field dengan nama yang sesuai sudah didefinisikan di tabel data.

**Signature**

- `hasField(name: string): boolean`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Nama field |

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

Mencari objek field di tabel data yang memenuhi kondisi.

**Signature**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | - | Kondisi pencarian |

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

Iterasi objek field di tabel data.

**Signature**

- `forEachField(callback: (field: Field) => void): void`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | - | Fungsi callback |

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

## Method Konfigurasi Index

### `addIndex()`

Menambahkan index tabel data.

**Signature**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]` | - | Nama field yang perlu dikonfigurasi index |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | - | Konfigurasi lengkap |

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

Menghapus index tabel data.

**Signature**

- `removeIndex(fields: string[])`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | - | Kombinasi nama field yang perlu dihapus index-nya |

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

## Method Konfigurasi Tabel

### `remove()`

Menghapus tabel data.

**Signature**

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

## Method Operasi Database

### `sync()`

Menyinkronkan definisi tabel data ke database. Selain logika `Model.sync` default di Sequelize, juga akan menangani tabel data yang sesuai dengan field relasi.

**Signature**

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

Memeriksa apakah tabel data ada di database.

**Signature**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | - | Instance transaction |

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

**Signature**

- `removeFromDb(): Promise<void>`

**Contoh**

```ts
const books = db.collection({
  name: 'books',
});

// Sinkronkan tabel buku ke database
await db.sync();

// Hapus tabel buku di database
await books.removeFromDb();
```
