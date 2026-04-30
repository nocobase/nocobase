---
title: "Mulai Cepat Pembangunan AI"
description: "Pembangunan AI adalah kemampuan pembangunan dengan bantuan AI dari NocoBase, menyelesaikan operasi pemodelan data, konfigurasi UI, orkestrasi Workflow, dan lainnya melalui bahasa natural, memberikan pengalaman pembangunan yang lebih modern dan efisien."
keywords: "Pembangunan AI,AI Builder,NocoBase AI,Agent Skills,Pembangunan Bahasa Natural,AI Low-code,Mulai Cepat"
---

# Mulai Cepat Pembangunan AI

Pembangunan AI adalah kemampuan pembangunan dengan bantuan AI yang disediakan NocoBase — Anda dapat mendeskripsikan kebutuhan dengan bahasa natural, AI akan secara otomatis menyelesaikan operasi seperti pemodelan data, konfigurasi halaman, pengaturan Permission, dan lainnya. Memberikan pengalaman pembangunan yang lebih modern dan efisien.

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

## Gunakan Percakapan Sebagai Pengganti Konfigurasi Manual

Setelah NocoBase CLI terinstal, Anda dapat langsung menggunakan bahasa natural di asisten AI untuk mengoperasikan NocoBase. Berikut adalah beberapa skenario nyata, dari membuat satu tabel hingga membangun seluruh sistem, rasakan kemampuan pembangunan AI.

### Deskripsikan Kebutuhan Bisnis, AI Membantu Anda Merancang Tabel dan Relasi

Beri tahu AI sistem apa yang ingin Anda buat, ia akan secara otomatis membantu Anda merancang tabel data, tipe Field, dan relasi — tanpa perlu menggambar diagram ER sendiri.

```
Saya sedang membangun CRM, tolong bantu saya merancang dan membangun model data
```

![Model Data CRM yang Dirancang AI](https://static-docs.nocobase.com/202604162126729.png)

AI secara otomatis menghasilkan tabel data seperti pelanggan, kontak, peluang, pesanan, dan lainnya, beserta relasi antar mereka:

![Hasil Model Data CRM](https://static-docs.nocobase.com/202604162201867.png)

Untuk mempelajari lebih lanjut tentang penggunaan pemodelan data, silakan lihat [Pemodelan Data](./data-modeling).

### Deskripsikan Halaman dengan Bahasa Bisnis, AI Membangunnya untuk Anda

Tidak perlu mempelajari aturan konfigurasi, langsung katakan halaman seperti apa yang Anda inginkan — kotak pencarian, tabel, kondisi filter, sebutkan saja maka akan tersedia.

```
Bantu saya membuat halaman manajemen pelanggan, berisi kotak pencarian nama dan tabel pelanggan, tabel menampilkan nama, telepon, email, waktu pembuatan
```

![Halaman Manajemen Pelanggan](https://static-docs.nocobase.com/20260420100608.png)

Untuk mempelajari lebih lanjut tentang penggunaan konfigurasi UI, silakan lihat [Konfigurasi UI](./ui-builder).

### Orkestrasi Workflow Otomatis dengan Satu Kalimat

Deskripsikan kondisi trigger dan logika pemrosesan dari proses bisnis, AI akan secara otomatis membuat trigger dan rangkaian Node.

```
Bantu saya orkestrasikan satu Workflow yang otomatis mengurangi stok barang setelah pesanan dibuat
```

![Workflow Pengurangan Stok Pesanan](https://static-docs.nocobase.com/20260419234303.png)

Untuk mempelajari lebih lanjut tentang penggunaan Workflow, silakan lihat [Manajemen Workflow](./workflow).

### Tabel Data, Halaman, Dashboard, Sekaligus

:::warning Perhatian

Fungsi solusi saat ini masih dalam tahap pengujian, stabilitasnya terbatas, hanya untuk pengalaman mencoba.

:::

Deskripsikan skenario bisnis Anda dengan satu kalimat, AI akan membantu Anda membangun semua tabel data, halaman manajemen, dashboard, dan grafik.

```
Bantu saya menggunakan nocobase-dsl-reconciler skill untuk membangun sistem manajemen tiket, berisi dashboard, daftar tiket, manajemen pengguna, konfigurasi SLA
```

AI terlebih dahulu mengeluarkan rancangan desain, setelah dikonfirmasi langsung dibangun sekaligus:

![Rancangan Desain Sistem Tiket](https://static-docs.nocobase.com/20260420100420.png)

![Hasil Pembangunan Sistem Tiket](https://static-docs.nocobase.com/20260420100450.png)

Untuk mempelajari lebih lanjut tentang penggunaan pembangunan seluruh sistem, silakan lihat [Solusi](./dsl-reconciler).

## Keamanan & Audit

Sebelum membiarkan AI Agent mengoperasikan NocoBase, disarankan untuk memahami terlebih dahulu metode autentikasi, kontrol Permission, dan audit operasi — pastikan AI hanya melakukan apa yang seharusnya, setiap langkah tercatat. Silakan lihat [Keamanan & Audit](./security).

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) adalah paket pengetahuan domain yang dapat dipasang ke AI Agent, agar AI memahami sistem konfigurasi NocoBase. NocoBase menyediakan 8 Skills, mencakup seluruh proses pembangunan:

- [Manajemen Lingkungan](./env-bootstrap) — Pemeriksaan lingkungan, instalasi deployment, upgrade, dan diagnostik masalah
- [Pemodelan Data](./data-modeling) — Membuat dan mengelola tabel data, Field, relasi
- [Konfigurasi UI](./ui-builder) — Membuat dan mengedit halaman, Block, popup, interaksi
- [Manajemen Workflow](./workflow) — Membuat, mengedit, mengaktifkan, dan mendiagnosis Workflow
- [Konfigurasi Permission](./acl) — Mengelola role, kebijakan Permission, pengikatan Pengguna, dan penilaian risiko
- [Solusi](./dsl-reconciler) — Membangun seluruh sistem bisnis secara batch dari YAML
- [Manajemen Plugin](./plugin-manage) — Melihat, mengaktifkan, dan menonaktifkan Plugin
- [Manajemen Publikasi](./publish) — Publikasi lintas lingkungan, backup recovery, dan migrasi

:::tip Tips

NocoBase CLI akan secara otomatis menginstal Skills selama proses inisialisasi (`nb init`), tanpa perlu instalasi manual.

:::

## Tautan Terkait

- [NocoBase CLI](../ai/quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
- [Referensi NocoBase CLI](../api/cli/index.md) — Penjelasan parameter lengkap untuk semua perintah
- [Pengembangan Plugin AI](../ai-dev/index.md) — Gunakan AI untuk membantu mengembangkan Plugin NocoBase
- [Keamanan & Audit](./security) — Metode autentikasi, kontrol Permission, dan audit operasi
- [Karyawan AI](../ai-employees/index.md) — Kemampuan Agent NocoBase, mendukung kolaborasi dan eksekusi operasi di antarmuka bisnis
