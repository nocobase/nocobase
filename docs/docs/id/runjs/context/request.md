---
title: "ctx.request()"
description: "ctx.request() melakukan HTTP request dengan autentikasi di RunJS, otomatis membawa baseURL, Token, locale, mengikuti interceptor aplikasi dan error handling."
keywords: "ctx.request,HTTP request,baseURL,Token,autentikasi,RunJS,NocoBase"
---

# ctx.request()

Melakukan HTTP request dengan autentikasi di RunJS. Request akan otomatis membawa baseURL, Token, locale, role, dll. dari aplikasi saat ini, dan mengikuti logika interceptor request dan error handling aplikasi.

## Skenario Penggunaan

Semua skenario di RunJS yang perlu melakukan remote HTTP request, seperti JSBlock, JSField, JSItem, JSColumn, event flow, linkage, JSAction, dll.

## Definisi Tipe

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` di-extend berdasarkan `AxiosRequestConfig` dari Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Apakah skip tip error global saat request gagal
  skipAuth?: boolean;                                 // Apakah skip auth navigation (seperti tidak navigate ke halaman login pada 401)
};
```

## Parameter Umum

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `url` | string | URL request. Mendukung gaya resource (seperti `users:list`, `posts:create`), atau URL lengkap |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | Method HTTP, default `'get'` |
| `params` | object | Query parameter, di-serialize ke URL |
| `data` | any | Request body, untuk post/put/patch |
| `headers` | object | Custom request header |
| `skipNotify` | boolean \| (error) => boolean | Saat true atau function mengembalikan true, gagal tidak menampilkan tip error global |
| `skipAuth` | boolean | Saat true 401, dll. tidak memicu auth navigation (seperti navigate ke halaman login) |

## URL Gaya Resource

API resource NocoBase mendukung bentuk singkat `resource:action`:

| Format | Deskripsi | Contoh |
|------|------|------|
| `collection:action` | CRUD single table | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Resource relasi (perlu meneruskan primary key melalui `resourceOf` atau URL) | `posts.comments:list` |

Path relatif akan digabungkan dengan baseURL aplikasi (biasanya `/api`); cross-domain perlu menggunakan URL lengkap, layanan target perlu mengkonfigurasi CORS.

## Struktur Response

Return value adalah objek response Axios, field umum:

- `response.data`: response body
- API list biasanya `data.data` (array record) + `data.meta` (pagination, dll.)
- API single/create/update biasanya `data.data` adalah single record

## Contoh

### Query List

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Informasi pagination, dll.
```

### Submit Data

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Andi', email: 'andi@example.com' },
});

const newRecord = res?.data?.data;
```

### Dengan Filter dan Sorting

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

### Skip Tip Error

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Tidak menampilkan message global saat gagal
});

// Atau menentukan apakah skip berdasarkan tipe error
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Cross-Domain Request

Saat menggunakan URL lengkap untuk request domain lain, layanan target perlu mengkonfigurasi CORS untuk mengizinkan asal aplikasi saat ini. Jika API target memerlukan token sendiri, dapat diteruskan melalui headers:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <token layanan target>',
  },
});
```

### Bersama dengan ctx.render untuk Tampilan

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Daftar User') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Hal yang Perlu Diperhatikan

- **Error handling**: request yang gagal akan melempar exception, default akan menampilkan tip error global. Menggunakan `skipNotify: true` dapat menangkap dan memprosesnya sendiri.
- **Autentikasi**: request domain yang sama akan otomatis membawa Token, locale, role pengguna saat ini; cross-domain memerlukan target untuk mendukung CORS, dan menyertakan token sesuai kebutuhan di headers.
- **Izin resource**: request dibatasi oleh ACL, hanya dapat mengakses resource yang dimiliki user saat ini.

## Terkait

- [ctx.message](./message.md) - Menampilkan tip ringan setelah request selesai
- [ctx.notification](./notification.md) - Menampilkan notifikasi setelah request selesai
- [ctx.render](./render.md) - Merender hasil request ke interface
- [ctx.makeResource](./make-resource.md) - Membangun objek resource, untuk loading data berantai (alternatif dari `ctx.request` langsung)
