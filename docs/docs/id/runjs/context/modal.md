---
title: "ctx.modal"
description: "ctx.modal adalah API kontrol popup, untuk membuka kotak konfirmasi, tip informasi, popup kustom."
keywords: "ctx.modal,popup,kotak konfirmasi,confirm,tip informasi,RunJS,NocoBase"
---

# ctx.modal

API cepat berbasis Ant Design Modal, untuk secara aktif membuka modal di RunJS (tip informasi, popup konfirmasi, dll.). Disediakan oleh `ctx.viewer` / sistem view.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField** | Setelah interaksi pengguna menampilkan hasil operasi, tip error, atau konfirmasi sekunder |
| **Event Flow / Action Event** | Konfirmasi popup sebelum submit, menghentikan langkah selanjutnya melalui `ctx.exit()` saat pengguna membatalkan |
| **Aturan Linkage** | Popup tip ke pengguna saat validasi gagal |

> Perhatian: `ctx.modal` tersedia pada environment RunJS yang memiliki konteks view (seperti JSBlock dalam halaman, event flow, dll.); pada backend atau konteks tanpa UI mungkin tidak ada, disarankan melakukan optional chaining saat digunakan (`ctx.modal?.confirm?.()`).

## Definisi Tipe

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Pengguna klik OK mengembalikan true, batal mengembalikan false
};
```

`ModalConfig` sama dengan konfigurasi method statis `Modal` di Ant Design.

## Method Umum

| Method | Return Value | Deskripsi |
|------|--------|------|
| `info(config)` | `Promise<void>` | Popup tip informasi |
| `success(config)` | `Promise<void>` | Popup tip sukses |
| `error(config)` | `Promise<void>` | Popup tip error |
| `warning(config)` | `Promise<void>` | Popup tip peringatan |
| `confirm(config)` | `Promise<boolean>` | Popup konfirmasi, pengguna klik OK mengembalikan `true`, batal mengembalikan `false` |

## Parameter Konfigurasi

Sama dengan `Modal` di Ant Design, field umum termasuk:

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `title` | `ReactNode` | Judul |
| `content` | `ReactNode` | Konten |
| `okText` | `string` | Teks tombol konfirmasi |
| `cancelText` | `string` | Teks tombol batal (hanya `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Eksekusi saat klik konfirmasi |
| `onCancel` | `() => void` | Eksekusi saat klik batal |

## Hubungan dengan ctx.message, ctx.openView

| Tujuan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Tip ringan sementara** | `ctx.message`, otomatis hilang |
| **Popup informasi/sukses/error/peringatan** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Konfirmasi sekunder (perlu pilihan pengguna)** | `ctx.modal.confirm`, dengan `ctx.exit()` untuk mengontrol flow |
| **Form kompleks, list, dan interaksi lainnya** | `ctx.openView` membuka view kustom (halaman/drawer/popup) |

## Contoh

### Popup Informasi Sederhana

```ts
ctx.modal.info({
  title: 'Tip',
  content: 'Operasi sudah selesai',
});
```

### Popup Konfirmasi dan Mengontrol Flow

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Konfirmasi penghapusan',
  content: 'Apakah Anda yakin ingin menghapus record ini?',
  okText: 'OK',
  cancelText: 'Batal',
});
if (!confirmed) {
  ctx.exit();  // Menghentikan langkah selanjutnya saat pengguna membatalkan
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Popup Konfirmasi dengan onOk

```ts
await ctx.modal.confirm({
  title: 'Konfirmasi submit',
  content: 'Setelah submit tidak dapat dimodifikasi, apakah ingin melanjutkan?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Tip Error

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Sukses', content: 'Operasi sudah selesai' });
} catch (e) {
  ctx.modal.error({ title: 'Error', content: e.message });
}
```

## Terkait

- [ctx.message](./message.md): Tip ringan sementara, otomatis hilang
- [ctx.exit()](./exit.md): Saat pengguna membatalkan konfirmasi, sering menggunakan `if (!confirmed) ctx.exit()` untuk menghentikan flow
- [ctx.openView()](./open-view.md): Membuka view kustom, cocok untuk interaksi kompleks
