---
title: "ctx.route"
description: "ctx.route adalah informasi route saat ini, berisi path, params, dll., untuk mendapatkan parameter halaman, render bersyarat."
keywords: "ctx.route,route,path,params,parameter halaman,RunJS,NocoBase"
---

# ctx.route

Informasi pencocokan route saat ini, sesuai dengan konsep route React Router, untuk mendapatkan konfigurasi route yang cocok saat ini, parameter, dll. Biasanya digunakan dengan `ctx.router`, `ctx.location`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField** | Render bersyarat berdasarkan `route.pathname` atau `route.params`, menampilkan identifier halaman saat ini |
| **Aturan Linkage / Event Flow** | Membaca parameter route (seperti `params.name`) untuk cabang logika atau diteruskan ke sub-komponen |
| **Navigasi View** | Internal membandingkan `ctx.route.pathname` dengan path target, menentukan apakah memicu `ctx.router.navigate` |

> Perhatian: `ctx.route` hanya tersedia pada environment RunJS yang memiliki konteks route (seperti JSBlock dalam halaman, halaman Flow, dll.); pada konteks pure backend atau tanpa route (seperti workflow) mungkin kosong.

## Definisi Tipe

```ts
type RouteOptions = {
  name?: string;   // Identifier unik route
  path?: string;   // Template route (seperti /admin/:name)
  params?: Record<string, any>;  // Parameter route (seperti { name: 'users' })
  pathname?: string;  // Path lengkap route saat ini (seperti /admin/users)
};
```

## Field Umum

| Field | Tipe | Deskripsi |
|------|------|------|
| `pathname` | `string` | Path lengkap route saat ini, sama dengan `ctx.location.pathname` |
| `params` | `Record<string, any>` | Parameter dinamis yang di-parse dari template route, seperti `{ name: 'users' }` |
| `path` | `string` | Template route, seperti `/admin/:name` |
| `name` | `string` | Identifier unik route, sering digunakan pada skenario multi-tab, multi-view |

## Hubungan dengan ctx.router, ctx.location

| Tujuan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Membaca path saat ini** | `ctx.route.pathname` atau `ctx.location.pathname`, keduanya konsisten saat cocok |
| **Membaca parameter route** | `ctx.route.params`, seperti `params.name` merepresentasikan UID halaman saat ini |
| **Navigasi** | `ctx.router.navigate(path)` |
| **Membaca query parameter, state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` lebih fokus pada "konfigurasi route yang cocok", `ctx.location` lebih fokus pada "posisi URL saat ini", keduanya bersama dapat mendeskripsikan status route saat ini secara lengkap.

## Contoh

### Membaca pathname

```ts
// Menampilkan path saat ini
ctx.message.info('Halaman saat ini: ' + ctx.route.pathname);
```

### Membuat Cabang Berdasarkan params

```ts
// params.name biasanya adalah UID halaman saat ini (seperti identifier halaman flow)
if (ctx.route.params?.name === 'users') {
  // Eksekusi logika tertentu di halaman manajemen user
}
```

### Tampilan di Halaman Flow

```tsx
<div>
  <h1>Halaman saat ini - {ctx.route.pathname}</h1>
  <p>Identifier route: {ctx.route.params?.name}</p>
</div>
```

## Terkait

- [ctx.router](./router.md): Navigasi route, setelah `ctx.router.navigate()` mengubah path, `ctx.route` akan ikut update
- [ctx.location](./location.md): Posisi URL saat ini (pathname, search, hash, state), digunakan dengan `ctx.route`
