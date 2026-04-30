---
title: "Database"
description: "API Database NocoBase: instance database, definisi Collection, operasi Repository, konfigurasi koneksi."
keywords: "Database API,instance database,Collection,Repository,konfigurasi koneksi,NocoBase"
---

# Database

## Ikhtisar

Database adalah tools interaksi database yang disediakan NocoBase, menyediakan fungsi interaksi database yang sangat memudahkan untuk aplikasi no-code, low-code. Database yang didukung saat ini:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Menghubungkan Database

Pada constructor `Database`, dapat dikonfigurasi koneksi database melalui parameter `options`.

```javascript
const { Database } = require('@nocobase/database');

// Parameter konfigurasi database SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Parameter konfigurasi database MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' atau 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Untuk parameter konfigurasi detail lihat [Constructor](#constructor).

### Definisi Model Data

`Database` mendefinisikan struktur database melalui `Collection`, satu objek `Collection` mewakili satu tabel di database.

```javascript
// Mendefinisikan Collection
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

Setelah definisi struktur database selesai, dapat menggunakan method `sync()` untuk sinkronisasi struktur database.

```javascript
await database.sync();
```

Untuk method penggunaan `Collection` yang lebih detail lihat [Collection](/api/database/collection).

### Baca dan Tulis Data

`Database` mengoperasikan data melalui `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Membuat
await UserRepository.create({
  name: '张三',
  age: 18,
});

// Query
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// Update
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Hapus
await UserRepository.destroy(user.id);
```

Untuk method penggunaan CRUD data yang lebih detail lihat [Repository](/api/database/repository).

## Constructor

**Signature**

- `constructor(options: DatabaseOptions)`

Membuat instance database.

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host` | `string` | `'localhost'` | Host database |
| `options.port` | `number` | - | Port server database, ada port default sesuai database yang digunakan |
| `options.username` | `string` | - | Username database |
| `options.password` | `string` | - | Password database |
| `options.database` | `string` | - | Nama database |
| `options.dialect` | `string` | `'mysql'` | Tipe database |
| `options.storage?` | `string` | `':memory:'` | Mode penyimpanan SQLite |
| `options.logging?` | `boolean` | `false` | Apakah mengaktifkan logging |
| `options.define?` | `Object` | `{}` | Parameter definisi tabel default |
| `options.tablePrefix?` | `string` | `''` | Ekstensi NocoBase, prefix nama tabel |
| `options.migrator?` | `UmzugOptions` | `{}` | Ekstensi NocoBase, parameter terkait migration manager, lihat implementasi [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## Method Terkait Migration

### `addMigration()`

Menambahkan satu file migration.

**Signature**

- `addMigration(options: MigrationItem)`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name` | `string` | - | Nama file migration |
| `options.context?` | `string` | - | Konteks file migration |
| `options.migration?` | `typeof Migration` | - | Class kustom file migration |
| `options.up` | `Function` | - | Method `up` file migration |
| `options.down` | `Function` | - | Method `down` file migration |

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

Menambahkan file migration di direktori yang ditentukan.

**Signature**

- `addMigrations(options: AddMigrationsOptions): void`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory` | `string` | `''` | Direktori tempat file migration |
| `options.extensions` | `string[]` | `['js', 'ts']` | Ekstensi file |
| `options.namespace?` | `string` | `''` | Namespace |
| `options.context?` | `Object` | `{ db }` | Konteks file migration |

**Contoh**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Tools Method

### `inDialect()`

Memeriksa apakah tipe database saat ini adalah tipe yang ditentukan.

**Signature**

- `inDialect(dialect: string[]): boolean`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | - | Tipe database, opsi: `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Mendapatkan prefix nama tabel di konfigurasi.

**Signature**

- `getTablePrefix(): string`

## Konfigurasi Tabel Data

### `collection()`

Mendefinisikan satu tabel data. Pemanggilan ini mirip dengan method `define` Sequelize, hanya membuat struktur tabel di memori, jika perlu persistensi ke database, perlu memanggil method `sync`.

**Signature**

- `collection(options: CollectionOptions): Collection`

**Parameter**

Semua parameter konfigurasi `options` sama dengan constructor class `Collection`, lihat [Collection](/api/database/collection#constructor).

**Event**

- `'beforeDefineCollection'`: Dipicu sebelum mendefinisikan tabel.
- `'afterDefineCollection'`: Dipicu setelah mendefinisikan tabel.

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

Mendapatkan tabel data yang sudah didefinisikan.

**Signature**

- `getCollection(name: string): Collection`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | Nama tabel |

**Contoh**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Memeriksa apakah tabel data yang ditentukan sudah didefinisikan.

**Signature**

- `hasCollection(name: string): boolean`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | Nama tabel |

**Contoh**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Menghapus tabel data yang sudah didefinisikan. Hanya menghapus dari memori, jika perlu persistensi, perlu memanggil method `sync`.

**Signature**

- `removeCollection(name: string): void`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | Nama tabel |

**Event**

- `'beforeRemoveCollection'`: Dipicu sebelum menghapus tabel.
- `'afterRemoveCollection'`: Dipicu setelah menghapus tabel.

**Contoh**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Mengimpor semua file di direktori file sebagai konfigurasi collection yang dimuat ke memori.

**Signature**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory` | `string` | - | Path direktori yang akan diimpor |
| `options.extensions` | `string[]` | `['ts', 'js']` | Scan ekstensi tertentu |

**Contoh**

Collection yang didefinisikan di file `./collections/books.ts`:

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

Mengimpor konfigurasi terkait saat plugin di-load:

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

Mendaftarkan tipe field kustom.

**Signature**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parameter**

`fieldTypes` adalah pasangan key-value, key adalah nama tipe field, value adalah class tipe field.

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

Mendaftarkan class model data kustom.

**Signature**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parameter**

`models` adalah pasangan key-value, key adalah nama model data, value adalah class model data.

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

Mendaftarkan class data repository kustom.

**Signature**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parameter**

`repositories` adalah pasangan key-value, key adalah nama data repository, value adalah class data repository.

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

Mendaftarkan operator query data kustom.

**Signature**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parameter**

`operators` adalah pasangan key-value, key adalah nama operator, value adalah fungsi yang menghasilkan statement perbandingan operator.

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

Mendapatkan class model data yang sudah didefinisikan. Jika sebelumnya tidak mendaftarkan class model kustom, akan mengembalikan class model default Sequelize. Nama default sama dengan nama yang didefinisikan di collection.

**Signature**

- `getModel(name: string): Model`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | - | Nama model yang sudah terdaftar |

**Contoh**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Catatan: Class model yang didapatkan dari collection tidak persis sama dengan class model saat didaftarkan, melainkan inherits dari class model saat didaftarkan. Karena class model Sequelize akan dimodifikasi propertinya selama proses inisialisasi, NocoBase secara otomatis menangani relasi inheritance ini. Selain class tidak sama, semua definisi lainnya dapat digunakan secara normal.

### `getRepository()`

Mendapatkan class data repository kustom. Jika sebelumnya tidak mendaftarkan class data repository kustom, akan mengembalikan class data repository default NocoBase. Nama default sama dengan nama yang didefinisikan di collection.

Class data repository terutama digunakan untuk operasi CRUD berbasis model data, lihat [Data Repository](/api/database/repository).

**Signature**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------------ | -------------------- | ------ | ------------------ |
| `name` | `string` | - | Nama data repository yang sudah terdaftar |
| `relationId` | `string` \| `number` | - | Nilai foreign key data relasi |

Saat nama berbentuk seperti `'tables.relactions'` dengan asosiasi, akan mengembalikan class data repository asosiasi. Jika menyediakan parameter kedua, data repository saat digunakan (query, modifikasi, dll) akan berbasis nilai foreign key data relasi.

**Contoh**

Misalkan ada dua tabel data *artikel* dan *author*, dan tabel artikel memiliki foreign key yang menunjuk ke tabel author:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Event Database

### `on()`

Mendengarkan event database.

**Signature**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| -------- | -------- | ------ | ---------- |
| event | string | - | Nama event |
| listener | Function | - | Event listener |

Nama event secara default mendukung event Model dari Sequelize. Untuk event global, mendengarkan dengan format nama `<sequelize_model_global_event>`, untuk event satu Model, mendengarkan dengan format nama `<model_name>.<sequelize_model_event>`.

Untuk penjelasan parameter dan contoh detail dari semua tipe event bawaan, lihat bagian [Event Bawaan](#event-bawaan).

### `off()`

Menghapus fungsi event listener.

**Signature**

- `off(name: string, listener: Function)`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| -------- | -------- | ------ | ---------- |
| name | string | - | Nama event |
| listener | Function | - | Event listener |

**Contoh**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Operasi Database

### `auth()`

Verifikasi koneksi database. Dapat digunakan untuk memastikan aplikasi sudah membangun koneksi dengan data.

**Signature**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?` | `Object` | - | Opsi verifikasi |
| `options.retry?` | `number` | `10` | Jumlah retry saat verifikasi gagal |
| `options.transaction?` | `Transaction` | - | Objek transaction |
| `options.logging?` | `boolean \| Function` | `false` | Apakah mencetak log |

**Contoh**

```ts
await db.auth();
```

### `reconnect()`

Menghubungkan ulang database.

**Contoh**

```ts
await db.reconnect();
```

### `closed()`

Memeriksa apakah koneksi database sudah ditutup.

**Signature**

- `closed(): boolean`

### `close()`

Menutup koneksi database. Setara dengan `sequelize.close()`.

### `sync()`

Sinkronisasi struktur tabel database. Setara dengan `sequelize.sync()`, untuk parameter lihat [dokumentasi Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Mengosongkan database, akan menghapus semua tabel data.

**Signature**

- `clean(options: CleanOptions): Promise<void>`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop` | `boolean` | `false` | Apakah menghapus semua tabel data |
| `options.skip` | `string[]` | - | Konfigurasi nama tabel yang dilewati |
| `options.transaction` | `Transaction` | - | Objek transaction |

**Contoh**

Menghapus semua tabel kecuali tabel `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Export Level Paket

### `defineCollection()`

Membuat konten konfigurasi tabel data.

**Signature**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | Sama dengan parameter `db.collection()` |

**Contoh**

Untuk file konfigurasi tabel data yang akan diimpor oleh `db.import()`:

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

Memperluas konten konfigurasi struktur tabel yang sudah ada di memori, terutama digunakan untuk konten file yang diimpor oleh method `import()`. Method ini adalah method top-level yang diekspor oleh paket `@nocobase/database`, tidak dipanggil melalui instance db. Juga dapat menggunakan alias `extend`.

**Signature**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parameter**

| Nama Parameter | Tipe | Default | Deskripsi |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | Sama dengan parameter `db.collection()` |
| `mergeOptions?` | `MergeOptions` | - | Parameter paket npm [deepmerge](https://npmjs.com/package/deepmerge) |

**Contoh**

Definisi tabel books asli (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Memperluas definisi tabel books (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// Memperluas lagi
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Kedua file di atas jika diimpor saat memanggil `import()`, setelah diperluas lagi melalui `extend()`, tabel books akan memiliki dua field `title` dan `price`.

Method ini sangat berguna saat memperluas struktur tabel yang sudah didefinisikan oleh plugin yang ada.

## Event Bawaan

Database akan memicu event yang sesuai pada siklus hidup yang sesuai, setelah subscribe melalui method `on()` dan melakukan pemrosesan tertentu dapat memenuhi beberapa kebutuhan bisnis.

### `'beforeSync'` / `'afterSync'`

Dipicu sebelum dan setelah konfigurasi struktur tabel baru (field, index, dll) disinkronkan ke database, biasanya saat mengeksekusi `collection.sync()` (panggilan internal) akan dipicu, umumnya digunakan untuk pemrosesan logika ekstensi field tertentu.

**Signature**

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

Sebelum membuat atau mengupdate data ada proses validasi data berdasarkan aturan yang didefinisikan collection, sebelum dan setelah validasi akan memicu event yang sesuai. Saat memanggil `repository.create()` atau `repository.update()` akan dipicu.

**Signature**

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

Sebelum dan setelah membuat satu data akan memicu event yang sesuai, saat memanggil `repository.create()` akan dipicu.

**Signature**

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

Sebelum dan setelah mengupdate satu data akan memicu event yang sesuai, saat memanggil `repository.update()` akan dipicu.

**Signature**

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

Sebelum dan setelah membuat atau mengupdate satu data akan memicu event yang sesuai, saat memanggil `repository.create()` atau `repository.update()` akan dipicu.

**Signature**

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

Sebelum dan setelah menghapus satu data akan memicu event yang sesuai, saat memanggil `repository.destroy()` akan dipicu.

**Signature**

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

Setelah membuat satu data dengan data hierarki relasi akan memicu event yang sesuai, saat memanggil `repository.create()` akan dipicu.

**Signature**

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

Setelah mengupdate satu data dengan data hierarki relasi akan memicu event yang sesuai, saat memanggil `repository.update()` akan dipicu.

**Signature**

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

Setelah membuat atau mengupdate satu data dengan data hierarki relasi akan memicu event yang sesuai, saat memanggil `repository.create()` atau `repository.update()` akan dipicu.

**Signature**

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

Dipicu sebelum mendefinisikan satu tabel data, seperti saat memanggil `db.collection()`.

Catatan: Event ini adalah event sinkron.

**Signature**

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

Dipicu setelah mendefinisikan satu tabel data, seperti saat memanggil `db.collection()`.

Catatan: Event ini adalah event sinkron.

**Signature**

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

Dipicu sebelum dan setelah menghapus satu tabel data dari memori, seperti saat memanggil `db.removeCollection()`.

Catatan: Event ini adalah event sinkron.

**Signature**

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
