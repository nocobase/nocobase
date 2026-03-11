:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/request).
:::

# ctx.request()

Melakukan permintaan HTTP dengan autentikasi di dalam RunJS. Permintaan akan secara otomatis membawa `baseURL`, `Token`, `locale`, `role`, dll., dari aplikasi saat ini, serta mengikuti logika intersepsi permintaan dan penanganan kesalahan aplikasi.

## Skenario Penggunaan

Dapat digunakan dalam skenario apa pun di RunJS yang memerlukan permintaan HTTP jarak jauh, seperti JSBlock, JSField, JSItem, JSColumn, alur kerja, keterkaitan (linkage), JSAction, dll.

## Definisi Tipe

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` memperluas `AxiosRequestConfig` milik Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Apakah akan melewatkan perintah kesalahan global saat permintaan gagal
  skipAuth?: boolean;                                 // Apakah akan melewatkan pengalihan autentikasi (misalnya, tidak dialihkan ke halaman login pada 401)
};
```

## Parameter Umum

| Parameter | Tipe | Keterangan |
|------|------|------|
| `url` | string | URL permintaan. Mendukung gaya sumber daya (misalnya, `users:list`, `posts:create`), atau URL lengkap |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | Metode HTTP, defaultnya adalah `'get'` |
| `params` | object | Parameter kueri, diserialisasi ke dalam URL |
| `data` | any | Body permintaan, digunakan untuk post/put/patch |
| `headers` | object | Header permintaan khusus |
| `skipNotify` | boolean \| (error) => boolean | Jika true atau fungsi mengembalikan true, perintah kesalahan global tidak akan muncul saat gagal |
| `skipAuth` | boolean | Jika true, kesalahan 401 dsb. tidak akan memicu pengalihan autentikasi (seperti pengalihan ke halaman login) |

## URL Gaya Sumber Daya

API Sumber Daya NocoBase mendukung format singkatan `sumber_daya:aksi`:

| Format | Keterangan | Contoh |
|------|------|------|
| `collection:action` | CRUD koleksi tunggal | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Sumber daya terkait (perlu meneruskan kunci utama melalui `resourceOf` atau URL) | `posts.comments:list` |

Path relatif akan digabungkan dengan `baseURL` aplikasi (biasanya `/api`); permintaan lintas domain (cross-origin) harus menggunakan URL lengkap, dan layanan target harus dikonfigurasi dengan CORS.

## Struktur Respons

Nilai yang dikembalikan adalah objek respons Axios, bidang yang umum digunakan:

- `response.data`: Body respons
- Antarmuka daftar biasanya mengembalikan `data.data` (array rekaman) + `data.meta` (paginasi, dll.)
- Antarmuka rekaman tunggal/buat/perbarui biasanya mengembalikan rekaman dalam `data.data`

## Contoh

### Kueri Daftar

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Informasi paginasi, dll.
```

### Mengirim Data

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Budi', email: 'budi@example.com' },
});

const newRecord = res?.data?.data;
```

### Dengan Filter dan Pengurutan

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### Melewatkan Perintah Kesalahan

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Tidak memunculkan pesan global saat gagal
});

// Atau tentukan apakah akan dilewatkan berdasarkan tipe kesalahan
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Permintaan Lintas Domain (Cross-Origin)

Saat menggunakan URL lengkap untuk meminta domain lain, layanan target harus dikonfigurasi dengan CORS untuk mengizinkan asal aplikasi saat ini. Jika antarmuka target memerlukan token sendiri, token tersebut dapat diteruskan melalui header:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <token_layanan_target>',
  },
});
```

### Menampilkan dengan ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Daftar Pengguna') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Catatan

- **Penanganan Kesalahan**: Kegagalan permintaan akan melempar pengecualian, dan secara default perintah kesalahan global akan muncul. Gunakan `skipNotify: true` untuk menangkap dan menanganinya sendiri.
- **Autentikasi**: Permintaan dalam domain yang sama akan secara otomatis membawa Token, locale, dan role pengguna saat ini; permintaan lintas domain memerlukan dukungan CORS dari target, dan token diteruskan dalam header sesuai kebutuhan.
- **Izin Sumber Daya**: Permintaan tunduk pada batasan ACL dan hanya dapat mengakses sumber daya yang diizinkan bagi pengguna saat ini.

## Terkait

- [ctx.message](./message.md) - Menampilkan perintah ringan setelah permintaan selesai
- [ctx.notification](./notification.md) - Menampilkan notifikasi setelah permintaan selesai
- [ctx.render](./render.md) - Merender hasil permintaan ke antarmuka
- [ctx.makeResource](./make-resource.md) - Membangun objek sumber daya untuk pemuatan data berantai (alternatif selain `ctx.request`)