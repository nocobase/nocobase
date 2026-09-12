---
title: "ctx.message"
description: "ctx.message adalah API pesan tip, untuk tip ringan seperti success, error, warning, info."
keywords: "ctx.message,pesan tip,success,error,warning,info,RunJS,NocoBase"
---

# ctx.message

API global message Ant Design, untuk menampilkan tip ringan sementara di tengah atas halaman. Pesan akan otomatis tertutup setelah waktu tertentu, atau dapat ditutup manual oleh pengguna.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Feedback operasi, tip validasi, copy berhasil, dan tip ringan lainnya |
| **Action Form / Event Flow** | Submit berhasil, save gagal, validasi tidak lulus, dan feedback lainnya |
| **Action Event (JSAction)** | Klik, batch operation selesai, dan feedback instan lainnya |

## Definisi Tipe

```ts
message: MessageInstance;
```

`MessageInstance` adalah interface message Ant Design, menyediakan method berikut.

## Method Umum

| Method | Deskripsi |
|------|------|
| `success(content, duration?)` | Menampilkan tip sukses |
| `error(content, duration?)` | Menampilkan tip error |
| `warning(content, duration?)` | Menampilkan tip peringatan |
| `info(content, duration?)` | Menampilkan tip informasi |
| `loading(content, duration?)` | Menampilkan tip loading (perlu ditutup manual) |
| `open(config)` | Membuka pesan dengan konfigurasi kustom |
| `destroy()` | Menutup semua pesan yang ditampilkan |

**Parameter:**

- `content` (`string` \| `ConfigOptions`): konten pesan atau objek konfigurasi
- `duration` (`number`, opsional): delay penutupan otomatis (detik), default 3 detik; setel ke 0 berarti tidak otomatis tutup

**ConfigOptions** (saat `content` adalah objek):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Konten pesan
  duration?: number;        // Delay penutupan otomatis (detik)
  onClose?: () => void;    // Callback penutupan
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

### Bersama dengan ctx.t untuk Internasionalisasi

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### loading dan Tutup Manual

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Eksekusi operasi async
await saveData();
hide();  // Tutup loading manual
ctx.message.success(ctx.t('Saved'));
```

### Menggunakan open dengan Konfigurasi Kustom

```ts
ctx.message.open({
  type: 'success',
  content: 'Tip sukses kustom',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Tutup Semua Pesan

```ts
ctx.message.destroy();
```

## Perbedaan dengan ctx.notification

| Karakteristik | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Posisi** | Tengah atas halaman | Kanan atas |
| **Kegunaan** | Tip ringan sementara, otomatis hilang | Panel notifikasi, dapat dengan judul dan deskripsi, cocok untuk tampilan waktu yang lebih lama |
| **Skenario Khas** | Feedback operasi, tip validasi, copy berhasil | Notifikasi task selesai, pesan sistem, konten yang lebih panjang yang perlu mendapat perhatian pengguna |

## Terkait

- [ctx.notification](./notification.md) - Notifikasi kanan atas, cocok untuk tampilan waktu yang lebih lama
- [ctx.modal](./modal.md) - Konfirmasi popup, interaksi blocking
- [ctx.t()](./t.md) - Internasionalisasi, sering digunakan dengan message
