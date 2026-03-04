:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/router).
:::

# ctx.router

Instans router berbasis React Router, digunakan untuk navigasi melalui kode di dalam RunJS. Biasanya digunakan bersama dengan `ctx.route` dan `ctx.location`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField** | Berpindah ke halaman detail, halaman daftar, atau tautan eksternal setelah tombol diklik. |
| **Aturan Linkage / Aliran Peristiwa** | Menjalankan `navigate` ke daftar atau detail setelah pengiriman berhasil, atau meneruskan `state` ke halaman tujuan. |
| **JSAction / Penanganan Peristiwa** | Menjalankan navigasi rute di dalam logika seperti pengiriman formulir atau klik tautan. |
| **Navigasi Tampilan** | Memperbarui URL melalui `navigate` saat perpindahan tumpukan tampilan internal. |

> Catatan: `ctx.router` hanya tersedia di lingkungan RunJS yang memiliki konteks perutean (misalnya, JSBlock di dalam halaman, halaman Flow, aliran peristiwa, dll.); instans ini mungkin bernilai null dalam konteks murni backend atau tanpa perutean (misalnya, alur kerja).

## Definisi Tipe

```typescript
router: Router
```

`Router` berasal dari `@remix-run/router`. Di dalam RunJS, operasi navigasi seperti berpindah halaman, kembali, dan menyegarkan halaman diimplementasikan melalui `ctx.router.navigate()`.

## Metode

### ctx.router.navigate()

Berpindah ke jalur tujuan, atau menjalankan aksi kembali/segarkan.

**Tanda Tangan (Signature):**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parameter:**

- `to`: Jalur tujuan (string), posisi riwayat relatif (number, misal: `-1` untuk kembali), atau `null` (untuk menyegarkan halaman saat ini).
- `options`: Konfigurasi opsional.
  - `replace?: boolean`: Apakah akan mengganti entri riwayat saat ini (default adalah `false`, yang berarti menambahkan entri baru/push).
  - `state?: any`: State yang akan diteruskan ke rute tujuan. Data ini tidak muncul di URL dan dapat diakses melalui `ctx.location.state` di halaman tujuan. Cocok untuk informasi sensitif, data sementara, atau informasi yang tidak seharusnya diletakkan di URL.

## Contoh

### Navigasi Dasar

```ts
// Berpindah ke daftar pengguna (menambahkan riwayat baru, bisa kembali)
ctx.router.navigate('/admin/users');

// Berpindah ke halaman detail
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Mengganti Riwayat (Tanpa entri baru)

```ts
// Pengalihan ke beranda setelah login; pengguna tidak akan kembali ke halaman login saat menekan tombol kembali
ctx.router.navigate('/admin', { replace: true });

// Mengganti halaman saat ini dengan halaman detail setelah pengiriman formulir berhasil
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Meneruskan state

```ts
// Membawa data saat navigasi; halaman tujuan mengambilnya melalui ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Kembali dan Segarkan

```ts
// Kembali satu halaman
ctx.router.navigate(-1);

// Kembali dua halaman
ctx.router.navigate(-2);

// Menyegarkan halaman saat ini
ctx.router.navigate(null);
```

## Hubungan dengan ctx.route dan ctx.location

| Kegunaan | Penggunaan yang Disarankan |
|------|----------|
| **Navigasi/Perpindahan** | `ctx.router.navigate(path)` |
| **Membaca jalur saat ini** | `ctx.route.pathname` atau `ctx.location.pathname` |
| **Membaca state yang dikirim saat navigasi** | `ctx.location.state` |
| **Membaca parameter rute** | `ctx.route.params` |

`ctx.router` bertanggung jawab atas "tindakan navigasi", sedangkan `ctx.route` dan `ctx.location` bertanggung jawab atas "status rute saat ini".

## Catatan

- `navigate(path)` secara default akan menambahkan (push) entri riwayat baru, memungkinkan pengguna untuk kembali melalui tombol kembali pada peramban.
- `replace: true` akan mengganti entri riwayat saat ini tanpa menambah yang baru, cocok untuk skenario seperti pengalihan setelah login atau navigasi setelah pengiriman berhasil.
- **Mengenai parameter `state`**:
  - Data yang dikirim melalui `state` tidak muncul di URL, sehingga cocok untuk data sensitif atau sementara.
  - Data tersebut dapat diakses melalui `ctx.location.state` di halaman tujuan.
  - `state` disimpan dalam riwayat peramban dan tetap dapat diakses selama navigasi maju/mundur.
  - `state` akan hilang setelah penyegaran halaman secara penuh (hard refresh).

## Terkait

- [ctx.route](./route.md): Informasi pencocokan rute saat ini (pathname, params, dll.).
- [ctx.location](./location.md): Lokasi URL saat ini (pathname, search, hash, state); `state` dibaca di sini setelah navigasi.