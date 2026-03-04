:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/notification).
:::

# ctx.notification

Berdasarkan Ant Design Notification, API notifikasi global ini digunakan untuk menampilkan panel notifikasi di **sudut kanan atas** halaman. Dibandingkan dengan `ctx.message`, notifikasi dapat menyertakan judul dan deskripsi, sehingga cocok untuk konten yang perlu ditampilkan dalam jangka waktu lebih lama atau memerlukan perhatian pengguna.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / Peristiwa Tindakan** | Notifikasi penyelesaian tugas, hasil operasi batch, penyelesaian ekspor, dll. |
| **Alur Kerja (FlowEngine)** | Peringatan tingkat sistem setelah proses asinkron berakhir. |
| **Konten yang memerlukan tampilan lebih lama** | Notifikasi lengkap dengan judul, deskripsi, dan tombol tindakan. |

## Definisi Tipe

```ts
notification: NotificationInstance;
```

`NotificationInstance` adalah antarmuka notifikasi Ant Design yang menyediakan metode berikut.

## Metode Umum

| Metode | Deskripsi |
|------|------|
| `open(config)` | Membuka notifikasi dengan konfigurasi kustom |
| `success(config)` | Menampilkan notifikasi tipe sukses |
| `info(config)` | Menampilkan notifikasi tipe informasi |
| `warning(config)` | Menampilkan notifikasi tipe peringatan |
| `error(config)` | Menampilkan notifikasi tipe kesalahan |
| `destroy(key?)` | Menutup notifikasi dengan `key` tertentu; jika tidak ada `key` yang diberikan, semua notifikasi akan ditutup |

**Parameter Konfigurasi** (Sesuai dengan [Ant Design notification](https://ant.design/components/notification)):

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `message` | `ReactNode` | Judul notifikasi |
| `description` | `ReactNode` | Deskripsi notifikasi |
| `duration` | `number` | Penundaan penutupan otomatis (detik). Default adalah 4,5 detik; atur ke 0 untuk menonaktifkan penutupan otomatis |
| `key` | `string` | Identifikasi unik notifikasi, digunakan untuk `destroy(key)` guna menutup notifikasi tertentu |
| `onClose` | `() => void` | Fungsi callback yang dipicu saat notifikasi ditutup |
| `placement` | `string` | Posisi: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Contoh

### Penggunaan Dasar

```ts
ctx.notification.open({
  message: 'Operasi berhasil',
  description: 'Data telah disimpan ke server.',
});
```

### Panggilan Cepat Berdasarkan Tipe

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Durasi dan Key Kustom

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Tidak menutup otomatis
});

// Tutup secara manual setelah tugas selesai
ctx.notification.destroy('task-123');
```

### Menutup Semua Notifikasi

```ts
ctx.notification.destroy();
```

## Perbedaan dengan ctx.message

| Fitur | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Posisi** | Tengah atas halaman | Sudut kanan atas (dapat dikonfigurasi) |
| **Struktur** | Petunjuk ringan satu baris | Menyertakan judul + deskripsi |
| **Kegunaan** | Umpan balik sementara, menghilang otomatis | Notifikasi lengkap, dapat ditampilkan dalam waktu lama |
| **Skenario Khas** | Operasi berhasil, kegagalan validasi, penyalinan berhasil | Penyelesaian tugas, pesan sistem, konten panjang yang memerlukan perhatian pengguna |

## Terkait

- [ctx.message](./message.md) - Petunjuk ringan di bagian atas, cocok untuk umpan balik cepat
- [ctx.modal](./modal.md) - Konfirmasi modal, interaksi pemblokiran
- [ctx.t()](./t.md) - Internasionalisasi, sering digunakan bersama dengan notifikasi