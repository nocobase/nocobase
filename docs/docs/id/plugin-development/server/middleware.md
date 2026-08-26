---
title: "Middleware"
description: "Middleware server NocoBase: app.use, middleware Koa, intersepsi request, middleware resource."
keywords: "Middleware,middleware,app.use,Koa,intersepsi request,middleware resource,NocoBase"
---

# Middleware

Middleware NocoBase Server pada dasarnya adalah **middleware Koa**, Anda dapat memanipulasi objek `ctx` untuk menangani request dan response seperti di Koa. Namun karena NocoBase perlu mengelola logika di berbagai layer bisnis, jika semua middleware ditempatkan di satu tempat, akan sangat sulit dikelola.

Untuk itu, NocoBase membagi middleware menjadi **empat level**:

1. **Middleware level Data Source**: `app.dataSourceManager.use()`
   Hanya berlaku untuk request data source tertentu, sering digunakan untuk koneksi database, validasi field, atau pemrosesan transaksi data source tersebut.

2. **Middleware level Resource**: `app.resourceManager.use()`
   Hanya berlaku untuk Resource yang sudah didefinisikan, cocok untuk menangani logika level resource, seperti hak akses data, formatting, dll.

3. **Middleware level Hak Akses**: `app.acl.use()`
   Dieksekusi sebelum penilaian hak akses, digunakan untuk memvalidasi hak akses pengguna atau role.

4. **Middleware level Aplikasi**: `app.use()`
   Akan dieksekusi pada setiap request, cocok untuk pencatatan log, penanganan error umum, pemrosesan response, dll.

## Registrasi Middleware

Middleware biasanya didaftarkan pada method `load` plugin, contohnya:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware level aplikasi
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware data source
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware hak akses
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware resource
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Urutan Eksekusi

Urutan eksekusi middleware adalah sebagai berikut:

1. Pertama eksekusi middleware hak akses yang ditambahkan oleh `acl.use()`
2. Kemudian eksekusi middleware resource yang ditambahkan oleh `resourceManager.use()`
3. Selanjutnya eksekusi middleware data source yang ditambahkan oleh `dataSourceManager.use()`
4. Terakhir eksekusi middleware aplikasi yang ditambahkan oleh `app.use()`

## Mekanisme Insertion before / after / tag

Untuk mengontrol urutan middleware secara lebih fleksibel, NocoBase menyediakan parameter `before`, `after`, dan `tag`:

- **tag**: Memberikan tanda pada middleware, untuk dirujuk oleh middleware lainnya
- **before**: Sisipkan sebelum middleware dengan tag yang ditentukan
- **after**: Sisipkan setelah middleware dengan tag yang ditentukan

Contoh:

```ts
// Middleware biasa
app.use(m1, { tag: 'restApi' });
app.resourcer.use(m2, { tag: 'parseToken' });
app.resourcer.use(m3, { tag: 'checkRole' });

// m4 akan diletakkan sebelum m1
app.use(m4, { before: 'restApi' });

// m5 akan disisipkan di antara m2 dan m3
app.resourcer.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip Tips

Jika posisi tidak ditentukan, urutan eksekusi default middleware yang baru ditambahkan adalah:
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`

:::

## Contoh Model Onion

Urutan eksekusi middleware mengikuti **model onion** Koa, yaitu masuk ke stack middleware terlebih dahulu, kemudian keluar terakhir.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourcer.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourcer.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Akses API yang berbeda, contoh urutan output:

- **Request biasa**: `/api/hello`
  Output: `[1,2]` (Resource tidak terdefinisi, tidak mengeksekusi middleware `resourceManager` dan `acl`)

- **Request resource**: `/api/test:list`
  Output: `[5,3,7,1,2,8,4,6]`
  Middleware dieksekusi sesuai level dan model onion

## Ringkasan

- Middleware NocoBase adalah ekstensi dari Middleware Koa
- Empat level: aplikasi -> data source -> resource -> hak akses
- Dapat menggunakan `before` / `after` / `tag` untuk mengontrol urutan eksekusi dengan fleksibel
- Mengikuti model onion Koa, memastikan middleware dapat dikomposisi dan dinested
- Middleware level data source hanya berlaku untuk request data source tertentu, middleware level resource hanya berlaku untuk request resource yang terdefinisi

## Tautan Terkait

- [Context](./context.md) — Memahami API lengkap objek `ctx` di middleware
- [ResourceManager Manajemen Resource](./resource-manager.md) — Registrasi middleware level resource dan definisi resource
- [ACL Kontrol Hak Akses](./acl.md) — Penggunaan middleware level hak akses dan logika validasi hak akses
- [Plugin](./plugin.md) — Mendaftarkan middleware dalam method `load` plugin
- [DataSourceManager Manajemen Data Source](./data-source-manager.md) — Skenario penggunaan middleware level data source
- [Ikhtisar Pengembangan Server](./index.md) — Arsitektur server menyeluruh dan posisi middleware di dalamnya
