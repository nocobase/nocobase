:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/location).
:::

# ctx.location

Informasi lokasi rute saat ini, setara dengan objek `location` pada React Router. Biasanya digunakan bersama dengan `ctx.router` dan `ctx.route` untuk membaca path saat ini, query string, hash, serta state yang dikirimkan melalui rute.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSBlock / JSField** | Melakukan rendering kondisional atau percabangan logika berdasarkan path saat ini, parameter query, atau hash. |
| **Aturan Hubungan / Alur Peristiwa** | Membaca parameter query URL untuk pemfilteran hubungan, atau menentukan sumber berdasarkan `location.state`. |
| **Pemrosesan setelah navigasi rute** | Menerima data yang dikirim dari halaman sebelumnya melalui `ctx.router.navigate` menggunakan `ctx.location.state` pada halaman tujuan. |

> Catatan: `ctx.location` hanya tersedia di lingkungan RunJS yang memiliki konteks rute (seperti JSBlock di dalam halaman, alur peristiwa, dll.); objek ini mungkin bernilai null di backend murni atau konteks tanpa rute (seperti alur kerja).

## Definisi Tipe

```ts
location: Location;
```

`Location` berasal dari `react-router-dom`, sesuai dengan nilai kembalian dari `useLocation()` pada React Router.

## Field Umum

| Field | Tipe | Keterangan |
|------|------|------|
| `pathname` | `string` | Path saat ini, diawali dengan `/` (misalnya `/admin/users`). |
| `search` | `string` | Query string, diawali dengan `?` (misalnya `?page=1&status=active`). |
| `hash` | `string` | Fragmen hash, diawali dengan `#` (misalnya `#section-1`). |
| `state` | `any` | Data arbitrer yang dikirim melalui `ctx.router.navigate(path, { state })`, tidak ditampilkan di URL. |
| `key` | `string` | Pengidentifikasi unik untuk lokasi ini; halaman awal adalah `"default"`. |

## Hubungan dengan ctx.router dan ctx.urlSearchParams

| Kegunaan | Penggunaan yang Disarankan |
|------|----------|
| **Membaca path, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Membaca parameter query (dalam bentuk objek)** | `ctx.urlSearchParams`, yang menyediakan objek hasil penguraian secara langsung. |
| **Mengurai string search** | `new URLSearchParams(ctx.location.search)` atau gunakan `ctx.urlSearchParams` secara langsung. |

`ctx.urlSearchParams` diurai dari `ctx.location.search`. Jika Anda hanya membutuhkan parameter query, menggunakan `ctx.urlSearchParams` akan lebih praktis.

## Contoh

### Percabangan Berdasarkan Path

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Saat ini berada di halaman manajemen pengguna');
}
```

### Mengurai Parameter Query

```ts
// Metode 1: Menggunakan ctx.urlSearchParams (Disarankan)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Metode 2: Menggunakan URLSearchParams untuk mengurai search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Menerima State yang Dikirim Melalui Navigasi Rute

```ts
// Saat navigasi dari halaman sebelumnya: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Navigasi datang dari dashboard');
}
```

### Menentukan Posisi Jangkar Berdasarkan Hash

```ts
const hash = ctx.location.hash; // misal, "#edit"
if (hash === '#edit') {
  // Gulir ke area edit atau jalankan logika yang sesuai
}
```

## Terkait

- [ctx.router](./router.md): Navigasi rute; `state` dari `ctx.router.navigate` dapat diambil melalui `ctx.location.state` pada halaman tujuan.
- [ctx.route](./route.md): Informasi pencocokan rute saat ini (parameter, konfigurasi, dll.), biasanya digunakan bersama dengan `ctx.location`.