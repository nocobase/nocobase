:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Middleware

Middleware NocoBase Server pada dasarnya adalah **Koa middleware**. Anda dapat mengoperasikan objek `ctx` untuk menangani permintaan dan respons, sama seperti di Koa. Namun, karena NocoBase perlu mengelola logika di berbagai lapisan bisnis, jika semua middleware ditempatkan bersama, akan sangat sulit untuk dipelihara dan dikelola.

Oleh karena itu, NocoBase membagi middleware menjadi **empat tingkatan**:

1.  **Middleware Tingkat Sumber Data**: `app.dataSourceManager.use()`
    Hanya berlaku untuk permintaan **sumber data tertentu**, sering digunakan untuk koneksi database, validasi kolom, atau logika pemrosesan transaksi untuk sumber data tersebut.

2.  **Middleware Tingkat Sumber Daya**: `app.resourceManager.use()`
    Hanya berlaku untuk sumber daya (Resource) yang telah didefinisikan, cocok untuk menangani logika tingkat sumber daya, seperti izin data, pemformatan, dll.

3.  **Middleware Tingkat Izin**: `app.acl.use()`
    Dieksekusi sebelum pemeriksaan izin, digunakan untuk memverifikasi izin atau peran pengguna.

4.  **Middleware Tingkat Aplikasi**: `app.use()`
    Dieksekusi untuk setiap permintaan, cocok untuk pencatatan log, penanganan kesalahan umum, pemrosesan respons, dll.

## Registrasi Middleware

Middleware biasanya didaftarkan dalam metode `load` dari plugin, contohnya:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware tingkat aplikasi
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware sumber data
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware izin
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware sumber daya
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Urutan Eksekusi

Urutan eksekusi middleware adalah sebagai berikut:

1.  Pertama, eksekusi middleware izin yang ditambahkan oleh `acl.use()`
2.  Kemudian, eksekusi middleware sumber daya yang ditambahkan oleh `resourceManager.use()`
3.  Selanjutnya, eksekusi middleware sumber data yang ditambahkan oleh `dataSourceManager.use()`
4.  Terakhir, eksekusi middleware aplikasi yang ditambahkan oleh `app.use()`

## Mekanisme Penyisipan `before` / `after` / `tag`

Untuk kontrol urutan middleware yang lebih fleksibel, NocoBase menyediakan parameter `before`, `after`, dan `tag`:

-   **tag**: Memberikan penanda pada middleware, digunakan untuk direferensikan oleh middleware berikutnya.
-   **before**: Menyisipkan sebelum middleware dengan `tag` yang ditentukan.
-   **after**: Menyisipkan setelah middleware dengan `tag` yang ditentukan.

Contoh:

```ts
// Middleware biasa
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 akan ditempatkan sebelum m1
app.use(m4, { before: 'restApi' });

// m5 akan disisipkan di antara m2 dan m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Jika posisi tidak ditentukan, urutan eksekusi default untuk middleware yang baru ditambahkan adalah:
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`

:::

## Contoh Model Onion Ring

Urutan eksekusi middleware mengikuti **Model Onion Ring** Koa, yaitu masuk ke tumpukan middleware terlebih dahulu, dan keluar terakhir.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
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

app.resourceManager.define({
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

Contoh urutan output saat mengakses antarmuka yang berbeda:

-   **Permintaan Biasa**: `/api/hello`
    Output: `[1,2]` (sumber daya tidak terdefinisi, tidak mengeksekusi middleware `resourceManager` dan `acl`)

-   **Permintaan Sumber Daya**: `/api/test:list`
    Output: `[5,3,7,1,2,8,4,6]`
    Middleware dieksekusi sesuai dengan urutan tingkatan dan model onion ring.

## Ringkasan

-   NocoBase Middleware adalah ekstensi dari Koa Middleware
-   Empat tingkatan: Aplikasi -> Sumber Data -> Sumber Daya -> Izin
-   Dapat menggunakan `before` / `after` / `tag` untuk mengontrol urutan eksekusi secara fleksibel
-   Mengikuti Model Onion Ring Koa, memastikan middleware dapat dikombinasikan dan disarangkan
-   Middleware tingkat sumber data hanya berlaku untuk permintaan sumber data yang ditentukan, middleware tingkat sumber daya hanya berlaku untuk permintaan sumber daya yang telah didefinisikan