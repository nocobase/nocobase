---
title: "ctx.router"
description: "ctx.router adalah instance route, untuk navigasi programmatic, mendapatkan path saat ini, navigasi halaman."
keywords: "ctx.router,route,navigasi programmatic,navigasi halaman,RunJS,NocoBase"
---

# ctx.router

Instance route berbasis React Router, untuk melakukan navigasi melalui kode di RunJS. Biasanya digunakan dengan `ctx.route`, `ctx.location`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField** | Setelah klik tombol navigasi ke halaman detail, halaman list, atau link eksternal |
| **Aturan Linkage / Event Flow** | Setelah submit berhasil `navigate` ke list atau detail, atau meneruskan state ke halaman target |
| **JSAction / Event Handling** | Mengeksekusi navigasi route pada logika seperti submit form, klik link |
| **Navigasi View** | Update URL melalui `navigate` saat berpindah view stack internal |

> Perhatian: `ctx.router` hanya tersedia pada environment RunJS yang memiliki konteks route (seperti JSBlock dalam halaman, halaman Flow, event flow, dll.); pada konteks pure backend atau tanpa route (seperti workflow) mungkin kosong.

## Definisi Tipe

```typescript
router: Router
```

`Router` berasal dari `@remix-run/router`, di RunJS melakukan navigasi, back, refresh, dll. melalui `ctx.router.navigate()`.

## Method

### ctx.router.navigate()

Navigasi ke path target, atau eksekusi back/refresh.

**Signature:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parameter:**

- `to`: path target (string), posisi history relatif (number, seperti `-1` berarti back) atau `null` (refresh halaman saat ini)
- `options`: konfigurasi opsional
  - `replace?: boolean`: apakah mengganti history saat ini (default `false`, yaitu push record baru)
  - `state?: any`: state yang dikirim ke route target. Data ini tidak akan muncul di URL, dapat diakses pada halaman target melalui `ctx.location.state`, cocok untuk informasi sensitif, data sementara, atau informasi yang tidak cocok dimasukkan di URL

## Contoh

### Navigasi Dasar

```ts
// Navigasi ke list user (push history baru, dapat back)
ctx.router.navigate('/admin/users');

// Navigasi ke halaman detail
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Mengganti History (Tanpa Menambah Record)

```ts
// Setelah login redirect ke beranda, user back tidak akan kembali ke halaman login
ctx.router.navigate('/admin', { replace: true });

// Setelah submit form berhasil mengganti halaman saat ini menjadi halaman detail
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Meneruskan state

```ts
// Saat navigasi membawa data, halaman target mendapatkan melalui ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Back dan Refresh

```ts
// Back satu halaman
ctx.router.navigate(-1);

// Back dua halaman
ctx.router.navigate(-2);

// Refresh halaman saat ini
ctx.router.navigate(null);
```

## Hubungan dengan ctx.route, ctx.location

| Tujuan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Navigasi** | `ctx.router.navigate(path)` |
| **Membaca path saat ini** | `ctx.route.pathname` atau `ctx.location.pathname` |
| **Membaca state yang dikirim saat navigasi** | `ctx.location.state` |
| **Membaca parameter route** | `ctx.route.params` |

`ctx.router` bertanggung jawab atas "aksi navigasi", `ctx.route` dan `ctx.location` bertanggung jawab atas "status route saat ini".

## Perhatian

- `navigate(path)` secara default akan push history record baru, user dapat kembali melalui browser back
- `replace: true` akan mengganti history record saat ini tanpa menambah, cocok untuk redirect setelah login, navigasi setelah submit berhasil, dll.
- **Tentang parameter `state`**:
  - Data yang dikirim melalui `state` tidak akan muncul di URL, cocok untuk data sensitif atau sementara
  - Pada halaman target dapat diakses melalui `ctx.location.state`
  - `state` akan disimpan di history browser, masih dapat diakses saat forward/back
  - `state` akan hilang setelah refresh halaman

## Terkait

- [ctx.route](./route.md): Informasi pencocokan route saat ini (pathname, params, dll.)
- [ctx.location](./location.md): Posisi URL saat ini (pathname, search, hash, state), `state` setelah navigasi dibaca di sini
