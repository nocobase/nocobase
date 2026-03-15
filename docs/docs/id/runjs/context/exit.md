:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/exit).
:::

# ctx.exit()

Menghentikan eksekusi alur peristiwa (event flow) saat ini; langkah-langkah selanjutnya tidak akan dijalankan. Ini umum digunakan ketika kondisi bisnis tidak terpenuhi, pengguna membatalkan, atau terjadi kesalahan yang tidak dapat dipulihkan.

## Skenario Penggunaan

`ctx.exit()` umumnya digunakan dalam konteks berikut di mana JS dapat dieksekusi:

| Skenario | Keterangan |
|------|------|
| **Alur Peristiwa** | Dalam alur peristiwa yang dipicu oleh pengiriman formulir, klik tombol, dll., menghentikan langkah selanjutnya ketika kondisi tidak terpenuhi. |
| **Aturan Penautan** | Dalam penautan bidang (field linkage), penautan filter, dll., menghentikan alur peristiwa saat ini ketika validasi gagal atau eksekusi perlu dilewati. |
| **Peristiwa Tindakan** | Dalam tindakan kustom (misalnya, konfirmasi penghapusan, validasi sebelum penyimpanan), keluar saat pengguna membatalkan atau validasi tidak lulus. |

> Perbedaan dengan `ctx.exitAll()`: `ctx.exit()` hanya menghentikan alur peristiwa saat ini; alur peristiwa lain di bawah peristiwa yang sama tidak terpengaruh. `ctx.exitAll()` menghentikan alur peristiwa saat ini serta alur peristiwa berikutnya di bawah peristiwa yang sama yang belum dieksekusi.

## Definisi Tipe

```ts
exit(): never;
```

Memanggil `ctx.exit()` akan melempar `FlowExitException` internal, yang ditangkap oleh mesin alur peristiwa (FlowEngine) untuk menghentikan eksekusi alur peristiwa saat ini. Setelah dipanggil, pernyataan yang tersisa dalam kode JS saat ini tidak akan dieksekusi.

## Perbandingan dengan ctx.exitAll()

| Metode | Cakupan Efek |
|------|----------|
| `ctx.exit()` | Hanya menghentikan alur peristiwa saat ini; alur peristiwa berikutnya tidak terpengaruh. |
| `ctx.exitAll()` | Menghentikan alur peristiwa saat ini dan membatalkan alur peristiwa berikutnya di bawah peristiwa yang sama yang diatur untuk **dieksekusi secara berurutan**. |

## Contoh

### Keluar saat Pengguna Membatalkan

```ts
// Dalam modal konfirmasi, hentikan alur peristiwa jika pengguna mengklik batal
if (!confirmed) {
  ctx.message.info('Operasi dibatalkan');
  ctx.exit();
}
```

### Keluar saat Validasi Parameter Gagal

```ts
// Berikan pesan dan hentikan saat validasi gagal
if (!params.value || params.value.length < 3) {
  ctx.message.error('Parameter tidak valid, panjang minimal harus 3');
  ctx.exit();
}
```

### Keluar saat Kondisi Bisnis Tidak Terpenuhi

```ts
// Hentikan jika kondisi tidak terpenuhi; langkah selanjutnya tidak akan dijalankan
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Hanya draf yang dapat dikirimkan' });
  ctx.exit();
}
```

### Memilih antara ctx.exit() dan ctx.exitAll()

```ts
// Hanya alur peristiwa saat ini yang perlu keluar → Gunakan ctx.exit()
if (!params.valid) {
  ctx.message.error('Parameter tidak valid');
  ctx.exit();  // Alur peristiwa lainnya tidak terpengaruh
}

// Perlu menghentikan semua alur peristiwa berikutnya di bawah peristiwa saat ini → Gunakan ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Izin tidak cukup' });
  ctx.exitAll();  // Alur peristiwa saat ini dan alur peristiwa berikutnya di bawah peristiwa yang sama akan dihentikan
}
```

### Keluar Berdasarkan Pilihan Pengguna Setelah Konfirmasi Modal

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Konfirmasi Hapus',
  content: 'Tindakan ini tidak dapat dibatalkan. Apakah Anda ingin melanjutkan?',
});
if (!ok) {
  ctx.message.info('Dibatalkan');
  ctx.exit();
}
```

## Catatan

- Setelah memanggil `ctx.exit()`, kode selanjutnya dalam JS saat ini tidak akan dieksekusi; disarankan untuk menjelaskan alasannya kepada pengguna melalui `ctx.message`, `ctx.notification`, atau modal sebelum memanggilnya.
- Biasanya tidak perlu menangkap `FlowExitException` dalam kode bisnis; biarkan mesin alur peristiwa menanganinya.
- Jika Anda perlu menghentikan semua alur peristiwa berikutnya di bawah peristiwa saat ini, gunakan `ctx.exitAll()`.

## Terkait

- [ctx.exitAll()](./exit-all.md): Menghentikan alur peristiwa saat ini dan alur peristiwa berikutnya di bawah peristiwa yang sama.
- [ctx.message](./message.md): Pesan petunjuk.
- [ctx.modal](./modal.md): Modal konfirmasi.