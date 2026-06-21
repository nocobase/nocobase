---
title: "ResourceManager Manajemen Resource"
description: "Manajemen resource server NocoBase: app.resourceManager, registerActions, resource.use, registrasi Action."
keywords: "ResourceManager,manajemen resource,registerActions,resource.use,Action,NocoBase"
---

# ResourceManager Manajemen Resource

Fitur manajemen resource NocoBase secara otomatis mengkonversi tabel data (Collection) dan asosiasi (Association) menjadi resource, dan menyediakan beberapa tipe operasi bawaan, sehingga Anda dapat dengan cepat membangun REST API. Sedikit berbeda dengan REST API tradisional, operasi resource NocoBase tidak langsung bergantung pada method HTTP request, tetapi menentukan operasi spesifik yang dieksekusi melalui definisi `:action` secara eksplisit.

## Resource yang Dihasilkan Otomatis

NocoBase secara otomatis akan mengkonversi Collection dan Association yang didefinisikan dalam database menjadi resource. Misalnya mendefinisikan dua collection `posts` dan `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Sistem akan secara otomatis menghasilkan resource berikut:

* Resource `posts`
* Resource `tags`
* Resource asosiasi `posts.tags`

Contoh request:

| Method Request   | Path                     | Operasi   |
| -------- | ---------------------- | ---- |
| `GET`  | `/api/posts:list`      | Query list |
| `GET`  | `/api/posts:get/1`     | Query single |
| `POST` | `/api/posts:create`    | Create   |
| `POST` | `/api/posts:update/1`  | Update   |
| `POST` | `/api/posts:destroy/1` | Delete   |

| Method Request   | Path                        | Operasi   |
| -------- | ------------------------- | ---- |
| `GET`  | `/api/tags:list`      | Query list |
| `GET`  | `/api/tags:get/1`     | Query single |
| `POST` | `/api/tags:create`    | Create   |
| `POST` | `/api/tags:update/1`  | Update   |
| `POST` | `/api/tags:destroy/1` | Delete   |

| Method Request   | Path                             | Operasi                            |
| -------- | ------------------------------ | ----------------------------- |
| `GET`  | `/api/posts/1/tags:list`   | Query semua `tags` yang terkait dengan `post` tertentu   |
| `GET`  | `/api/posts/1/tags:get/1`  | Query single `tags` di bawah `post` tertentu    |
| `POST` | `/api/posts/1/tags:create`  | Membuat single `tags` di bawah `post` tertentu    |
| `POST` | `/api/posts/1/tags:update/1`  | Update single `tags` di bawah `post` tertentu    |
| `POST` | `/api/posts/1/tags:destroy/1`  | Delete single `tags` di bawah `post` tertentu    |
| `POST` | `/api/posts/1/tags:add`    | Menambahkan `tags` terkait di bawah `post` tertentu   |
| `POST` | `/api/posts/1/tags:remove` | Menghapus `tags` terkait dari `post` tertentu   |
| `POST` | `/api/posts/1/tags:set`    | Mengatur semua `tags` terkait di bawah `post` tertentu |
| `POST` | `/api/posts/1/tags:toggle` | Toggle asosiasi `tags` di bawah `post` tertentu   |

:::tip Tips

Operasi resource NocoBase tidak langsung bergantung pada method HTTP request, tetapi menentukan operasi yang dieksekusi melalui definisi `:action` secara eksplisit.

:::

## Operasi Resource

NocoBase memiliki beberapa tipe operasi bawaan, yang mencakup skenario bisnis umum.

### Operasi CRUD Dasar

| Nama Operasi | Penjelasan | Tipe Resource yang Berlaku | Method Request | Contoh Path |
| --------- | ------ | ------ | -------- | ---------------------- |
| `list`    | Query data list | Semua | GET/POST | `/api/posts:list`      |
| `get`     | Query data tunggal | Semua | GET/POST | `/api/posts:get/1`     |
| `create`  | Membuat record baru | Semua | POST     | `/api/posts:create`    |
| `update`  | Update record   | Semua | POST     | `/api/posts:update/1`  |
| `destroy` | Delete record   | Semua | POST     | `/api/posts:destroy/1` |
| `firstOrCreate`  | Mencari record pertama, membuat jika tidak ada | Semua | POST     |  `/api/users:firstOrCreate`  |
| `updateOrCreate` | Update record, membuat jika tidak ada    | Semua | POST     |  `/api/users:updateOrCreate` |

### Operasi Relasi

| Nama Operasi | Penjelasan | Tipe Relasi yang Berlaku | Contoh Path |
| -------- | -------------- | ---------------------------------------- | ------------------------------ |
| `add`    | Menambahkan asosiasi | `hasMany`, `belongsToMany` | `/api/posts/1/tags:add`    |
| `remove` | Menghapus asosiasi | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`    | Reset asosiasi | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle` | Menambah atau menghapus asosiasi | `belongsToMany` | `/api/posts/1/tags:toggle`     |

### Parameter Operasi

Parameter operasi umum termasuk:

* `filter`: Kondisi query
* `values`: Nilai yang diatur
* `fields`: Menentukan field yang dikembalikan
* `appends`: Menyertakan data terkait
* `except`: Mengecualikan field
* `sort`: Aturan sorting
* `page`, `pageSize`: Parameter pagination
* `paginate`: Apakah mengaktifkan pagination
* `tree`: Apakah mengembalikan struktur tree
* `whitelist`, `blacklist`: Whitelist/blacklist field
* `updateAssociationValues`: Apakah memperbarui nilai asosiasi

---

## Operasi Resource Kustom

Anda dapat menggunakan `registerActionHandlers` untuk mendaftarkan operasi tambahan untuk resource yang ada, mendukung operasi global dan operasi resource khusus.

### Mendaftarkan Operasi Global

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Mendaftarkan Operasi Khusus Resource

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Contoh request:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Aturan penamaan: `resourceName:actionName`, saat menyertakan asosiasi gunakan sintaks dot (`posts.comments`).

## Resource Kustom

Jika Anda perlu menyediakan resource yang tidak terkait dengan tabel data, dapat menggunakan `resourceManager.define` untuk mendefinisikan:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

Method request sama dengan resource otomatis:

* `GET /api/app:getInfo`
* `POST /api/app:getInfo` (default mendukung GET/POST sekaligus)

## Middleware Kustom

Menggunakan `resourceManager.use()` dapat mendaftarkan middleware global. Misalnya middleware logging global:

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Property Khusus Context

Dapat memasuki middleware atau action di layer `resourceManager`, berarti resource tersebut pasti ada. Pada saat ini Anda dapat mengakses konteks request melalui property berikut:

### ctx.action

- `ctx.action.actionName`: Nama operasi
- `ctx.action.resourceName`: Mungkin berupa collection atau association
- `ctx.action.params`: Parameter operasi

### ctx.dataSource

Objek data source saat ini

### ctx.getCurrentRepository()

Objek repository saat ini

## Cara Mendapatkan Objek resourceManager dari Data Source yang Berbeda

`resourceManager` milik data source, Anda dapat mendaftarkan operasi secara terpisah untuk data source yang berbeda.

### Data Source Utama

Data source utama dapat langsung menggunakan `app.resourceManager`:

```ts
app.resourceManager.registerActionHandlers();
```

### Data Source Lain

Data source lain dapat memperoleh instance yang sesuai melalui `dataSourceManager`:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Iterasi Semua Data Source

Jika perlu mengeksekusi operasi yang sama untuk semua data source, dapat menggunakan `dataSourceManager.afterAddDataSource` untuk iterasi:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```

## Tautan Terkait

- [Cheatsheet Resource API](../../api/flow-engine/resource.md) — Method signature lengkap dan penggunaan MultiRecordResource / SingleRecordResource client
- [ACL Kontrol Hak Akses](./acl.md) — Mengkonfigurasi hak akses role dan kontrol akses untuk operasi resource
- [Context Konteks Request](./context.md) — Mendapatkan informasi konteks dalam handler request
- [Middleware](./middleware.md) — Menambahkan logika intersepsi dan pemrosesan untuk request
- [DataSourceManager Manajemen Data Source](./data-source-manager.md) — Mengelola beberapa data source dan resource manager-nya
- [Collections Tabel Data](./collections.md) — Hubungan mapping otomatis Collection dengan Resource
