---
title: "Masalah Umum dalam Pengembangan Plugin Karyawan AI"
description: "Pecahkan masalah ketika Alat, Keterampilan, karyawan bawaan, dan kartu Alat front-end NocoBase AI tidak terdaftar atau dijalankan."
keywords: "NocoBase, FAQ karyawan AI, Alat tidak terdaftar, Keterampilan tidak dimuat, kartu front-end"
---

# Masalah Umum dalam Pengembangan Plugin Karyawan AI

## Alat tidak terdaftar

Periksa dalam urutan berikut:

- Apakah file tersebut terletak di `src/ai/**/tools/` dalam cakupan pembuatan plugin
- Apakah akan menggunakan file `.ts` atau `.js`
- Apakah `export default defineTools(...)`
- Apakah file Alat salah diberi nama `.d.ts`
- Apakah Alat dengan nama yang sama muncul, menyebabkan item pendaftaran selanjutnya diabaikan
- Apakah plugin telah dibuat ulang dan dimuat

## Keterampilan tidak muncul

Nama file diperiksa terlebih dahulu. Saat ini harus:

```text
SKILLS.md
```

Konfirmasikan juga bahwa frontmatter berisi `name` dan `description` yang stabil, dan bahwa file tersebut berlokasi di `src/ai/**/skills/<skill-name>/SKILLS.md`.

## Keterampilan dapat dimuat, tetapi Alat tidak dapat dipanggil

Periksa item berikut:

- Apakah daftar `tools` Keterampilan berisi nama Alat
- Apakah Alat ditempatkan di direktori `tools/` Keterampilan saat ini
- Apakah nama file Alat, `definition.name`, dan referensi Keterampilan konsisten?
- `scope` cocok untuk metode pengikatan saat ini
- Apakah Alat tidak terdaftar karena nama duplikat?

Mengikat Alat hanya berarti model dapat menggunakannya. Jika Alat sudah muncul di Skill, namun model masih belum dipanggil, Anda perlu menuliskan dengan jelas waktu pemanggilan, persyaratan parameter, dan langkah menunggu hasil di alur kerja `SKILLS.md`.

## Kartu front-end tidak ditampilkan

Nama registrasi front-end harus sama persis dengan nama Alat akhir di server:

```ts
this.ai.toolsManager.registerTools('developerChoice', options);
```

Periksa juga:

- Apakah plugin khusus menggunakan runtime `src/client-v2/`
- Apakah kartu terdaftar di `load()` plugin klien
- Apakah ToolCall telah memasuki keadaan yang didukung oleh kartu
- Apakah kartu dinonaktifkan karena penilaian `invokeStatus`
- Apakah plugin klien telah dibuat ulang dan dimuat

## Alat tidak melanjutkan eksekusi setelah mengklik kartu

Verifikasi bahwa salah satu dari `approve()`, `edit()`, atau `reject()` telah dipanggil. Saat Anda perlu menulis kembali pilihan pengguna ke parameter, gunakan:

```ts
await decisions.edit({
  ...toolCall.args,
  option: selectedOption,
});
```

Konfirmasikan juga bahwa skema server mengizinkan bidang ini dan `invoke()` akan membacanya.

## Modifikasi `definition.name` tidak berlaku

Nama Alat yang dimuat secara otomatis ditentukan oleh nama file atau nama direktori. Misalnya:

```text
src/ai/tools/developerChoice.ts
```

Nama akhirnya adalah `developerChoice`. Jika Anda ingin mengubah nama, Anda perlu menyinkronkan file yang diubah namanya, referensi Keterampilan, konfigurasi staf AI, dan nama registrasi front-end.

## Tautan terkait

- [Pengembangan Plug-in Staf AI](./index.md) — Kembali ke Ikhtisar Panduan Pengembangan
- [Mendefinisikan Tool server](./define-tool.md) — Periksa penamaan Alat dan metode pendaftaran
- [Tentukan Keterampilan](./define-skill.md) — Periksa pengikatan Keterampilan dan Alat
- [Tambahkan kartu front-end ](./frontend-tool-ui.md) untuk Alat — Periksa ToolCall dan registrasi front-end
