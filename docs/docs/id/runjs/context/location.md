---
title: "ctx.location"
description: "ctx.location adalah informasi URL halaman saat ini, read-only, mendukung navigasi aman, untuk mendapatkan query, hash, dll."
keywords: "ctx.location,URL,query,hash,navigasi halaman,RunJS,NocoBase"
---

# ctx.location

Informasi posisi route saat ini, setara dengan objek `location` di React Router. Biasanya digunakan dengan `ctx.router`, `ctx.route`, untuk membaca path saat ini, query string, hash, dan state yang dikirim melalui route.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField** | Render bersyarat atau cabang logika berdasarkan path, query parameter, atau hash saat ini |
| **Aturan Linkage / Event Flow** | Membaca query parameter URL untuk linkage filter, atau menentukan asal berdasarkan `location.state` |
| **Pemrosesan Setelah Navigasi Route** | Pada halaman target menerima data yang dikirim halaman sebelumnya melalui `ctx.router.navigate` melalui `ctx.location.state` |

> Perhatian: `ctx.location` hanya tersedia pada environment RunJS yang memiliki konteks route (seperti JSBlock dalam halaman, event flow, dll.); pada konteks pure backend atau tanpa route (seperti workflow) mungkin kosong.

## Definisi Tipe

```ts
location: Location;
```

`Location` berasal dari `react-router-dom`, sama dengan return value `useLocation()` di React Router.

## Field Umum

| Field | Tipe | Deskripsi |
|------|------|------|
| `pathname` | `string` | Path saat ini, dimulai dengan `/` (seperti `/admin/users`) |
| `search` | `string` | Query string, dimulai dengan `?` (seperti `?page=1&status=active`) |
| `hash` | `string` | Fragment hash, dimulai dengan `#` (seperti `#section-1`) |
| `state` | `any` | Data sembarang yang dikirim melalui `ctx.router.navigate(path, { state })`, tidak tampil di URL |
| `key` | `string` | Identifier unik dari location ini, halaman awal adalah `"default"` |

## Hubungan dengan ctx.router, ctx.urlSearchParams

| Tujuan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Membaca path, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Membaca query parameter (bentuk objek)** | `ctx.urlSearchParams`, dapat langsung mendapatkan objek hasil parsing |
| **Mem-parsing string search** | `new URLSearchParams(ctx.location.search)` atau langsung gunakan `ctx.urlSearchParams` |

`ctx.urlSearchParams` di-parse dari `ctx.location.search`, jika hanya membutuhkan query parameter, menggunakan `ctx.urlSearchParams` lebih praktis.

## Contoh

### Membuat Cabang Berdasarkan Path

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Saat ini di halaman manajemen user');
}
```

### Mem-parsing Query Parameter

```ts
// Cara 1: menggunakan ctx.urlSearchParams (direkomendasikan)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Cara 2: menggunakan URLSearchParams untuk parse search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Menerima State yang Dikirim Saat Navigasi Route

```ts
// Saat halaman sebelumnya navigasi: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Datang dari dashboard');
}
```

### Penempatan Anchor Berdasarkan Hash

```ts
const hash = ctx.location.hash; // seperti "#edit"
if (hash === '#edit') {
  // Scroll ke area edit atau eksekusi logika yang sesuai
}
```

## Terkait

- [ctx.router](./router.md): Navigasi route, `state` dari `ctx.router.navigate` dapat diperoleh di halaman target melalui `ctx.location.state`
- [ctx.route](./route.md): Informasi pencocokan route saat ini (parameter, konfigurasi, dll.), biasanya digunakan dengan `ctx.location`
