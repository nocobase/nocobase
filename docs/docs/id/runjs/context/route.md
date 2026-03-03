:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/route).
:::

# ctx.route

Informasi pencocokan rute saat ini, sesuai dengan konsep `route` pada React Router, digunakan untuk mendapatkan konfigurasi rute yang cocok, parameter, dan lainnya. Biasanya digunakan bersama dengan `ctx.router` dan `ctx.location`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField** | Melakukan perenderan kondisional atau menampilkan pengidentifikasi halaman saat ini berdasarkan `route.pathname` atau `route.params`. |
| **Aturan Kaitan / Alur Peristiwa** | Membaca parameter rute (seperti `params.name`) untuk percabangan logika atau meneruskannya ke komponen anak. |
| **Navigasi Tampilan** | Membandingkan `ctx.route.pathname` dengan jalur target secara internal untuk menentukan apakah akan memicu `ctx.router.navigate`. |

> Catatan: `ctx.route` hanya tersedia di lingkungan RunJS yang memiliki konteks perutean (seperti JSBlock di dalam halaman, halaman alur kerja, dll.); dalam konteks murni backend atau tanpa perutean (seperti alur kerja latar belakang), nilainya mungkin kosong.

## Definisi Tipe

```ts
type RouteOptions = {
  name?: string;   // Pengidentifikasi unik rute
  path?: string;   // Templat rute (misalnya /admin/:name)
  params?: Record<string, any>;  // Parameter rute (misalnya { name: 'users' })
  pathname?: string;  // Jalur lengkap rute saat ini (misalnya /admin/users)
};
```

## Field Umum

| Field | Tipe | Deskripsi |
|------|------|------|
| `pathname` | `string` | Jalur lengkap rute saat ini, konsisten dengan `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Parameter dinamis yang diurai dari templat rute, seperti `{ name: 'users' }`. |
| `path` | `string` | Templat rute, seperti `/admin/:name`. |
| `name` | `string` | Pengidentifikasi unik rute, sering digunakan dalam skenario multi-tab atau multi-tampilan. |

## Hubungan dengan ctx.router dan ctx.location

| Kegunaan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Membaca jalur saat ini** | `ctx.route.pathname` atau `ctx.location.pathname`; keduanya konsisten saat pencocokan. |
| **Membaca parameter rute** | `ctx.route.params`, misalnya `params.name` mewakili UID halaman saat ini. |
| **Navigasi** | `ctx.router.navigate(path)` |
| **Membaca parameter kueri, state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` berfokus pada "konfigurasi rute yang cocok", sedangkan `ctx.location` berfokus pada "lokasi URL saat ini". Keduanya bekerja sama untuk memberikan deskripsi lengkap tentang status perutean saat ini.

## Contoh

### Membaca pathname

```ts
// Menampilkan jalur saat ini
ctx.message.info('Halaman saat ini: ' + ctx.route.pathname);
```

### Percabangan berdasarkan params

```ts
// params.name biasanya merupakan UID halaman saat ini (seperti pengidentifikasi halaman alur kerja)
if (ctx.route.params?.name === 'users') {
  // Menjalankan logika spesifik pada halaman manajemen pengguna
}
```

### Menampilkan di halaman alur kerja

```tsx
<div>
  <h1>Halaman saat ini - {ctx.route.pathname}</h1>
  <p>Pengidentifikasi Rute: {ctx.route.params?.name}</p>
</div>
```

## Terkait

- [ctx.router](./router.md): Navigasi rute. Setelah `ctx.router.navigate()` mengubah jalur, `ctx.route` akan diperbarui secara otomatis.
- [ctx.location](./location.md): Lokasi URL saat ini (pathname, search, hash, state), digunakan bersama dengan `ctx.route`.