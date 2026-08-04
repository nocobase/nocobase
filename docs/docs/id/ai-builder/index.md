---
title: "Mulai Cepat Pembangunan AI"
description: "Pembangunan AI adalah kemampuan pembangunan dengan bantuan AI dari NocoBase, gunakan bahasa natural untuk pemodelan data, pembangunan UI, orkestrasi Workflow, dan konfigurasi Permission, mendukung dua cara: konfigurasi no-code dan AI menulis kode."
keywords: "Pembangunan AI,AI Builder,NocoBase AI,Agent Skills,Pembangunan Bahasa Natural,AI Low-code,AI Portal,Mulai Cepat"
---

# Mulai Cepat Pembangunan AI

Pembangunan AI adalah kemampuan pembangunan dengan bantuan AI yang disediakan NocoBase — Anda mendeskripsikan kebutuhan bisnis dengan bahasa natural, AI Agent membantu Anda membangun sistemnya. Mulai dari pemodelan data, pembangunan UI, orkestrasi Workflow, konfigurasi Permission, hingga akhirnya rilis ke production, seluruh rantainya tercakup.

Khusus untuk **bagaimana UI dibangun**, ada dua cara:

- **AI + pembangunan Portal no-code** — AI membangun UI sistem Anda berdasarkan kemampuan konfigurasi no-code NocoBase, hasilnya berupa konfigurasi yang tersimpan di database. Cocok untuk CRUD standar dan back-office internal, dan orang bisnis nantinya juga dapat menyesuaikannya sendiri lewat antarmuka
- **Pembangunan AI Portal** — NocoBase menyediakan kemampuan dasar (data, autentikasi, Permission, dan lainnya), AI Agent langsung menulis kode secara lokal (hasilnya dapat langsung di-commit ke Git), setelah di-build dan di-deploy dapat diakses langsung melalui [AI Portal](./ai-portal/index.md). Cocok untuk interaksi kustom, sistem bisnis kompleks, dan skenario dengan kebutuhan visual khusus

Cara mana pun yang Anda pilih, tabel data, Permission, dan Workflow tetap menggunakan satu set Skill yang sama — sambil menulis halaman, AI Agent juga sekalian dapat membuatkan tabel data dan mengonfigurasi Permission untuk Anda, sehingga melalui percakapan sebuah sistem bisnis yang lengkap terbangun secara bertahap.

## Cara Memilih di Antara Dua Cara Pembangunan

Kedua cara di atas masing-masing berkaitan dengan satu entry akses. Satu aplikasi NocoBase dapat memiliki beberapa entry yang berbagi satu set data yang sama, dan dari path aksesnya Anda dapat mengenali entry yang mana:

```text
/v/<name>    Portal no-code
/x/<name>    AI Portal
```

![two types of portal](https://static-docs.nocobase.com/20260804091849.png)

Perbedaan detailnya:

| | Portal no-code | AI Portal |
| --- | --- | --- |
| Path akses | `/v/<name>` | `/x/<name>` |
| Asal halaman | Dikonfigurasi lewat antarmuka, AI dapat membantu mengubah konfigurasi | Source React, ditulis AI Agent |
| Hasil | Konfigurasi yang tersimpan di database | Source yang dapat di-commit ke Git |
| Cara iterasi | Klik-klik di antarmuka, atau minta AI mengubah konfigurasi | Ubah kode, `dev` → `deploy` |
| Manajemen versi | Menyimpan snapshot melalui [Kontrol Versi](./version-control.md) | Git, atau source storage NocoBase |
| Kebebasan UI | Terbatas pada kemampuan Block, layout dan interaksi punya pola yang sudah ditetapkan | Terserah Anda mau dibuat seperti apa |
| Kemampuan siap pakai | Dashboard, kalender, tampilan kanban, dan Block lainnya siap pakai | Mengacu pada kode template standar yang kami sediakan, atau diimplementasikan sendiri oleh AI Agent |
| Tingkat kesulitan | Perlu memahami Block, Field, dan konsep NocoBase lainnya | Perlu cukup terbiasa menggunakan AI Agent |
| Cocok untuk | CRUD standar, back-office internal | Interaksi kustom, sistem bisnis kompleks, kebutuhan visual khusus |

Beberapa kondisi berikut cukup ditangani dengan Portal no-code:

- Struktur halaman sangat standar, hanya tabel dan formulir biasa, mengonfigurasinya lebih cepat daripada menulis kode
- Orang bisnis yang tidak menulis kode perlu menyesuaikan halaman sendiri
- Anda hanya ingin memakai kemampuan Block bawaan NocoBase, misalnya dashboard, tampilan kalender, tampilan kanban
- Membangun sendirian, atau tidak butuh pembangunan bersama banyak orang

Untuk skenario lainnya kami lebih menyarankan membangun dengan [AI Portal](./ai-portal/index.md). Pada pembangunan Portal no-code, konteks yang harus dipelajari AI terlalu banyak — tipe Block, struktur konfigurasi, aturan reaksi, dan lainnya — sehingga untuk sistem bisnis yang butuh pembangunan kompleks, efisiensi pembangunan, kemudahan pemeliharaan, maupun kolaborasi banyak orang sama-sama kurang ideal.

Maka kami mengambil pendekatan lain: **menulis kode frontend adalah hal yang paling dikuasai AI**, jadi biarkan ia mengerjakan yang paling dikuasainya. NocoBase berperan sebagai fondasi kernel sistem, sedangkan frontend diserahkan sepenuhnya kepada AI. Dengan kebutuhan yang sama, hasilnya lebih cepat dan lebih baik. **AI berkreasi bebas, NocoBase yang menjamin keandalan.**

Kedua mode ini juga dapat dicampur: back-office internal dikonfigurasi cepat dengan Portal no-code, sedangkan portal pelanggan yang menghadap keluar dikustomisasi secara rinci dengan AI Portal — keduanya berada dalam satu aplikasi yang sama, berbagi satu set data dan sistem pengguna.

## Mulai Cepat

::: warning Perhatian
Jika ingin mencoba pembangunan AI Portal, harap pasang NocoBase CLI versi alpha (`npm install -g @nocobase/cli@alpha`).
:::

Jika Anda sudah memasang [NocoBase CLI](../ai/quick-start.md), Anda dapat melewati langkah ini.

### Instalasi AI Sekali Klik

Salin prompt di bawah ini ke asisten AI Anda (Claude Code, Codex, Cursor, Trae, dll), instalasi dan konfigurasi akan otomatis selesai:

```
Bantu saya memasang NocoBase CLI dan menyelesaikan inisialisasi: https://docs.nocobase.com/id/ai/ai-quick-start.md (silakan akses langsung konten link)
```

### Instalasi Manual

```bash
npm install -g @nocobase/cli@alpha
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

### Bangun satu milestone, dan AI menyimpan versi yang dapat dipulihkan untuk Anda

Setelah menyelesaikan sebuah halaman, sekelompok tabel data, atau sebuah Workflow, minta AI menyimpan keadaan saat ini sebagai versi — jika ada konfigurasi yang rusak, Anda selalu bisa kembali ke milestone terakhir yang jelas.

```
Simpan hasil pembangunan saat ini sebagai versi: halaman manajemen pelanggan, area filter, dan form edit sudah selesai dikonfigurasi
```

![AI membuat versi setelah membangun](https://static-docs.nocobase.com/20260611115804.png)

AI tidak menyimpan versi setiap kali mengubah satu Field; AI hanya menyimpan setelah menyelesaikan dan memverifikasi satu milestone yang jelas, sehingga daftar versi lebih mudah dibaca dan lebih mudah menentukan ke mana harus kembali.

Untuk mempelajari lebih lanjut tentang kontrol versi, silakan lihat [Kontrol Versi](./version-control).

### Orkestrasi Workflow Otomatis dengan Satu Kalimat

Deskripsikan kondisi trigger dan logika pemrosesan dari proses bisnis, AI akan secara otomatis membuat trigger dan rangkaian Node.

```
Bantu saya orkestrasikan satu Workflow yang otomatis mengurangi stok barang setelah pesanan dibuat
```

![Workflow Pengurangan Stok Pesanan](https://static-docs.nocobase.com/20260419234303.png)

Untuk mempelajari lebih lanjut tentang penggunaan Workflow, silakan lihat [Manajemen Workflow](./workflow).

### Deskripsikan Halaman dengan Bahasa Bisnis, AI Membangunnya untuk Anda

NocoBase secara default menyediakan satu **AI Portal** dan satu **Portal no-code**. Tidak perlu mempelajari aturan konfigurasi, langsung katakan halaman seperti apa yang Anda inginkan — kotak pencarian, tabel, kondisi filter, sebutkan saja maka akan tersedia.

![portal manage](https://static-docs.nocobase.com/20260804104517.png)

Jika membangun melalui Portal no-code (nama Portal default adalah admin), acuannya seperti berikut:

```
Bantu saya membuat halaman manajemen pelanggan di admin, berisi kotak pencarian nama dan tabel pelanggan, tabel menampilkan nama, telepon, email, waktu pembuatan
```

![Halaman Manajemen Pelanggan](https://static-docs.nocobase.com/20260420100608.png)

Jika membangun melalui mode AI Portal (nama Portal default adalah main), acuannya seperti berikut:

```
Bantu saya membuat halaman manajemen pelanggan di main portal, berisi kotak pencarian dan tabel pelanggan, tabel menampilkan nama, telepon, industri
```

![halaman portal](https://static-docs.nocobase.com/20260803204422.png)

Untuk mempelajari lebih lanjut tentang penggunaan konfigurasi UI, silakan lihat [Konfigurasi UI](./ui-builder) atau [Pembangunan AI Portal](./ai-portal/index.md).

## Keamanan & Audit

Sebelum membiarkan AI Agent mengoperasikan NocoBase, disarankan untuk memahami terlebih dahulu metode autentikasi, kontrol Permission, dan audit operasi — pastikan AI hanya melakukan apa yang seharusnya, setiap langkah tercatat. Silakan lihat [Keamanan & Audit](./security).

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) adalah paket pengetahuan domain yang dapat dipasang ke AI Agent, agar AI memahami sistem konfigurasi NocoBase. NocoBase menyediakan beberapa Skills, mencakup seluruh proses pembangunan:

- [Manajemen Lingkungan](./env-bootstrap) — Pemeriksaan lingkungan, instalasi deployment, upgrade, dan diagnostik masalah
- [Pemodelan Data](./data-modeling) — Membuat dan mengelola tabel data, Field, relasi
- [Konfigurasi UI](./ui-builder) — Membuat dan mengedit halaman, Block, popup, interaksi
- [Manajemen Workflow](./workflow) — Membuat, mengedit, mengaktifkan, dan mendiagnosis Workflow
- [Konfigurasi Permission](./acl) — Mengelola role, kebijakan Permission, pengikatan Pengguna, dan penilaian risiko
- [Solusi](./dsl-reconciler) — Membangun seluruh sistem bisnis secara batch dari YAML
- [Manajemen Plugin](./plugin-manage) — Melihat, mengaktifkan, dan menonaktifkan Plugin
- [Manajemen Publikasi](./publish) — Publikasi lintas lingkungan, backup recovery, dan migrasi
- [Kontrol Versi](./version-control) — Menyimpan versi yang dapat dipulihkan setelah milestone selesai
- [Pembangunan AI Portal](https://github.com/nocobase/skills/blob/main/skills/nocobase-ai-builder/SKILL.md) - Membuat AI Agent menulis kode di AI Portal untuk membangun UI sistem

:::tip Tips

NocoBase CLI akan secara otomatis menginstal Skills selama proses inisialisasi (`nb init`), tanpa perlu instalasi manual.

:::

## Tautan Terkait

- [AI Portal](./ai-portal/index.md) — Cara pembangunan lain, dengan AI Agent langsung menulis kode frontend
- [NocoBase CLI](../ai/quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
- [Referensi NocoBase CLI](../api/cli/index.md) — Penjelasan parameter lengkap untuk semua perintah
- [Pengembangan Plugin AI](../ai-dev/index.md) — Gunakan AI untuk membantu mengembangkan Plugin NocoBase
- [Keamanan & Audit](./security) — Metode autentikasi, kontrol Permission, dan audit operasi
- [Karyawan AI](../ai-employees/index.md) — Kemampuan Agent NocoBase, mendukung kolaborasi dan eksekusi operasi di antarmuka bisnis
