---
title: "Mulai Cepat Pengembangan Plugin AI"
description: "Gunakan AI untuk membantu mengembangkan Plugin NocoBase, jelaskan kebutuhan dengan satu kalimat, secara otomatis menghasilkan kode frontend backend, tabel data, konfigurasi Permission, dan internasionalisasi."
keywords: "Pengembangan AI,AI Development,NocoBase AI,Pengembangan Plugin,Pemrograman AI,Skills,Mulai Cepat"
---

# Mulai Cepat Pengembangan Plugin AI

Pengembangan Plugin AI adalah kemampuan pengembangan Plugin dengan bantuan AI yang disediakan NocoBase — Anda dapat mendeskripsikan kebutuhan dengan bahasa natural, AI akan secara otomatis menghasilkan kode frontend dan backend lengkap, termasuk tabel data, API, Block frontend, Permission, dan internasionalisasi. Memberikan pengalaman pengembangan Plugin yang lebih modern dan efisien.

Kemampuan Pengembangan Plugin AI berbasis pada Skill [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development). Jika Anda sudah menginisialisasi melalui NocoBase CLI (`nb init`), Skill ini akan otomatis terinstal.

## Mulai Cepat

Jika Anda sudah memasang [NocoBase CLI](../ai/quick-start.md), Anda dapat melewati langkah ini.

### Instalasi AI Sekali Klik

Salin prompt di bawah ini ke asisten AI Anda (Claude Code, Codex, Cursor, Trae, dll), instalasi dan konfigurasi akan otomatis selesai:

```
Bantu saya memasang NocoBase CLI dan menyelesaikan inisialisasi: https://docs.nocobase.com/cn/ai/ai-quick-start.md (silakan akses langsung konten link)
```

### Instalasi Manual

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Browser akan secara otomatis membuka halaman konfigurasi visual, memandu Anda untuk memasang NocoBase Skills, mengonfigurasi database, dan memulai aplikasi. Untuk langkah-langkah detail silakan lihat [Mulai Cepat](../ai/quick-start.md).

:::warning Perhatian

- NocoBase sedang bermigrasi dari `client` (v1) ke `client-v2`, saat ini `client-v2` masih dalam pengembangan. Kode klien yang dihasilkan oleh Pengembangan AI berbasis pada `client-v2`, hanya dapat digunakan di path `/v2/`, untuk pengalaman mencoba, tidak disarankan langsung digunakan di lingkungan production.
- Kode yang dihasilkan AI tidak selalu 100% benar, disarankan melakukan review terlebih dahulu sebelum diaktifkan. Jika menemui masalah saat runtime, Anda dapat mengirim informasi error ke AI, biarkan ia melanjutkan troubleshooting dan perbaikan — biasanya beberapa putaran dialog dapat menyelesaikannya.
- Disarankan menggunakan model besar seri GPT atau Claude untuk pengembangan, hasilnya terbaik. Model besar lainnya juga dapat digunakan, namun kualitas pembuatan mungkin berbeda.

:::

## Dari Satu Kalimat ke Plugin Lengkap

Setelah instalasi selesai, Anda dapat langsung menggunakan bahasa natural untuk memberi tahu AI Plugin apa yang ingin Anda kembangkan. Berikut adalah beberapa skenario nyata, rasakan kemampuan pengembangan Plugin AI.

### Pengembangan Plugin Watermark dengan Satu Kalimat

Satu prompt, AI dapat membantu Anda menghasilkan Plugin watermark yang lengkap — termasuk logika rendering frontend, deteksi anti-tamper, API penyimpanan setting backend, dan halaman setting Plugin.

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

Selama proses ini Anda hanya perlu mendeskripsikan kebutuhan, membuat keputusan, sisanya AI akan menangani secara otomatis. Ingin melihat proses lengkap? → [Praktik: Pengembangan Plugin Watermark](./watermark-plugin)

### Membuat Komponen Field Kustom dengan Satu Kalimat

Ingin membuat Field integer ditampilkan sebagai rating bintang? Beri tahu AI tampilan yang Anda inginkan, ia akan membantu Anda menghasilkan FieldModel kustom, mengganti komponen rendering Field default.

```
Tolong gunakan nocobase-plugin-development skill untuk membantu saya mengembangkan Plugin NocoBase, namanya @my-scope/plugin-rating,
buat satu komponen tampilan Field kustom (FieldModel), render Field tipe integer sebagai ikon bintang,
mendukung skor 1-5, klik bintang dapat langsung memodifikasi nilai rating dan menyimpannya ke database.
```

![Tampilan Komponen Rating](https://static-docs.nocobase.com/20260422170712.png)

Untuk mempelajari lebih lanjut tentang penggunaan kemampuan, silakan lihat [Kemampuan yang Didukung](./capabilities).

## Apa yang Dapat AI Bantu Anda Lakukan

| Saya ingin… | AI Dapat Membantu Anda |
| ----------- | ---------------------- |
| Membuat Plugin baru | Menghasilkan scaffold lengkap, termasuk struktur direktori frontend dan backend |
| Mendefinisikan tabel data | Menghasilkan definisi Collection, mendukung semua tipe Field dan relasi |
| Membuat Block kustom | Menghasilkan BlockModel + panel konfigurasi + register ke menu "Tambah Block" |
| Membuat Field kustom | Menghasilkan FieldModel + binding ke field interface |
| Menambahkan tombol Action kustom | Menghasilkan ActionModel + popup/drawer/confirm box |
| Membuat halaman setting Plugin | Menghasilkan formulir frontend + API backend + storage |
| Menulis API kustom | Menghasilkan Resource Action + register route + konfigurasi ACL |
| Mengonfigurasi Permission | Menghasilkan aturan ACL, mengontrol akses berdasarkan role |
| Dukungan multi-bahasa | Otomatis menghasilkan paket bahasa Mandarin dan Inggris |
| Menulis script upgrade | Menghasilkan Migration, mendukung DDL dan migrasi data |

Penjelasan detail dan contoh prompt setiap kemampuan → [Kemampuan yang Didukung](./capabilities)

## Tautan Terkait

- [Praktik: Pengembangan Plugin Watermark](./watermark-plugin) — Studi kasus praktik pengembangan Plugin AI yang lengkap, dari satu kalimat hingga Plugin yang dapat digunakan
- [Kemampuan yang Didukung](./capabilities) — Semua hal yang dapat dilakukan AI untuk Anda, dengan contoh prompt
- [NocoBase CLI](../ai/quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
- [Referensi NocoBase CLI](../api/cli/index.md) — Penjelasan parameter lengkap untuk semua perintah
- [Pengembangan Plugin](../plugin-development/index.md) — Panduan lengkap pengembangan Plugin NocoBase
- [Mulai Cepat Pembangunan AI](../ai-builder/index.md) — Bangun aplikasi NocoBase dengan AI (tanpa menulis kode)
