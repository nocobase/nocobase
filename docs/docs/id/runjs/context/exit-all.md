---
title: "ctx.exitAll()"
description: "ctx.exitAll() keluar dari semua nested Flow, untuk menghentikan eksekusi sekaligus saat nested terlalu dalam."
keywords: "ctx.exitAll,keluar Flow,nested Flow,menghentikan eksekusi,RunJS,NocoBase"
---

# ctx.exitAll()

Menghentikan event flow saat ini dan semua event flow berikutnya yang dipicu pada penjadwalan event yang sama. Sering digunakan saat perlu segera menghentikan semua event flow pada event saat ini karena error global atau validasi izin.

## Skenario Penggunaan

`ctx.exitAll()` umumnya digunakan pada konteks berikut yang dapat mengeksekusi JS, dan saat **perlu menghentikan event flow saat ini dan event flow berikutnya yang dipicu oleh event tersebut secara bersamaan**:

| Skenario | Deskripsi |
|------|------|
| **Event Flow** | Validasi event flow utama gagal (seperti tidak memiliki izin), perlu menghentikan event flow utama dan event flow berikutnya yang belum dieksekusi pada event yang sama |
| **Aturan Linkage** | Saat validasi linkage tidak lulus, perlu menghentikan linkage saat ini dan linkage berikutnya yang dipicu oleh event yang sama |
| **Action Event** | Saat validasi pre-action gagal (seperti pengecekan izin sebelum delete), perlu mencegah action utama dan langkah-langkah berikutnya |

> Perbedaan dengan `ctx.exit()`: `ctx.exit()` hanya menghentikan event flow saat ini; `ctx.exitAll()` akan menghentikan event flow berikutnya yang **belum dieksekusi** pada penjadwalan event saat ini.

## Definisi Tipe

```ts
exitAll(): never;
```

Memanggil `ctx.exitAll()` akan melempar `FlowExitAllException` internal, yang ditangkap oleh engine event flow untuk menghentikan instance event flow saat ini dan event flow berikutnya pada event yang sama. Setelah dipanggil, statement tersisa pada kode JS saat ini tidak akan dieksekusi.

## Perbandingan dengan ctx.exit()

| Method | Lingkup |
|------|----------|
| `ctx.exit()` | Hanya menghentikan event flow saat ini, event flow berikutnya tidak terpengaruh |
| `ctx.exitAll()` | Menghentikan event flow saat ini, dan menghentikan **eksekusi sekuensial** event flow berikutnya pada event yang sama |

## Catatan Mode Eksekusi

- **Eksekusi sekuensial (sequential)**: event flow pada event yang sama dieksekusi secara berurutan; setelah salah satu event flow memanggil `ctx.exitAll()`, event flow berikutnya tidak akan dieksekusi lagi
- **Eksekusi paralel (parallel)**: event flow pada event yang sama dieksekusi secara paralel; ketika satu event flow memanggil `ctx.exitAll()` tidak akan menginterupsi event flow lain yang sudah berjalan paralel (masing-masing independen)

## Contoh

### Menghentikan Semua Event Flow Saat Validasi Izin Gagal

```ts
// Saat tidak memiliki izin, menghentikan event flow utama dan event flow berikutnya
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Tidak memiliki izin operasi' });
  ctx.exitAll();
}
```

### Menghentikan Saat Validasi Pre-Global Tidak Lulus

```ts
// Contoh: sebelum delete ditemukan data terkait tidak dapat dihapus, perlu mencegah event flow utama dan operasi berikutnya
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Terdapat data terkait, tidak dapat dihapus');
  ctx.exitAll();
}
```

### Pemilihan dengan ctx.exit()

```ts
// Hanya event flow saat ini perlu keluar → gunakan ctx.exit()
if (!params.valid) {
  ctx.message.error('Parameter tidak valid');
  ctx.exit();  // Event flow berikutnya tidak terpengaruh
}

// Perlu menghentikan semua event flow berikutnya pada event saat ini → gunakan ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Tidak memiliki izin' });
  ctx.exitAll();  // Event flow utama dan event flow berikutnya pada event yang sama berhenti bersama
}
```

### Memberikan Tip Sebelum Menghentikan

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Silakan perbaiki kesalahan dalam form terlebih dahulu');
  ctx.exitAll();
}
```

## Hal yang Perlu Diperhatikan

- Setelah memanggil `ctx.exitAll()`, kode berikutnya pada JS saat ini tidak akan dieksekusi; disarankan menjelaskan alasannya kepada pengguna melalui `ctx.message`, `ctx.notification`, atau popup sebelum memanggil
- Dalam kode bisnis biasanya tidak perlu menangkap `FlowExitAllException`, biarkan engine event flow yang menanganinya
- Jika hanya perlu menghentikan event flow saat ini tanpa mempengaruhi event flow berikutnya, gunakan `ctx.exit()`
- Pada mode paralel, `ctx.exitAll()` hanya menghentikan event flow saat ini, tidak menginterupsi event flow lain yang sudah berjalan paralel

## Terkait

- [ctx.exit()](./exit.md): Hanya menghentikan event flow saat ini
- [ctx.message](./message.md): Pesan tip
- [ctx.modal](./modal.md): Popup konfirmasi
