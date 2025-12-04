:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Database

## Gambaran Umum

Database adalah alat interaksi basis data yang disediakan oleh NocoBase, menawarkan kemampuan interaksi basis data yang sangat nyaman untuk aplikasi tanpa kode (no-code) dan kode rendah (low-code). Basis data yang saat ini didukung adalah:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Menghubungkan ke Basis Data

Dalam konstruktor `Database`, Anda dapat mengonfigurasi koneksi basis data dengan meneruskan parameter `options`.

```javascript
const { Database } = require('@nocobase/database');

// Parameter konfigurasi basis data SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Parameter konfigurasi basis data MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' atau 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Untuk parameter konfigurasi yang lebih detail, silakan merujuk ke [Konstruktor](#constructor).

### Definisi Model Data

`Database` mendefinisikan struktur basis data melalui `koleksi`. Sebuah objek `koleksi` merepresentasikan sebuah tabel dalam basis data.

```javascript
// Mendefinisikan koleksi
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

Setelah definisi struktur basis data selesai, Anda dapat menggunakan metode `sync()` untuk menyinkronkan struktur basis data.

```javascript
await database.sync();
```

Untuk penggunaan `koleksi` yang lebih detail, silakan merujuk ke [koleksi](/api/database/collection).

### Membaca/Menulis Data

`Database` mengoperasikan data melalui `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Membuat
await UserRepository.create({
  name: '张三',
  age: 18,
});

// Mengkueri
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// Memperbarui
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Menghapus
await UserRepository.destroy(user.id);
```

Untuk penggunaan CRUD data yang lebih detail, silakan merujuk ke [Repository](/api/database/repository).

## Konstruktor

**Tanda Tangan**

- `constructor(options: DatabaseOptions)`

Membuat sebuah instans basis data.

**Parameter**

| Nama Parameter         | Tipe           | Nilai Default | Deskripsi                                                                                                                |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | Host basis data                                                                                                          |
| `options.port`         | `number`       | -             | Port layanan basis data, dengan port default yang sesuai dengan basis data yang digunakan                                       |
| `options.username`     | `string`       | -             | Nama pengguna basis data                                                                                                        |
| `options.password`     | `string`       | -             | Kata sandi basis data                                                                                                          |
| `options.database`     | `string`       | -             | Nama basis data                                                                                                          |
| `options.dialect`      | `string`       | `'mysql'`     | Tipe basis data                                                                                                          |
| `options.storage?`     | `string`       | `':memory:'`  | Mode penyimpanan untuk SQLite                                                                                                   |
| `options.logging?`     | `boolean`      | `false`       | Apakah mengaktifkan pencatatan log                                                                                                        |
| `options.define?`      | `Object`       | `{}`          | Parameter definisi tabel default                                                                                                    |
| `options.tablePrefix?` | `string`       | `''`          | Ekstensi NocoBase, awalan nama tabel                                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | Ekstensi NocoBase, parameter terkait manajer migrasi, merujuk pada implementasi [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## Metode Terkait Migrasi

### `addMigration()`

Menambahkan satu berkas migrasi.

**Tanda Tangan**

- `addMigration(options: MigrationItem)`

**Parameter**

| Nama Parameter       | Tipe               | Nilai Default | Deskripsi                   |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name`       | `string`           | -      | Nama berkas migrasi           |
| `options.context?`   | `string`           | -      | Konteks berkas migrasi       |
| `options.migration?` | `typeof Migration` | -      | Kelas kustom untuk berkas migrasi     |
| `options.up`         | `Function`         | -      | Metode `up` dari berkas migrasi   |
| `options.down`       | `Function`         | -      | Metode `down` dari berkas migrasi |

**Contoh**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* your migration sqls */);
  },
});
```

### `addMigrations()`

Menambahkan berkas migrasi dari direktori yang ditentukan.

**Tanda Tangan**

- `addMigrations(options: AddMigrationsOptions): void`

**Parameter**

| Nama Parameter       | Tipe       | Nilai Default | Deskripsi             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | `''`           | Direktori tempat berkas migrasi berada |
| `options.extensions` | `string[]` | `['js', 'ts']` | Ekstensi berkas       |
| `options.namespace?` | `string`   | `''`           | Namespace         |
| `options.context?`   | `Object`   | `{ db }`       | Konteks berkas migrasi |

**Contoh**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Metode Utilitas

### `inDialect()`

Memeriksa apakah tipe basis data saat ini adalah salah satu dari tipe yang ditentukan.

**Tanda Tangan**

- `inDialect(dialect: string[]): boolean`

**Parameter**

| Nama Parameter | Tipe       | Nilai Default | Deskripsi                                             |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | -      | Tipe basis data, nilai yang mungkin adalah `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Mendapatkan awalan nama tabel dari konfigurasi.

**Tanda Tangan**

- `getTablePrefix(): string`

## Konfigurasi koleksi

### `collection()`

Mendefinisikan sebuah koleksi. Panggilan ini mirip dengan metode `define` Sequelize, yang hanya membuat struktur tabel di memori. Untuk menyimpannya secara permanen ke basis data, Anda perlu memanggil metode `sync`.

**Tanda Tangan**

- `collection(options: CollectionOptions): Collection`

**Parameter**

Semua parameter konfigurasi `options` konsisten dengan konstruktor kelas `koleksi`, silakan merujuk ke [koleksi](/api/database/collection#constructor).

**Peristiwa**

- `'beforeDefineCollection'`: Dipicu sebelum mendefinisikan koleksi.
- `'afterDefineCollection'`: Dipicu setelah mendefinisikan koleksi.

**Contoh**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// sync collection as table to db
await db.sync();
```

### `getCollection()`

Mendapatkan koleksi yang telah didefinisikan.

**Tanda Tangan**

- `getCollection(name: string): Collection`

**Parameter**

| Nama Parameter | Tipe     | Nilai Default | Deskripsi |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nama koleksi |

**Contoh**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Memeriksa apakah koleksi yang ditentukan telah didefinisikan.

**Tanda Tangan**

- `hasCollection(name: string): boolean`

**Parameter**

| Nama Parameter | Tipe     | Nilai Default | Deskripsi |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nama koleksi |

**Contoh**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Menghapus koleksi yang telah didefinisikan. Ini hanya dihapus dari memori; untuk menyimpan perubahan secara permanen, Anda perlu memanggil metode `sync`.

**Tanda Tangan**

- `removeCollection(name: string): void`

**Parameter**

| Nama Parameter | Tipe     | Nilai Default | Deskripsi |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nama koleksi |

**Peristiwa**

- `'beforeRemoveCollection'`: Dipicu sebelum menghapus koleksi.
- `'afterRemoveCollection'`: Dipicu setelah menghapus koleksi.

**Contoh**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Mengimpor semua berkas dalam sebuah direktori sebagai konfigurasi koleksi ke dalam memori.

**Tanda Tangan**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parameter**

| Nama Parameter       | Tipe       | Nilai Default | Deskripsi             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | -              | Jalur direktori yang akan diimpor |
| `options.extensions` | `string[]` | `['ts', 'js']` | Memindai akhiran tertentu     |

**Contoh**

koleksi yang didefinisikan dalam berkas `./collections/books.ts` adalah sebagai berikut:

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

Impor konfigurasi yang relevan saat plugin dimuat:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Registrasi dan Pengambilan Ekstensi

### `registerFieldTypes()`

Mendaftarkan tipe bidang kustom.

**Tanda Tangan**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parameter**

`fieldTypes` adalah pasangan kunci-nilai di mana kuncinya adalah nama tipe bidang dan nilainya adalah kelas tipe bidang.

**Contoh**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

Mendaftarkan kelas model data kustom.

**Tanda Tangan**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parameter**

`models` adalah pasangan kunci-nilai di mana kuncinya adalah nama model data dan nilainya adalah kelas model data.

**Contoh**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

Mendaftarkan kelas repositori data kustom.

**Tanda Tangan**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parameter**

`repositories` adalah pasangan kunci-nilai di mana kuncinya adalah nama repositori data dan nilainya adalah kelas repositori data.

**Contoh**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

Mendaftarkan operator kueri data kustom.

**Tanda Tangan**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parameter**

`operators` adalah pasangan kunci-nilai di mana kuncinya adalah nama operator dan nilainya adalah fungsi yang menghasilkan pernyataan perbandingan.

**Contoh**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // registered operator
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Mendapatkan kelas model data yang telah didefinisikan. Jika tidak ada kelas model kustom yang terdaftar sebelumnya, ini akan mengembalikan kelas model default Sequelize. Nama defaultnya sama dengan nama koleksi yang didefinisikan.

**Tanda Tangan**

- `getModel(name: string): Model`

**Parameter**

| Nama Parameter | Tipe     | Nilai Default | Deskripsi           |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | -      | Nama model yang terdaftar |

**Contoh**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Catatan: Kelas model yang diperoleh dari koleksi tidak sama persis dengan kelas model yang terdaftar, melainkan mewarisi dari kelas model yang terdaftar. Karena properti kelas model Sequelize dimodifikasi selama proses inisialisasi, NocoBase secara otomatis menangani hubungan pewarisan ini. Kecuali untuk ketidaksamaan kelas, semua definisi lainnya dapat digunakan secara normal.

### `getRepository()`

Mendapatkan kelas repositori data kustom. Jika tidak ada kelas repositori data kustom yang terdaftar sebelumnya, ini akan mengembalikan kelas repositori data default NocoBase. Nama defaultnya sama dengan nama koleksi yang didefinisikan.

Kelas repositori data terutama digunakan untuk operasi CRUD (Buat, Baca, Perbarui, Hapus) berdasarkan model data, silakan merujuk ke [Repository](/api/database/repository).

**Tanda Tangan**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parameter**

| Nama Parameter | Tipe                 | Nilai Default | Deskripsi               |
| ------------ | -------------------- | ------ | ------------------ |
| `name`       | `string`             | -      | Nama repositori data yang terdaftar |
| `relationId` | `string` \| `number` | -      | Nilai kunci asing untuk data relasional   |

Ketika nama adalah nama asosiasi seperti `'tables.relations'`, ini akan mengembalikan kelas repositori data terkait. Jika parameter kedua disediakan, repositori akan didasarkan pada nilai kunci asing dari data relasional saat digunakan (kueri, pembaruan, dll.).

**Contoh**

Misalkan ada dua koleksi, *artikel* dan *penulis*, dan koleksi artikel memiliki kunci asing yang menunjuk ke koleksi penulis:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Peristiwa Basis Data

### `on()`

Mendengarkan peristiwa basis data.

**Tanda Tangan**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parameter**

| Nama Parameter | Tipe     | Nilai Default | Deskripsi       |
| -------- | -------- | ------ | ---------- |
| event    | string   | -      | Nama peristiwa   |
| listener | Function | -      | Pendengar peristiwa |

Nama peristiwa secara default mendukung peristiwa Model Sequelize. Untuk peristiwa global, dengarkan menggunakan format `<sequelize_model_global_event>`, dan untuk peristiwa Model tunggal, gunakan format `<nama_model>.<sequelize_model_event>`.

Untuk deskripsi parameter dan contoh detail dari semua tipe peristiwa bawaan, silakan merujuk ke bagian [Peristiwa Bawaan](#peristiwa-bawaan).

### `off()`

Menghapus fungsi pendengar peristiwa.

**Tanda Tangan**

- `off(name: string, listener: Function)`

**Parameter**

| Nama Parameter | Tipe     | Nilai Default | Deskripsi       |
| -------- | -------- | ------ | ---------- |
| name     | string   | -      | Nama peristiwa   |
| listener | Function | -      | Pendengar peristiwa |

**Contoh**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Operasi Basis Data

### `auth()`

Autentikasi koneksi basis data. Dapat digunakan untuk memastikan bahwa aplikasi telah membangun koneksi dengan data.

**Tanda Tangan**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parameter**

| Nama Parameter         | Tipe                  | Nilai Default | Deskripsi               |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?`             | `Object`              | -       | Opsi autentikasi           |
| `options.retry?`       | `number`              | `10`    | Jumlah percobaan ulang saat autentikasi gagal |
| `options.transaction?` | `Transaction`         | -       | Objek transaksi           |
| `options.logging?`     | `boolean \| Function` | `false` | Apakah mencetak log       |

**Contoh**

```ts
await db.auth();
```

### `reconnect()`

Menghubungkan kembali ke basis data.

**Contoh**

```ts
await db.reconnect();
```

### `closed()`

Memeriksa apakah koneksi basis data telah ditutup.

**Tanda Tangan**

- `closed(): boolean`

### `close()`

Menutup koneksi basis data. Setara dengan `sequelize.close()`.

### `sync()`

Menyinkronkan struktur koleksi basis data. Setara dengan `sequelize.sync()`, untuk parameter silakan merujuk ke [dokumentasi Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Membersihkan basis data, akan menghapus semua koleksi.

**Tanda Tangan**

- `clean(options: CleanOptions): Promise<void>`

**Parameter**

| Nama Parameter        | Tipe          | Nilai Default | Deskripsi               |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop`        | `boolean`     | `false` | Apakah menghapus semua koleksi |
| `options.skip`        | `string[]`    | -       | Konfigurasi nama koleksi yang akan dilewati     |
| `options.transaction` | `Transaction` | -       | Objek transaksi           |

**Contoh**

Menghapus semua koleksi kecuali koleksi `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Ekspor Tingkat Paket

### `defineCollection()`

Membuat konten konfigurasi untuk sebuah koleksi.

**Tanda Tangan**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parameter**

| Nama Parameter      | Tipe                | Nilai Default | Deskripsi                                |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Sama dengan semua parameter `db.collection()` |

**Contoh**

Untuk berkas konfigurasi koleksi yang akan diimpor oleh `db.import()`:

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

Memperluas konten konfigurasi struktur koleksi yang sudah ada di memori, terutama digunakan untuk konten berkas yang diimpor oleh metode `import()`. Metode ini adalah metode tingkat atas yang diekspor oleh paket `@nocobase/database` dan tidak dipanggil melalui instans db. Alias `extend` juga dapat digunakan.

**Tanda Tangan**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parameter**

| Nama Parameter      | Tipe                | Nilai Default | Deskripsi                                                           |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Sama dengan semua parameter `db.collection()`                            |
| `mergeOptions?`     | `MergeOptions`      | -      | Parameter untuk paket npm [deepmerge](https://npmjs.com/package/deepmerge) |

**Contoh**

Definisi koleksi buku asli (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Definisi koleksi buku yang diperluas (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// memperluas lagi
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Jika kedua berkas di atas diimpor saat memanggil `import()`, setelah diperluas lagi dengan `extend()`, koleksi buku akan memiliki dua bidang yaitu `title` dan `price`.

Metode ini sangat berguna untuk memperluas struktur koleksi yang sudah didefinisikan oleh plugin yang ada.

## Peristiwa Bawaan

Basis data akan memicu peristiwa-peristiwa berikut pada siklus hidup yang sesuai. Dengan berlangganan melalui metode `on()`, penanganan khusus dapat dilakukan untuk memenuhi beberapa kebutuhan bisnis.

### `'beforeSync'` / `'afterSync'`

Dipicu sebelum dan sesudah konfigurasi struktur koleksi baru (bidang, indeks, dll.) disinkronkan ke basis data. Ini biasanya dipicu saat `collection.sync()` (panggilan internal) dieksekusi dan umumnya digunakan untuk menangani logika ekstensi bidang khusus.

**Tanda Tangan**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Tipe**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Contoh**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // do something
});

db.on('users.afterSync', async (options) => {
  // do something
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Sebelum membuat atau memperbarui data, ada proses validasi data berdasarkan aturan yang didefinisikan dalam koleksi. Peristiwa yang sesuai akan dipicu sebelum dan sesudah validasi. Ini dipicu saat `repository.create()` atau `repository.update()` dipanggil.

**Tanda Tangan**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Tipe**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Contoh**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// all models
db.on('beforeValidate', async (model, options) => {
  // do something
});
// tests model
db.on('tests.beforeValidate', async (model, options) => {
  // do something
});

// all models
db.on('afterValidate', async (model, options) => {
  // do something
});
// tests model
db.on('tests.afterValidate', async (model, options) => {
  // do something
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // checks for email format
  },
});
// or
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // checks for email format
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Peristiwa yang sesuai akan dipicu sebelum dan sesudah membuat satu data. Ini dipicu saat `repository.create()` dipanggil.

**Tanda Tangan**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Tipe**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Contoh**

```ts
db.on('beforeCreate', async (model, options) => {
  // do something
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

Peristiwa yang sesuai akan dipicu sebelum dan sesudah memperbarui satu data. Ini dipicu saat `repository.update()` dipanggil.

**Tanda Tangan**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Tipe**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Contoh**

```ts
db.on('beforeUpdate', async (model, options) => {
  // do something
});

db.on('books.afterUpdate', async (model, options) => {
  // do something
});
```

### `'beforeSave'` / `'afterSave'`

Peristiwa yang sesuai akan dipicu sebelum dan sesudah membuat atau memperbarui satu data. Ini dipicu saat `repository.create()` atau `repository.update()` dipanggil.

**Tanda Tangan**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Tipe**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Contoh**

```ts
db.on('beforeSave', async (model, options) => {
  // do something
});

db.on('books.afterSave', async (model, options) => {
  // do something
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Peristiwa yang sesuai akan dipicu sebelum dan sesudah menghapus satu data. Ini dipicu saat `repository.destroy()` dipanggil.

**Tanda Tangan**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Tipe**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Contoh**

```ts
db.on('beforeDestroy', async (model, options) => {
  // do something
});

db.on('books.afterDestroy', async (model, options) => {
  // do something
});
```

### `'afterCreateWithAssociations'`

Peristiwa ini dipicu setelah membuat satu data yang membawa data relasi hierarkis. Ini dipicu saat `repository.create()` dipanggil.

**Tanda Tangan**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Tipe**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Contoh**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterUpdateWithAssociations'`

Peristiwa ini dipicu setelah memperbarui satu data yang membawa data relasi hierarkis. Ini dipicu saat `repository.update()` dipanggil.

**Tanda Tangan**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Tipe**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Contoh**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterSaveWithAssociations'`

Peristiwa ini dipicu setelah membuat atau memperbarui satu data yang membawa data relasi hierarkis. Ini dipicu saat `repository.create()` atau `repository.update()` dipanggil.

**Tanda Tangan**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Tipe**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Contoh**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // do something
});
```

### `'beforeDefineCollection'`

Dipicu sebelum sebuah koleksi didefinisikan, misalnya saat `db.collection()` dipanggil.

Catatan: Peristiwa ini adalah peristiwa sinkron.

**Tanda Tangan**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Tipe**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Contoh**

```ts
db.on('beforeDefineCollection', (options) => {
  // do something
});
```

### `'afterDefineCollection'`

Dipicu setelah sebuah koleksi didefinisikan, misalnya saat `db.collection()` dipanggil.

Catatan: Peristiwa ini adalah peristiwa sinkron.

**Tanda Tangan**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Tipe**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Contoh**

```ts
db.on('afterDefineCollection', (collection) => {
  // do something
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Dipicu sebelum dan sesudah sebuah koleksi dihapus dari memori, misalnya saat `db.removeCollection()` dipanggil.

Catatan: Peristiwa ini adalah peristiwa sinkron.

**Tanda Tangan**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Tipe**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Contoh**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // do something
});

db.on('afterRemoveCollection', (collection) => {
  // do something
});
```