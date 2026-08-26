---
title: "ctx.exit()"
description: "ctx.exit() keluar dari Flow atau event flow saat ini, dapat membawa nilai return, untuk percabangan kondisional, mengakhiri lebih awal."
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

> Perbedaan dengan `ctx.exitAll()`: `ctx.exit()` hanya menghentikan event flow saat ini, event flow lain pada event yang sama tidak terpengaruh; `ctx.exitAll()` akan menghentikan event flow saat ini dan event flow berikutnya pada event yang sama yang belum dieksekusi.

## Definisi Tipe

```ts
exit(): never;
```

Memanggil `ctx.exit()` akan melempar `FlowExitException` internal, yang ditangkap oleh engine event flow untuk menghentikan eksekusi event flow saat ini. Setelah dipanggil, statement tersisa pada kode JS saat ini tidak akan dieksekusi.

## Perbandingan dengan ctx.exitAll()

| Method | Lingkup |
|------|----------|
| `ctx.exit()` | Hanya menghentikan event flow saat ini, event flow berikutnya tidak terpengaruh |
| `ctx.exitAll()` | Menghentikan event flow saat ini, dan menghentikan **eksekusi sekuensial** event flow berikutnya pada event yang sama |

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

### Pemilihan dengan ctx.exitAll()

```ts
// Hanya event flow saat ini perlu keluar → gunakan ctx.exit()
if (!params.valid) {
  ctx.message.error('Parameter tidak valid');
  ctx.exit();  // Event flow lain tidak terpengaruh
}

// Perlu menghentikan semua event flow berikutnya pada event saat ini → gunakan ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Tidak memiliki izin' });
  ctx.exitAll();  // Event flow utama dan event flow berikutnya pada event yang sama berhenti bersama
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
- Dalam kode bisnis biasanya tidak perlu menangkap `FlowExitException`, biarkan engine event flow yang menanganinya
- Jika perlu menghentikan semua event flow berikutnya pada event saat ini, gunakan `ctx.exitAll()`

## Terkait

- [ctx.exitAll()](./exit-all.md): Menghentikan event flow saat ini dan event flow berikutnya pada event yang sama
- [ctx.message](./message.md): Pesan tip
- [ctx.modal](./modal.md): Popup konfirmasi
