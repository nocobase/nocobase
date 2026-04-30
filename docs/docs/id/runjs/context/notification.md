---
title: "ctx.notification"
description: "ctx.notification adalah API notifikasi, untuk pengingat notifikasi kanan atas, mendukung konfigurasi seperti duration, placement."
keywords: "ctx.notification,notifikasi,pengingat,duration,placement,RunJS,NocoBase"
---

# ctx.notification

API notifikasi global berbasis Ant Design Notification, untuk menampilkan panel notifikasi di **kanan atas** halaman. Dibandingkan dengan `ctx.message`, notifikasi dapat dengan judul dan deskripsi, cocok untuk konten yang ditampilkan lebih lama dan perlu mendapat perhatian pengguna.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / Action Event** | Notifikasi task selesai, hasil batch operation, export selesai, dll. |
| **Event Flow** | Pengingat tingkat sistem setelah flow async selesai |
| **Konten yang Perlu Tampilan Lebih Lama** | Notifikasi lengkap dengan judul, deskripsi, tombol aksi |

## Definisi Tipe

```ts
notification: NotificationInstance;
```

`NotificationInstance` adalah interface notification Ant Design, menyediakan method berikut.

## Method Umum

| Method | Deskripsi |
|------|------|
| `open(config)` | Membuka notifikasi dengan konfigurasi kustom |
| `success(config)` | Menampilkan notifikasi tipe sukses |
| `info(config)` | Menampilkan notifikasi tipe informasi |
| `warning(config)` | Menampilkan notifikasi tipe peringatan |
| `error(config)` | Menampilkan notifikasi tipe error |
| `destroy(key?)` | Menutup notifikasi dengan key tertentu, jika tidak meneruskan key akan menutup semua |

**Parameter konfigurasi** (sama dengan [Ant Design notification](https://ant.design/components/notification-cn)):

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `message` | `ReactNode` | Judul notifikasi |
| `description` | `ReactNode` | Deskripsi notifikasi |
| `duration` | `number` | Delay penutupan otomatis (detik), default 4.5 detik; setel ke 0 berarti tidak otomatis tutup |
| `key` | `string` | Identifier unik notifikasi, untuk menutup notifikasi tertentu dengan `destroy(key)` |
| `onClose` | `() => void` | Callback penutupan |
| `placement` | `string` | Posisi: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Contoh

### Penggunaan Dasar

```ts
ctx.notification.open({
  message: 'Operasi berhasil',
  description: 'Data sudah tersimpan ke server.',
});
```

### Pemanggilan Cepat Berdasarkan Tipe

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
  duration: 0,  // Tidak otomatis tutup
});

// Tutup manual setelah task selesai
ctx.notification.destroy('task-123');
```

### Tutup Semua Notifikasi

```ts
ctx.notification.destroy();
```

## Perbedaan dengan ctx.message

| Karakteristik | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Posisi** | Tengah atas halaman | Kanan atas (dapat dikonfigurasi) |
| **Struktur** | Tip ringan satu baris | Dapat dengan judul + deskripsi |
| **Kegunaan** | Feedback sementara, otomatis hilang | Notifikasi yang lebih lengkap, dapat ditampilkan lama |
| **Skenario Khas** | Operasi sukses, validasi gagal, copy berhasil | Task selesai, pesan sistem, konten yang lebih panjang yang perlu mendapat perhatian pengguna |

## Terkait

- [ctx.message](./message.md) - Tip ringan atas, cocok untuk feedback cepat
- [ctx.modal](./modal.md) - Konfirmasi popup, interaksi blocking
- [ctx.t()](./t.md) - Internasionalisasi, sering digunakan dengan notification
