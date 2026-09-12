---
title: "Repository"
description: "API Repository Database NocoBase: melakukan CRUD pada Collection, find/findOne/create/update/destroy."
keywords: "Repository,CRUD,find,findOne,create,update,destroy,NocoBase"
---

# Repository

## Ikhtisar

Pada objek `Collection` tertentu, Anda dapat mengambil objek `Repository`-nya untuk melakukan operasi baca dan tulis pada tabel data.

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### Query

#### Query Dasar

Pada objek `Repository`, panggil method-method `find*` untuk mengeksekusi operasi query, semua method query mendukung parameter `filter` untuk memfilter data.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operator

Parameter `filter` di `Repository` juga menyediakan berbagai operator, mengeksekusi operasi query yang lebih beragam.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

Untuk informasi detail operator lihat [Filter Operators](/api/database/operators).

#### Kontrol Field

Saat operasi query, melalui parameter `fields`, `except`, `appends` dapat mengontrol field output.

- `fields`: Menentukan field output
- `except`: Mengecualikan field output
- `appends`: Menambahkan output field asosiasi

```javascript
// Hasil yang didapatkan hanya berisi field id dan name
userRepository.find({
  fields: ['id', 'name'],
});

// Hasil yang didapatkan tidak berisi field password
userRepository.find({
  except: ['password'],
});

// Hasil yang didapatkan akan berisi data objek asosiasi posts
userRepository.find({
  appends: ['posts'],
});
```

#### Query Field Asosiasi

Parameter `filter` mendukung filtering berdasarkan field asosiasi, contoh:

```javascript
// Query objek user, yang asosiasi posts-nya memiliki objek dengan title 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Field asosiasi juga dapat di-nested

```javascript
// Query objek user, hasil query memenuhi comments dari posts-nya berisi keywords
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Sorting

Melalui parameter `sort`, dapat mengurutkan hasil query.

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

Juga dapat sorting berdasarkan field objek asosiasi

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Membuat

#### Pembuatan Dasar

Membuat objek data baru melalui `Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Mendukung pembuatan batch
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### Membuat Asosiasi

Saat membuat dapat sekaligus membuat objek asosiasi, mirip dengan query, juga mendukung penggunaan nested objek asosiasi, contoh:

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// Sambil membuat user, sekaligus membuat post yang terkait dengan user, dan membuat tags yang terkait dengan post.
```

Jika objek asosiasi sudah ada di database, Anda dapat memasukkan ID-nya, saat membuat akan dibangun relasi asosiasi dengan objek asosiasi tersebut.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Membangun relasi asosiasi dengan objek asosiasi yang sudah ada
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Update

#### Update Dasar

Setelah mendapatkan objek data, Anda dapat langsung memodifikasi properti pada objek data (`Model`), lalu memanggil method `save` untuk menyimpan perubahan.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

Objek data `Model` extends dari Sequelize Model, untuk operasi pada `Model` lihat [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Juga dapat mengupdate data melalui `Repository`:

```javascript
// Memodifikasi record data yang memenuhi kondisi filter
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Saat update, Anda dapat mengontrol field yang diupdate melalui parameter `whitelist`, `blacklist`, contoh:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Hanya update field age
});
```

#### Update Field Asosiasi

Saat update, dapat mengatur objek asosiasi, contoh:

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // Membangun asosiasi dengan tag1
      },
      {
        name: 'tag2', // Membuat tag baru dan membangun asosiasi
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Melepaskan asosiasi post dengan tags
  },
});
```

### Menghapus

Dapat memanggil method `destroy()` di `Repository` untuk operasi hapus. Saat menghapus harus menentukan kondisi filter:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Constructor

Biasanya tidak dipanggil langsung oleh developer, terutama setelah mendaftarkan tipe melalui `db.registerRepositories()`, lalu menentukan tipe repository terdaftar yang sesuai di parameter `db.colletion()`, dan menyelesaikan instantiasi.

**Signature**

- `constructor(collection: Collection)`

**Contoh**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // here link to the registered repository
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Anggota Instance

### `database`

Instance manajemen database tempat konteks berada.

### `collection`

Instance manajemen tabel data yang sesuai.

### `model`

Class model data yang sesuai.

## Method Instance

### `find()`

Query data set dari database, dapat menentukan kondisi filter, sorting, dll.

**Signature**

- `async find(options?: FindOptions): Promise<Model[]>`

**Tipe**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**Detail**

#### `filter: Filter`

Kondisi query, digunakan untuk memfilter hasil data. Dalam parameter query yang dimasukkan, `key` adalah nama field yang akan di-query, `value` dapat dimasukkan nilai yang akan di-query,
juga dapat dikombinasikan dengan operator untuk filter data dengan kondisi lainnya.

```typescript
// Query record dengan name 'foo' dan age lebih besar dari 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Untuk operator lebih lanjut lihat [Operator Query](./operators.md).

#### `filterByTk: TargetKey`

Query data berdasarkan `TargetKey`, adalah cara shortcut untuk parameter `filter`. Field spesifik untuk `TargetKey`,
dapat [dikonfigurasi](./collection.md#filtertargetkey) di `Collection`, default adalah `primaryKey`.

```typescript
// Pada keadaan default, mencari record dengan id 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Kolom query, digunakan untuk mengontrol hasil field data. Setelah memasukkan parameter ini, hanya akan mengembalikan field yang ditentukan.

#### `except: string[]`

Kolom yang dikecualikan, digunakan untuk mengontrol hasil field data. Setelah memasukkan parameter ini, field yang dimasukkan tidak akan ditampilkan.

#### `appends: string[]`

Kolom yang ditambahkan, digunakan untuk memuat data asosiasi. Setelah memasukkan parameter ini, field asosiasi yang ditentukan akan ditampilkan bersamaan.

#### `sort: string[] | string`

Menentukan cara sorting hasil query, parameter yang dimasukkan adalah nama field, secara default sort ascending `asc`, jika perlu sort descending `desc`,
dapat menambahkan tanda `-` di depan nama field, contoh: `['-id', 'name']`, artinya sort `id desc, name asc`.

#### `limit: number`

Membatasi jumlah hasil, sama dengan `limit` di `SQL`

#### `offset: number`

Offset query, sama dengan `offset` di `SQL`

**Contoh**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

Query satu record dengan kondisi tertentu dari database. Setara dengan `Model.findOne()` di Sequelize.

**Signature**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Contoh**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Query total jumlah data dengan kondisi tertentu dari database. Setara dengan `Model.count()` di Sequelize.

**Signature**

- `count(options?: CountOptions): Promise<number>`

**Tipe**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Contoh**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

Query data set dan jumlah hasil dengan kondisi tertentu dari database. Setara dengan `Model.findAndCountAll()` di Sequelize.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Tipe**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Detail**

Parameter query sama dengan `find()`. Nilai return adalah array, elemen pertama adalah hasil query, elemen kedua adalah total hasil.

### `create()`

Insert satu record data baru ke tabel data. Setara dengan `Model.create()` di Sequelize. Saat objek data yang akan dibuat membawa informasi field relasi, akan sekaligus membuat atau update record data relasi yang sesuai.

**Signature**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Contoh**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Saat ada nilai primary key tabel relasi, akan update data tersebut
      { id: 1 },
      // Saat tidak ada nilai primary key, akan membuat data baru
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Insert beberapa record data baru ke tabel data. Setara dengan memanggil method `create()` beberapa kali.

**Signature**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Tipe**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Detail**

- `records`: Array objek data dari record yang akan dibuat.
- `transaction`: Objek transaction. Jika tidak ada parameter transaction yang dimasukkan, method ini akan otomatis membuat transaction internal.

**Contoh**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // Saat ada nilai primary key tabel relasi, akan update data tersebut
        { id: 1 },
        // Saat tidak ada nilai primary key, akan membuat data baru
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Update data di tabel data. Setara dengan `Model.update()` di Sequelize. Saat objek data yang akan diupdate membawa informasi field relasi, akan sekaligus membuat atau update record data relasi yang sesuai.

**Signature**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Contoh**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Saat ada nilai primary key tabel relasi, akan update data tersebut
      { id: 1 },
      // Saat tidak ada nilai primary key, akan membuat data baru
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Menghapus data di tabel data. Setara dengan `Model.destroy()` di Sequelize.

**Signature**

- `async destory(options?: TargetKey | TargetKey[] | DestoryOptions): Promise<number>`

**Tipe**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Detail**

- `filter`: Menentukan kondisi filter untuk record yang akan dihapus. Untuk penggunaan detail Filter, lihat method [`find()`](#find).
- `filterByTk`: Menentukan kondisi filter berdasarkan TargetKey untuk record yang akan dihapus.
- `truncate`: Apakah mengosongkan data tabel, berlaku saat tidak ada parameter `filter` atau `filterByTk` yang dimasukkan.
- `transaction`: Objek transaction. Jika tidak ada parameter transaction yang dimasukkan, method ini akan otomatis membuat transaction internal.
