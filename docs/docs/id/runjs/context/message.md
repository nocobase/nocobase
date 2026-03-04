:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/message).
:::

# ctx.message

API pesan global Ant Design, digunakan untuk menampilkan perintah ringan sementara di bagian tengah atas halaman. Pesan akan tertutup secara otomatis setelah waktu tertentu atau dapat ditutup secara manual oleh pengguna.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Umpan balik operasi, perintah validasi, salin berhasil, dan perintah ringan lainnya |
| **Operasi Formulir / Alur Kerja** | Umpan balik untuk keberhasilan pengiriman, kegagalan penyimpanan, kegagalan validasi, dll. |
| **Action Events (JSAction)** | Umpan balik instan untuk klik, penyelesaian operasi massal, dll. |

## Definisi Tipe

```ts
message: MessageInstance;
```

`MessageInstance` adalah antarmuka pesan Ant Design, yang menyediakan metode berikut.

## Metode Umum

| Metode | Keterangan |
|------|------|
| `success(content, duration?)` | Menampilkan pesan sukses |
| `error(content, duration?)` | Menampilkan pesan kesalahan |
| `warning(content, duration?)` | Menampilkan pesan peringatan |
| `info(content, duration?)` | Menampilkan pesan informasi |
| `loading(content, duration?)` | Menampilkan pesan pemuatan (harus ditutup secara manual) |
| `open(config)` | Membuka pesan menggunakan konfigurasi kustom |
| `destroy()` | Menutup semua pesan yang sedang ditampilkan |

**Parameter:**

- `content` (`string` | `ConfigOptions`): Konten pesan atau objek konfigurasi
- `duration` (`number`, opsional): Penundaan penutupan otomatis (detik), default 3 detik; atur ke 0 untuk menonaktifkan penutupan otomatis

**ConfigOptions** (ketika `content` berupa objek):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Konten pesan
  duration?: number;        // Penundaan penutupan otomatis (detik)
  onClose?: () => void;    // Callback saat ditutup
  icon?: React.ReactNode;  // Ikon kustom
}
```

## Contoh

### Penggunaan Dasar

```ts
ctx.message.success('Operasi berhasil');
ctx.message.error('Operasi gagal');
ctx.message.warning('Silakan pilih data terlebih dahulu');
ctx.message.info('Sedang memproses...');
```

### Internasionalisasi dengan ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Loading dan Penutupan Manual

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Menjalankan operasi asinkron
await saveData();
hide();  // Menutup loading secara manual
ctx.message.success(ctx.t('Saved'));
```

### Menggunakan open dengan Konfigurasi Kustom

```ts
ctx.message.open({
  type: 'success',
  content: 'Pesan sukses kustom',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Menutup Semua Pesan

```ts
ctx.message.destroy();
```

## Perbedaan antara ctx.message dan ctx.notification

| Fitur | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Posisi** | Tengah atas halaman | Pojok kanan atas |
| **Kegunaan** | Perintah ringan sementara, hilang otomatis | Panel notifikasi, dapat menyertakan judul dan deskripsi, cocok untuk tampilan yang lebih lama |
| **Skenario Tipikal** | Umpan balik operasi, perintah validasi, salin berhasil | Notifikasi penyelesaian tugas, pesan sistem, konten lebih panjang yang memerlukan perhatian pengguna |

## Terkait

- [ctx.notification](./notification.md) - Notifikasi pojok kanan atas, cocok untuk durasi tampilan yang lebih lama
- [ctx.modal](./modal.md) - Konfirmasi modal, interaksi pemblokiran (blocking)
- [ctx.t()](./t.md) - Internasionalisasi, sering digunakan bersama dengan message