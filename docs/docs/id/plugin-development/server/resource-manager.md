:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# ResourceManager

Fungsi manajemen sumber daya NocoBase dapat secara otomatis mengubah `koleksi` dan `asosiasi` yang ada menjadi sumber daya, dengan tipe operasi bawaan untuk membantu pengembang membangun operasi sumber daya REST API dengan cepat. Sedikit berbeda dari REST API tradisional, operasi sumber daya NocoBase tidak bergantung pada metode permintaan HTTP, melainkan menentukan operasi spesifik yang akan dijalankan melalui definisi `:action` yang eksplisit.

## Membuat Sumber Daya Secara Otomatis

NocoBase secara otomatis mengubah `koleksi` dan `asosiasi` yang didefinisikan dalam database menjadi sumber daya. Misalnya, mendefinisikan dua `koleksi`, yaitu `posts` dan `tags`:

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

Ini akan secara otomatis menghasilkan sumber daya berikut:

*   Sumber daya `posts`
*   Sumber daya `tags`
*   Sumber daya asosiasi `posts.tags`

Contoh permintaan:

| Metode   | Path                     | Operasi       |
| -------- | ---------------------- | ------------- |
| `GET`  | `/api/posts:list`      | Melihat daftar |
| `GET`  | `/api/posts:get/1`     | Melihat satu data |
| `POST` | `/api/posts:create`    | Menambah baru |
| `POST` | `/api/posts:update/1`  | Memperbarui   |
| `POST` | `/api/posts:destroy/1` | Menghapus     |

| Metode   | Path                     | Operasi       |
| -------- | ---------------------- | ------------- |
| `GET`  | `/api/tags:list`       | Melihat daftar |
| `GET`  | `/api/tags:get/1`      | Melihat satu data |
| `POST` | `/api/tags:create`     | Menambah baru |
| `POST` | `/api/tags:update/1`   | Memperbarui   |
| `POST` | `/api/tags:destroy/1`  | Menghapus     |

| Metode   | Path                             | Operasi                                     |
| -------- | ------------------------------ | ------------------------------------------- |
| `GET`  | `/api/posts/1/tags:list`       | Melihat semua `tags` yang terkait dengan `post` tertentu |
| `GET`  | `/api/posts/1/tags:get/1`      | Melihat satu `tag` di bawah `post` tertentu |
| `POST` | `/api/posts/1/tags:create`     | Menambah satu `tag` baru di bawah `post` tertentu |
| `POST` | `/api/posts/1/tags:update/1`   | Memperbarui satu `tag` di bawah `post` tertentu |
| `POST` | `/api/posts/1/tags:destroy/1`  | Menghapus satu `tag` di bawah `post` tertentu |
| `POST` | `/api/posts/1/tags:add`        | Menambahkan `tags` terkait ke `post` tertentu |
| `POST` | `/api/posts/1/tags:remove`     | Menghapus `tags` terkait dari `post` tertentu |
| `POST` | `/api/posts/1/tags:set`        | Mengatur semua `tags` terkait untuk `post` tertentu |
| `POST` | `/api/posts/1/tags:toggle`     | Mengalihkan asosiasi `tags` untuk `post` tertentu |

:::tip Tip

Operasi sumber daya NocoBase tidak secara langsung bergantung pada metode permintaan, melainkan menentukan operasi melalui definisi `:action` yang eksplisit.

:::

## Operasi Sumber Daya

NocoBase menyediakan beragam tipe operasi bawaan untuk memenuhi berbagai kebutuhan bisnis.

### Operasi CRUD Dasar

| Nama Operasi       | Deskripsi                             | Tipe Sumber Daya yang Berlaku | Metode Permintaan | Contoh Path                |
| ---------------- | --------------------------------------- | ------------------------- | -------------- | --------------------------- |
| `list`           | Melihat data daftar                     | Semua                     | GET/POST       | `/api/posts:list`           |
| `get`            | Melihat satu data                       | Semua                     | GET/POST       | `/api/posts:get/1`          |
| `create`         | Membuat catatan baru                    | Semua                     | POST           | `/api/posts:create`         |
| `update`         | Memperbarui catatan                     | Semua                     | POST           | `/api/posts:update/1`       |
| `destroy`        | Menghapus catatan                       | Semua                     | POST           | `/api/posts:destroy/1`      |
| `firstOrCreate`  | Mencari catatan pertama, jika tidak ada maka buat | Semua                     | POST           | `/api/users:firstOrCreate`  |
| `updateOrCreate` | Memperbarui catatan, jika tidak ada maka buat     | Semua                     | POST           | `/api/users:updateOrCreate` |

### Operasi Asosiasi

| Nama Operasi | Deskripsi               | Tipe Asosiasi yang Berlaku                        | Contoh Path                   |
| -------------- | ------------------------- | ------------------------------------------------- | ------------------------------ |
| `add`          | Menambahkan asosiasi      | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`        |
| `remove`       | Menghapus asosiasi        | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`          | Mengatur ulang asosiasi   | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`       | Menambahkan atau menghapus asosiasi | `belongsToMany`                                   | `/api/posts/1/tags:toggle`     |

### Parameter Operasi

Parameter operasi umum meliputi:

*   `filter`: Kondisi kueri
*   `values`: Nilai yang diatur
*   `fields`: Menentukan bidang yang dikembalikan
*   `appends`: Menyertakan data asosiasi
*   `except`: Mengecualikan bidang
*   `sort`: Aturan pengurutan
*   `page`, `pageSize`: Parameter paginasi
*   `paginate`: Apakah paginasi diaktifkan
*   `tree`: Apakah mengembalikan struktur pohon
*   `whitelist`, `blacklist`: Daftar putih/hitam bidang
*   `updateAssociationValues`: Apakah memperbarui nilai asosiasi

---

## Operasi Sumber Daya Kustom

NocoBase memungkinkan pendaftaran operasi tambahan untuk sumber daya yang sudah ada. Anda dapat menggunakan `registerActionHandlers` untuk menyesuaikan operasi untuk semua atau sumber daya tertentu.

### Mendaftarkan Operasi Global

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Mendaftarkan Operasi Spesifik Sumber Daya

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Contoh permintaan:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Aturan penamaan: `resourceName:actionName`, gunakan sintaks titik (`posts.comments`) saat menyertakan asosiasi.

## Sumber Daya Kustom

Jika Anda perlu menyediakan sumber daya yang tidak terkait dengan `koleksi`, Anda dapat menggunakan metode `resourceManager.define` untuk mendefinisikannya:

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

Metode permintaan konsisten dengan sumber daya yang dibuat secara otomatis:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (secara default mendukung GET/POST secara bersamaan)

## Middleware Kustom

Gunakan metode `resourceManager.use()` untuk mendaftarkan middleware global. Contohnya:

Middleware pencatat global

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Properti Context Khusus

Kemampuan untuk masuk ke middleware atau `action` pada lapisan `resourceManager` berarti sumber daya tersebut pasti ada.

### ctx.action

-   `ctx.action.actionName`: Nama operasi
-   `ctx.action.resourceName`: Bisa berupa `koleksi` atau `asosiasi`
-   `ctx.action.params`: Parameter operasi

### ctx.dataSource

Objek `sumber data` saat ini.

### ctx.getCurrentRepository()

Objek repositori saat ini.

## Cara Mendapatkan Objek resourceManager untuk Sumber Data yang Berbeda

`resourceManager` termasuk dalam `sumber data`, dan operasi dapat didaftarkan secara terpisah untuk `sumber data` yang berbeda.

### Sumber Data Utama

Untuk `sumber data` utama, Anda dapat langsung menggunakan `app.resourceManager` untuk melakukan operasi:

```ts
app.resourceManager.registerActionHandlers();
```

### Sumber Data Lainnya

Untuk `sumber data` lainnya, Anda dapat memperoleh instance `sumber data` tertentu melalui `dataSourceManager` dan menggunakan `resourceManager` dari instance tersebut untuk melakukan operasi:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Mengiterasi Semua Sumber Data

Jika Anda perlu melakukan operasi yang sama pada semua `sumber data` yang telah ditambahkan, Anda dapat menggunakan metode `dataSourceManager.afterAddDataSource` untuk melakukan iterasi, memastikan `resourceManager` setiap `sumber data` dapat mendaftarkan operasi yang sesuai:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```