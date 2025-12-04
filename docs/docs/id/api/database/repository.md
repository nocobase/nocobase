:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Repositori

## Gambaran Umum

Pada objek `koleksi` tertentu, Anda dapat memperoleh objek `Repositori`-nya untuk melakukan operasi baca dan tulis pada koleksi tersebut.

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

### Kueri

#### Kueri Dasar

Pada objek `Repositori`, panggil metode terkait `find*` untuk melakukan operasi kueri. Semua metode kueri mendukung parameter `filter` untuk memfilter data.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operator

Parameter `filter` dalam `Repositori` juga menyediakan berbagai operator untuk melakukan operasi kueri yang lebih beragam.

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

Untuk informasi lebih lanjut tentang operator, silakan lihat [Operator Filter](/api/database/operators).

#### Kontrol Bidang

Saat melakukan operasi kueri, Anda dapat mengontrol bidang keluaran melalui parameter `fields`, `except`, dan `appends`.

- `fields`: Tentukan bidang keluaran
- `except`: Kecualikan bidang keluaran
- `appends`: Tambahkan bidang terkait ke keluaran

```javascript
// Hasilnya hanya akan menyertakan bidang id dan name
userRepository.find({
  fields: ['id', 'name'],
});

// Hasilnya tidak akan menyertakan bidang password
userRepository.find({
  except: ['password'],
});

// Hasilnya akan menyertakan data dari objek terkait posts
userRepository.find({
  appends: ['posts'],
});
```

#### Mengueri Bidang Asosiasi

Parameter `filter` mendukung pemfilteran berdasarkan bidang asosiasi, misalnya:

```javascript
// Kueri untuk objek user yang posts terkaitnya memiliki objek dengan judul 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Bidang asosiasi juga dapat disarangkan.

```javascript
// Kueri untuk objek user di mana komentar dari posts mereka mengandung kata kunci
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Pengurutan

Anda dapat mengurutkan hasil kueri menggunakan parameter `sort`.

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

Anda juga dapat mengurutkan berdasarkan bidang objek terkait.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Membuat

#### Pembuatan Dasar

Buat objek data baru melalui `Repositori`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Mendukung pembuatan massal
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

Saat membuat, Anda juga dapat membuat objek terkait secara bersamaan. Serupa dengan kueri, penggunaan objek terkait yang bersarang juga didukung, misalnya:

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
// Saat membuat user, sebuah post dibuat dan diasosiasikan dengan user, dan tag dibuat dan diasosiasikan dengan post.
```

Jika objek terkait sudah ada di database, Anda dapat meneruskan ID-nya. Saat pembuatan, asosiasi akan dibuat dengan objek terkait tersebut.

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
          id: tag1.id, // Buat asosiasi dengan objek terkait yang sudah ada
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Memperbarui

#### Pembaruan Dasar

Setelah mendapatkan objek data, Anda dapat langsung memodifikasi propertinya pada objek data (`Model`), lalu panggil metode `save` untuk menyimpan perubahan.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

Objek data `Model` mewarisi dari Sequelize Model. Untuk operasi pada `Model`, silakan lihat [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Anda juga dapat memperbarui data melalui `Repositori`:

```javascript
// Perbarui catatan data yang memenuhi kriteria filter
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Saat memperbarui, Anda dapat mengontrol bidang mana yang diperbarui menggunakan parameter `whitelist` dan `blacklist`, misalnya:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Hanya perbarui bidang age
});
```

#### Memperbarui Bidang Asosiasi

Saat memperbarui, Anda dapat mengatur objek terkait, misalnya:

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
        id: tag1.id, // Buat asosiasi dengan tag1
      },
      {
        name: 'tag2', // Buat tag baru dan buat asosiasi
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Lepaskan asosiasi post dari tag
  },
});
```

### Menghapus

Anda dapat memanggil metode `destroy()` di `Repositori` untuk melakukan operasi penghapusan. Anda perlu menentukan kriteria filter saat menghapus:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Konstruktor

Biasanya tidak dipanggil langsung oleh pengembang. Ini terutama diinstansiasi setelah mendaftarkan tipe melalui `db.registerRepositories()` dan menentukan tipe repositori terdaftar yang sesuai dalam parameter `db.collection()`.

**Tanda Tangan**

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
  // di sini tautkan ke repositori yang terdaftar
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Anggota Instans

### `database`

Instans manajemen database dari konteks.

### `collection`

Instans manajemen `koleksi` yang sesuai.

### `model`

Kelas model yang sesuai.

## Metode Instans

### `find()`

Mengueri kumpulan data dari database, memungkinkan penentuan kondisi filter, pengurutan, dll.

**Tanda Tangan**

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

Kondisi kueri, digunakan untuk memfilter hasil data. Dalam parameter kueri yang diteruskan, `key` adalah nama bidang yang akan dikueri, dan `value` dapat berupa nilai yang akan dikueri atau digunakan dengan operator untuk pemfilteran data bersyarat lainnya.

```typescript
// Kueri untuk catatan di mana name adalah foo dan age lebih besar dari 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Untuk operator lebih lanjut, silakan lihat [Operator Kueri](./operators.md).

#### `filterByTk: TargetKey`

Mengueri data berdasarkan `TargetKey`, yang merupakan metode praktis untuk parameter `filter`. Bidang spesifik untuk `TargetKey` dapat [dikonfigurasi](./collection.md#filtertargetkey) dalam `koleksi`, secara default adalah `primaryKey`.

```typescript
// Secara default, menemukan catatan dengan id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Kolom kueri, digunakan untuk mengontrol hasil bidang data. Setelah meneruskan parameter ini, hanya bidang yang ditentukan yang akan dikembalikan.

#### `except: string[]`

Kolom yang dikecualikan, digunakan untuk mengontrol hasil bidang data. Setelah meneruskan parameter ini, bidang yang diteruskan tidak akan dikeluarkan.

#### `appends: string[]`

Kolom tambahan, digunakan untuk memuat data terkait. Setelah meneruskan parameter ini, bidang asosiasi yang ditentukan juga akan dikeluarkan.

#### `sort: string[] | string`

Menentukan metode pengurutan untuk hasil kueri. Parameternya adalah nama bidang, yang secara default adalah urutan naik `asc`. Untuk urutan turun `desc`, tambahkan simbol `-` sebelum nama bidang, misalnya, `['-id', 'name']`, yang berarti urutkan berdasarkan `id desc, name asc`.

#### `limit: number`

Membatasi jumlah hasil, sama dengan `limit` dalam `SQL`.

#### `offset: number`

Offset kueri, sama dengan `offset` dalam `SQL`.

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

Mengueri satu data dari database yang memenuhi kriteria tertentu. Setara dengan Sequelize 中的 `Model.findOne()`.

**Tanda Tangan**

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

Mengueri jumlah total entri data yang memenuhi kriteria tertentu dari database. Setara dengan Sequelize 中的 `Model.count()`.

**Tanda Tangan**

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

Mengueri kumpulan data dan jumlah total hasil yang memenuhi kriteria tertentu dari database. Setara dengan Sequelize 中的 `Model.findAndCountAll()`.

**Tanda Tangan**

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

Parameter kueri sama dengan `find()`. Nilai kembalian adalah sebuah array di mana elemen pertama adalah hasil kueri dan elemen kedua adalah jumlah total.

### `create()`

Memasukkan catatan baru ke dalam `koleksi`. Setara dengan Sequelize 中的 `Model.create()`. Ketika objek data yang akan dibuat membawa informasi tentang bidang relasi, catatan data relasi yang sesuai juga akan dibuat atau diperbarui.

**Tanda Tangan**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Contoh**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Ketika nilai kunci utama tabel relasi ada, itu akan memperbarui data tersebut
      { id: 1 },
      // Ketika tidak ada nilai kunci utama, itu akan membuat data baru
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Memasukkan beberapa catatan baru ke dalam `koleksi`. Setara dengan memanggil metode `create()` beberapa kali.

**Tanda Tangan**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Tipe**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Detail**

- `records`: Sebuah array objek data untuk catatan yang akan dibuat.
- `transaction`: Objek transaksi. Jika tidak ada parameter transaksi yang diteruskan, metode ini akan secara otomatis membuat transaksi internal.

**Contoh**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // Ketika nilai kunci utama tabel relasi ada, itu akan memperbarui data tersebut
        { id: 1 },
        // Ketika tidak ada nilai kunci utama, itu akan membuat data baru
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

Memperbarui data dalam `koleksi`. Setara dengan Sequelize 中的 `Model.update()`. Ketika objek data yang akan diperbarui membawa informasi tentang bidang relasi, catatan data relasi yang sesuai juga akan dibuat atau diperbarui.

**Tanda Tangan**

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
      // Ketika nilai kunci utama tabel relasi ada, itu akan memperbarui data tersebut
      { id: 1 },
      // Ketika tidak ada nilai kunci utama, itu akan membuat data baru
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Menghapus data dari `koleksi`. Setara dengan Sequelize 中的 `Model.destroy()`.

**Tanda Tangan**

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

- `filter`: Menentukan kondisi filter untuk catatan yang akan dihapus. Untuk penggunaan Filter yang lebih detail, lihat metode [`find()`](#find).
- `filterByTk`: Menentukan kondisi filter untuk catatan yang akan dihapus berdasarkan TargetKey.
- `truncate`: Apakah akan mengosongkan data `koleksi`, efektif ketika tidak ada parameter `filter` atau `filterByTk` yang diteruskan.
- `transaction`: Objek transaksi. Jika tidak ada parameter transaksi yang diteruskan, metode ini akan secara otomatis membuat transaksi internal.