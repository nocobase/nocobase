---
title: "Context Konteks Request"
description: "ctx server NocoBase: ekstensi Koa Context, ctx.action, ctx.db, ctx.cache, penggunaan dalam Middleware dan Action."
keywords: "Context,ctx,ctx.action,Koa,konteks request,Middleware,Action,NocoBase"
---

# Context

Di NocoBase, setiap request akan menghasilkan objek `ctx`, yang merupakan instance dari Context. Context mengenkapsulasi informasi request dan response, sekaligus menyediakan fungsionalitas khusus NocoBase — seperti akses database, operasi cache, manajemen hak akses, internasionalisasi, dan pencatatan log, dll.

`Application` NocoBase berbasis pada Koa, sehingga `ctx` pada dasarnya adalah Koa Context, namun NocoBase memperluas lebih banyak API di atasnya, sehingga Anda dapat dengan mudah menangani logika bisnis di Middleware dan Action. Setiap request memiliki `ctx` independen, memastikan isolasi data antar request.

## ctx.action

`ctx.action` menyediakan informasi Action yang dieksekusi oleh request saat ini, termasuk:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Nama Action saat ini
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Dukungan internasionalisasi (i18n).

- `ctx.i18n` menyediakan informasi locale
- `ctx.t()` digunakan untuk menerjemahkan string sesuai bahasa

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Mengembalikan terjemahan sesuai bahasa saat ini
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` menyediakan interface akses database, dapat langsung mengoperasikan model dan mengeksekusi query.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` menyediakan operasi cache, mendukung baca dan tulis cache, sering digunakan untuk mempercepat akses data atau menyimpan status sementara.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', { ttl: 60 }); // Cache 60 detik
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` adalah instance aplikasi NocoBase, dapat mengakses konfigurasi global, plugin, dan service.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` mendapatkan informasi pengguna yang sudah terautentikasi saat ini, cocok untuk validasi hak akses atau logika bisnis.

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

`ctx.logger` menyediakan kemampuan pencatatan log, mendukung output log multi-level.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` digunakan untuk manajemen hak akses, `ctx.can()` digunakan untuk menentukan apakah pengguna saat ini memiliki hak akses untuk mengeksekusi operasi tertentu.

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

- Setiap request berkorespondensi dengan satu objek `ctx` independen
- `ctx` adalah ekstensi dari Koa Context, mengintegrasikan berbagai kapabilitas NocoBase
- Property umum termasuk: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()`, dll.
- Menggunakan `ctx` di Middleware dan Action dapat dengan mudah mengoperasikan request, response, hak akses, log, dan database

## Tautan Terkait

- [Middleware](./middleware.md) — Alur lengkap penggunaan `ctx` untuk menangani request di middleware
- [ResourceManager Manajemen Resource](./resource-manager.md) — Sumber dan definisi `ctx.action` di Action resource
- [ACL Kontrol Hak Akses](./acl.md) — Mekanisme validasi hak akses `ctx.permission` dan `ctx.can()`
- [Cache](./cache.md) — Penggunaan detail operasi cache `ctx.cache`
- [Logger Log](./logger.md) — Pencatatan log dan konfigurasi output `ctx.logger`
- [i18n Internasionalisasi](./i18n.md) — Dukungan internasionalisasi `ctx.t()` dan `ctx.i18n`
