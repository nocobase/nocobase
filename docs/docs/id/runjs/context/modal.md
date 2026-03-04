:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/modal).
:::

# ctx.modal

API pintasan berbasis Ant Design Modal, digunakan untuk membuka kotak modal secara aktif (pesan informasi, pop-up konfirmasi, dll.) di RunJS. Fitur ini diimplementasikan oleh `ctx.viewer` / sistem tampilan.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField** | Menampilkan hasil operasi, pesan kesalahan, atau konfirmasi sekunder setelah interaksi pengguna. |
| **Alur Kerja / Peristiwa Tindakan** | Pop-up konfirmasi sebelum pengiriman; menghentikan langkah selanjutnya melalui `ctx.exit()` jika pengguna membatalkan. |
| **Aturan Keterkaitan** | Pesan pop-up untuk pengguna saat validasi gagal. |

> Catatan: `ctx.modal` tersedia di lingkungan RunJS yang memiliki konteks tampilan (seperti JSBlock di dalam halaman, alur kerja, dll.); fitur ini mungkin tidak tersedia di backend atau konteks non-UI. Disarankan untuk menggunakan *optional chaining* (`ctx.modal?.confirm?.()`) saat memanggilnya.

## Definisi Tipe

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Mengembalikan true jika pengguna mengklik OK, false jika membatalkan
};
```

`ModalConfig` konsisten dengan konfigurasi metode statis Ant Design `Modal`.

## Metode Umum

| Metode | Nilai Kembalian | Deskripsi |
|------|--------|------|
| `info(config)` | `Promise<void>` | Modal pesan informasi |
| `success(config)` | `Promise<void>` | Modal pesan sukses |
| `error(config)` | `Promise<void>` | Modal pesan kesalahan |
| `warning(config)` | `Promise<void>` | Modal pesan peringatan |
| `confirm(config)` | `Promise<boolean>` | Modal konfirmasi; mengembalikan `true` jika pengguna mengklik OK, dan `false` jika membatalkan |

## Parameter Konfigurasi

Konsisten dengan Ant Design `Modal`, bidang yang umum digunakan meliputi:

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `title` | `ReactNode` | Judul |
| `content` | `ReactNode` | Konten |
| `okText` | `string` | Teks tombol OK |
| `cancelText` | `string` | Teks tombol Batal (hanya untuk `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Dijalankan saat mengklik OK |
| `onCancel` | `() => void` | Dijalankan saat mengklik Batal |

## Hubungan dengan ctx.message dan ctx.openView

| Kegunaan | Penggunaan yang Disarankan |
|------|----------|
| **Pesan sementara yang ringan** | `ctx.message`, menghilang secara otomatis |
| **Modal Info/Sukses/Kesalahan/Peringatan** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Konfirmasi sekunder (memerlukan pilihan pengguna)** | `ctx.modal.confirm`, digunakan bersama `ctx.exit()` untuk mengontrol alur |
| **Interaksi kompleks seperti formulir atau daftar** | `ctx.openView` untuk membuka tampilan kustom (halaman/laci/modal) |

## Contoh

### Modal Informasi Sederhana

```ts
ctx.modal.info({
  title: 'Petunjuk',
  content: 'Operasi telah selesai',
});
```

### Modal Konfirmasi dan Kontrol Alur

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Konfirmasi Hapus',
  content: 'Apakah Anda yakin ingin menghapus catatan ini?',
  okText: 'Konfirmasi',
  cancelText: 'Batal',
});
if (!confirmed) {
  ctx.exit();  // Hentikan langkah selanjutnya jika pengguna membatalkan
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Modal Konfirmasi dengan onOk

```ts
await ctx.modal.confirm({
  title: 'Konfirmasi Pengiriman',
  content: 'Perubahan tidak dapat diubah setelah dikirim. Apakah Anda ingin melanjutkan?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Pesan Kesalahan

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Sukses', content: 'Operasi telah selesai' });
} catch (e) {
  ctx.modal.error({ title: 'Kesalahan', content: e.message });
}
```

## Terkait

- [ctx.message](./message.md): Pesan sementara yang ringan, menghilang secara otomatis
- [ctx.exit()](./exit.md): Umumnya digunakan sebagai `if (!confirmed) ctx.exit()` untuk menghentikan alur saat pengguna membatalkan konfirmasi
- [ctx.openView()](./open-view.md): Membuka tampilan kustom, cocok untuk interaksi yang kompleks