:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Context

Di NocoBase, setiap permintaan akan menghasilkan objek `ctx`, yang merupakan instance dari Context. Context merangkum informasi permintaan dan respons, sekaligus menyediakan fungsionalitas khusus NocoBase, seperti akses basis data, operasi cache, manajemen izin, internasionalisasi, dan pencatatan log.

Aplikasi NocoBase dibangun di atas Koa, sehingga `ctx` pada dasarnya adalah Koa Context. Namun, NocoBase memperluasnya dengan API yang kaya, memungkinkan pengembang untuk dengan mudah menangani logika bisnis di Middleware dan Action. Setiap permintaan memiliki `ctx` yang independen, memastikan isolasi dan keamanan data antar permintaan.

## ctx.action

`ctx.action` menyediakan akses ke Action yang sedang dieksekusi untuk permintaan saat ini. Meliputi:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Menampilkan nama Action saat ini
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Dukungan internasionalisasi (i18n).

- `ctx.i18n` menyediakan informasi lokal (locale)
- `ctx.t()` digunakan untuk menerjemahkan string berdasarkan bahasa

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Mengembalikan terjemahan berdasarkan bahasa permintaan
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` menyediakan antarmuka akses basis data, memungkinkan Anda untuk langsung mengoperasikan model dan mengeksekusi kueri.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` menyediakan operasi cache, mendukung pembacaan dan penulisan ke cache, umumnya digunakan untuk mempercepat akses data atau menyimpan status sementara.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Cache selama 60 detik
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` adalah instance aplikasi NocoBase, memungkinkan akses ke konfigurasi global, plugin, dan layanan.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` mengambil informasi pengguna yang saat ini terautentikasi, cocok digunakan dalam pemeriksaan izin atau logika bisnis.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` digunakan untuk berbagi data dalam rantai middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` menyediakan kemampuan pencatatan log, mendukung keluaran log multi-level.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
});
```

## ctx.permission & ctx.can()

`ctx.permission` digunakan untuk manajemen izin, `ctx.can()` digunakan untuk memeriksa apakah pengguna saat ini memiliki izin untuk mengeksekusi operasi tertentu.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Ringkasan

- Setiap permintaan berkorespondensi dengan objek `ctx` yang independen.
- `ctx` adalah ekstensi dari Koa Context, yang mengintegrasikan fungsionalitas NocoBase.
- Properti umum meliputi: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()`, dll.
- Menggunakan `ctx` di Middleware dan Action dapat mempermudah pengoperasian permintaan, respons, izin, log, dan basis data.