---
title: "ctx.exit()"
description: "Kedua pemanggilan mengakhiri langkah saat ini dan melewati flow sekuensial yang tersisa pada event yang sama. Flow yang sudah berjalan secara paralel tetap berlanjut."
keywords: "ctx.exit,keluar Flow,event flow,percabangan kondisional,RunJS,NocoBase"
---

# ctx.exit()

Menghentikan eksekusi event flow saat ini, langkah-langkah berikutnya tidak akan dijalankan. Sering digunakan saat kondisi bisnis tidak terpenuhi, pengguna membatalkan, atau terjadi error yang tidak dapat dipulihkan.

## Skenario Penggunaan

`ctx.exit()` umumnya digunakan pada konteks berikut yang dapat mengeksekusi JS:

| Skenario | Deskripsi |
|------|------|
| **Event Flow** | Pada event flow yang dipicu oleh submit form, klik tombol, dll., menghentikan langkah selanjutnya saat kondisi tidak terpenuhi |
| **Aturan Linkage** | Linkage field, linkage filter, dll., menghentikan event flow saat ini saat validasi gagal atau perlu melewati eksekusi |
| **Action Event** | Pada action kustom (seperti konfirmasi delete, validasi pre-save), keluar saat pengguna membatalkan atau validasi tidak lulus |

> `ctx.exit()` / `ctx.exitAll()` — Kedua pemanggilan mengakhiri langkah saat ini dan melewati flow sekuensial yang tersisa pada event yang sama. Flow yang sudah berjalan secara paralel tetap berlanjut.

## Definisi Tipe

```ts
exit(): never;
```

Memanggil `ctx.exit()` akan melempar `FlowExitAllException` internal, yang ditangkap oleh engine event flow untuk menghentikan eksekusi event flow saat ini. Setelah dipanggil, statement tersisa pada kode JS saat ini tidak akan dieksekusi.

## Contoh

### Keluar Saat Pengguna Membatalkan

```ts
// Pada konfirmasi popup, klik batal akan menghentikan event flow
if (!confirmed) {
  ctx.message.info('Operasi dibatalkan');
  ctx.exit();
}
```

### Keluar Saat Validasi Parameter Gagal

```ts
// Memberikan tip dan menghentikan saat validasi tidak lulus
if (!params.value || params.value.length < 3) {
  ctx.message.error('Parameter tidak valid, panjang minimal 3');
  ctx.exit();
}
```

### Keluar Saat Kondisi Bisnis Tidak Terpenuhi

```ts
// Menghentikan saat kondisi tidak terpenuhi, langkah berikutnya tidak akan dieksekusi
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Hanya status draft yang dapat di-submit' });
  ctx.exit();
}
```

### Keluar Berdasarkan Pilihan Pengguna Setelah Konfirmasi Popup

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Konfirmasi penghapusan',
  content: 'Setelah dihapus tidak dapat dipulihkan, apakah ingin melanjutkan?',
});
if (!ok) {
  ctx.message.info('Dibatalkan');
  ctx.exit();
}
```

## Hal yang Perlu Diperhatikan

- Setelah memanggil `ctx.exit()`, kode berikutnya pada JS saat ini tidak akan dieksekusi; disarankan menjelaskan alasannya kepada pengguna melalui `ctx.message`, `ctx.notification`, atau popup sebelum memanggil
- Dalam kode bisnis biasanya tidak perlu menangkap `FlowExitAllException`, biarkan engine event flow yang menanganinya

## Terkait

- [ctx.exitAll()](./exit-all.md)
- [ctx.message](./message.md): Pesan tip
- [ctx.modal](./modal.md): Popup konfirmasi
