---
title: "Praktik: Pengembangan Plugin Watermark"
description: "Mengembangkan satu Plugin watermark NocoBase dengan satu kalimat AI: watermark menutupi halaman, deteksi anti-tamper, parameter watermark yang dapat dikonfigurasi."
keywords: "Pengembangan AI,Plugin Watermark,Plugin NocoBase,Studi Kasus Praktik,Pemrograman AI"
---

# Praktik: Pengembangan Plugin Watermark

Studi kasus ini menunjukkan cara menggunakan satu kalimat untuk membuat AI mengembangkan satu Plugin watermark NocoBase yang lengkap — dari pembuatan scaffold hingga validasi aktivasi, seluruhnya dilakukan oleh AI.

## Hasil Akhir

Setelah Plugin diaktifkan:

- Halaman NocoBase ditutupi watermark semi-transparan, menampilkan nama Pengguna login saat ini
- Watermark tidak dapat dihapus dengan menghapus DOM — pemeriksaan berkala akan secara otomatis membuat ulang
- Pada "Konfigurasi Plugin" dapat menyesuaikan teks watermark, transparansi, dan ukuran font

![watermark plugin](https://static-docs.nocobase.com/20260416170645.png)

## Prasyarat

:::tip Bacaan Awal

- [NocoBase CLI](../ai/quick-start.md) — Memasang dan menjalankan NocoBase
- [Mulai Cepat Pengembangan Plugin AI](./index.md) — Memasang Skills

:::

Pastikan Anda telah:

1. Memiliki lingkungan pengembangan NocoBase yang berjalan (NocoBase CLI akan otomatis memasang NocoBase Skills saat inisialisasi)
2. Membuka editor yang mendukung AI Agent (seperti Claude Code, Codex, Cursor, dll)

:::warning Perhatian

- NocoBase sedang bermigrasi dari `client` (v1) ke `client-v2`, saat ini `client-v2` masih dalam pengembangan. Kode klien yang dihasilkan oleh Pengembangan AI berbasis pada `client-v2`, hanya dapat digunakan di path `/v2/`, untuk pengalaman mencoba, tidak disarankan langsung digunakan di lingkungan production.
- Kode yang dihasilkan AI tidak selalu 100% benar, disarankan melakukan review terlebih dahulu sebelum diaktifkan. Jika menemui masalah saat runtime, Anda dapat mengirim informasi error ke AI, biarkan ia melanjutkan troubleshooting dan perbaikan — biasanya beberapa putaran dialog dapat menyelesaikannya.

:::

## Mulai

Di direktori root proyek NocoBase Anda, kirim prompt berikut ke AI:

```
Bantu saya menggunakan nocobase-plugin-development skill untuk mengembangkan Plugin watermark NocoBase,
persyaratan: tampilkan watermark semi-transparan di halaman, menampilkan nama Pengguna login saat ini, untuk mencegah kebocoran screenshot.
Periksa secara berkala apakah DOM watermark dihapus, jika dihapus akan dibuat ulang.
Pada halaman setting Plugin mendukung konfigurasi teks watermark, transparansi, dan ukuran font.
Nama Plugin: @my-project/plugin-watermark
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

## Apa yang Dilakukan AI

Setelah AI menerima kebutuhan, ia akan secara otomatis menjalankan langkah-langkah berikut:

### 1. Menganalisis Kebutuhan dan Mengonfirmasi Rencana

AI akan terlebih dahulu menganalisis ekstensi NocoBase apa yang dibutuhkan Plugin ini, kemudian memberikan Anda rencana pengembangan. Misalnya:

> **Sisi Server:**
> - Satu tabel data `watermarkSettings`, menyimpan konfigurasi watermark (teks, transparansi, ukuran font)
> - Satu API kustom, membaca/menulis konfigurasi watermark
> - Konfigurasi ACL, Pengguna login dapat membaca, administrator dapat menulis
>
> **Sisi Klien:**
> - Halaman setting Plugin, gunakan formulir untuk mengonfigurasi parameter watermark
> - Logika rendering watermark, setelah membaca konfigurasi menutupi watermark di halaman
> - Deteksi anti-tamper, timer memantau DOM watermark

Setelah rencana dikonfirmasi, AI mulai menulis kode.

<!-- Diperlukan satu screenshot terminal AI mengeluarkan rencana pengembangan -->

### 2. Membuat Scaffold Plugin

```bash
yarn pm create @my-project/plugin-watermark
```

AI menghasilkan struktur direktori Plugin standar di `packages/plugins/@my-project/plugin-watermark/`.

### 3. Menulis Kode Sisi Server

AI akan menghasilkan file berikut:

- **Definisi Tabel Data** — Tabel `watermarkSettings`, berisi Field `text`, `opacity`, `fontSize`
- **API Kustom** — Antarmuka membaca dan memperbarui konfigurasi watermark
- **Konfigurasi ACL** — Pengguna login dapat membaca konfigurasi watermark, administrator dapat memodifikasi

<!-- Diperlukan satu screenshot terminal, menampilkan proses AI sedang menghasilkan kode sisi server -->

### 4. Menulis Kode Sisi Klien

- **Halaman Setting Plugin** — Satu formulir Ant Design, mengonfigurasi teks watermark, transparansi (slider), ukuran font
- **Rendering Watermark** — Membuat layer overlay canvas/div fullscreen di halaman, menampilkan nama Pengguna login saat ini
- **Deteksi Anti-tamper** — Jaminan ganda `MutationObserver` + timer, DOM yang dihapus akan langsung dibuat ulang

<!-- Diperlukan satu screenshot terminal, menampilkan proses AI sedang menghasilkan kode sisi klien -->

### 5. Internasionalisasi

AI secara otomatis menghasilkan paket bahasa Mandarin dan Inggris, tanpa memerlukan operasi tambahan dari Anda:

- `src/locale/zh-CN.json` — Terjemahan Mandarin
- `src/locale/en-US.json` — Terjemahan Inggris

### 6. Mengaktifkan Plugin

```bash
yarn pm enable @my-project/plugin-watermark
```

Setelah diaktifkan, buka halaman NocoBase, Anda akan melihat watermark menutupi konten.

<!-- Diperlukan satu video: dari memasukkan prompt → AI menghasilkan kode → mengaktifkan Plugin → halaman menampilkan watermark → membuka halaman setting menyesuaikan parameter → watermark berubah, alur lengkap -->

## Berapa Lama Seluruh Prosesnya

Dari memasukkan prompt hingga Plugin dapat digunakan, sekitar **3-5 menit**. AI menyelesaikan pekerjaan berikut:

| Pekerjaan | Estimasi Pengembangan Manual | Diselesaikan AI |
| --------- | ---------------------------- | --------------- |
| Membuat scaffold | 2 menit | Otomatis |
| Tabel Data + API | 20 menit | Otomatis |
| Halaman Setting Plugin | 30 menit | Otomatis |
| Rendering Watermark + Anti-tamper | 40 menit | Otomatis |
| Konfigurasi ACL | 10 menit | Otomatis |
| Internasionalisasi | 15 menit | Otomatis |
| **Total** | **~2 jam** | **~5 menit** |


## Ingin Membuat Plugin Lain?

Plugin watermark terutama melibatkan rendering frontend dan storage backend yang sederhana. Jika Anda ingin tahu apa lagi yang dapat AI bantu Anda lakukan — misalnya Block kustom, relasi tabel data kompleks, ekstensi Workflow, dan lainnya — Anda dapat melihat [Kemampuan yang Didukung](./capabilities).

## Tautan Terkait

- [Mulai Cepat Pengembangan Plugin AI](./index.md) — Mulai cepat dan ikhtisar kemampuan
- [Kemampuan yang Didukung](./capabilities) — Semua hal yang dapat dilakukan AI untuk Anda, dengan contoh prompt
- [Pengembangan Plugin](../plugin-development/index.md) — Panduan lengkap pengembangan Plugin NocoBase
- [NocoBase CLI](../ai/quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
