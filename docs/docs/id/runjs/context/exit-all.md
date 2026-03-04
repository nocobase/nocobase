:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/exit-all).
:::

# ctx.exitAll()

Menghentikan alur event saat ini dan semua alur event berikutnya yang dipicu dalam pengiriman event yang sama. Metode ini umumnya digunakan ketika semua alur event di bawah event saat ini perlu segera dihentikan karena kesalahan global atau kegagalan validasi izin.

## Skenario Penggunaan

`ctx.exitAll()` umumnya digunakan dalam konteks JS yang dapat dieksekusi, di mana diperlukan untuk **menghentikan alur event saat ini dan alur event berikutnya yang dipicu oleh event tersebut secara bersamaan**:

| Skenario | Keterangan |
|------|------|
| **Alur Event** | Validasi alur event utama gagal (misalnya, izin tidak mencukupi), sehingga perlu menghentikan alur utama dan alur berikutnya yang belum dieksekusi dalam event yang sama. |
| **Aturan Linkage** | Ketika validasi linkage tidak lulus, linkage saat ini dan linkage berikutnya yang dipicu oleh event yang sama harus dihentikan. |
| **Event Tindakan** | Validasi pra-tindakan gagal (misalnya, pemeriksaan izin sebelum penghapusan), sehingga perlu mencegah tindakan utama dan langkah-langkah selanjutnya. |

> Perbedaan dengan `ctx.exit()`: `ctx.exit()` hanya menghentikan alur event saat ini; `ctx.exitAll()` menghentikan alur event saat ini dan alur event berikutnya yang **belum dieksekusi** dalam pengiriman event yang sama.

## Definisi Tipe

```ts
exitAll(): never;
```

Memanggil `ctx.exitAll()` akan melempar `FlowExitAllException` internal, yang ditangkap oleh FlowEngine untuk menghentikan instans alur event saat ini dan alur event berikutnya di bawah event yang sama. Setelah dipanggil, pernyataan yang tersisa dalam kode JS saat ini tidak akan dieksekusi.

## Perbandingan dengan ctx.exit()

| Metode | Cakupan |
|------|----------|
| `ctx.exit()` | Hanya menghentikan alur event saat ini; alur event berikutnya tidak terpengaruh. |
| `ctx.exitAll()` | Menghentikan alur event saat ini dan membatalkan alur event berikutnya yang dijalankan secara **berurutan (sequential)** di bawah event yang sama. |

## Penjelasan Mode Eksekusi

- **Eksekusi Berurutan (sequential)**: Alur event di bawah event yang sama dieksekusi sesuai urutan. Setelah salah satu alur event memanggil `ctx.exitAll()`, alur event berikutnya tidak akan dijalankan.
- **Eksekusi Paralel (parallel)**: Alur event di bawah event yang sama dieksekusi secara paralel. Memanggil `ctx.exitAll()` dalam satu alur event tidak akan menghentikan alur event konkuren lainnya (karena masing-masing bersifat independen).

## Contoh

### Menghentikan semua alur event saat validasi izin gagal

```ts
// Hentikan alur event utama dan alur event berikutnya jika izin tidak mencukupi
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Tidak ada izin operasi' });
  ctx.exitAll();
}
```

### Menghentikan saat validasi pra-kondisi global tidak lulus

```ts
// Contoh: Jika data terkait ditemukan tidak dapat dihapus sebelum proses penghapusan, cegah alur event utama dan tindakan selanjutnya
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Tidak dapat menghapus: terdapat data terkait');
  ctx.exitAll();
}
```

### Pemilihan antara ctx.exit() dan ctx.exitAll()

```ts
// Hanya alur event saat ini yang perlu keluar -> Gunakan ctx.exit()
if (!params.valid) {
  ctx.message.error('Parameter tidak valid');
  ctx.exit();  // Alur event berikutnya tidak terpengaruh
}

// Perlu menghentikan semua alur event berikutnya di bawah event saat ini -> Gunakan ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Izin tidak mencukupi' });
  ctx.exitAll();  // Alur event utama dan alur event berikutnya dalam event yang sama akan dihentikan
}
```

### Memberikan peringatan sebelum menghentikan

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Silakan perbaiki kesalahan dalam formulir terlebih dahulu');
  ctx.exitAll();
}
```

## Catatan

- Setelah memanggil `ctx.exitAll()`, kode selanjutnya dalam JS saat ini tidak akan dieksekusi. Disarankan untuk menjelaskan alasannya kepada pengguna melalui `ctx.message`, `ctx.notification`, atau modal sebelum memanggilnya.
- Kode bisnis biasanya tidak perlu menangkap `FlowExitAllException`; biarkan FlowEngine yang menanganinya.
- Jika Anda hanya perlu menghentikan alur event saat ini tanpa memengaruhi alur berikutnya, gunakan `ctx.exit()`.
- Dalam mode paralel, `ctx.exitAll()` hanya menghentikan alur event saat ini dan tidak menghentikan alur event konkuren lainnya.

## Terkait

- [ctx.exit()](./exit.md): Hanya menghentikan alur event saat ini
- [ctx.message](./message.md): Pesan petunjuk
- [ctx.modal](./modal.md): Modal konfirmasi