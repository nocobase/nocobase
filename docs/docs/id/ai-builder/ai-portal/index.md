---
title: "Mulai Cepat AI Portal"
description: "Pembangunan AI Portal adalah membiarkan AI Agent menulis kode sistem bisnis, dengan NocoBase menyediakan autentikasi, database, API, dan Permission sebagai fondasi. Kodenya ditulis di dalam entry aplikasi bernama AI Portal."
keywords: "Pembangunan AI Portal,Pembangunan AI,AI Portal,NocoBase AI,fondasi NocoBase,pengembangan frontend,React,shadcn/ui,AI Agent,mulai cepat"
---

# Mulai Cepat AI Portal

Kami menemukan bahwa AI vibe coding mungkin dapat menghasilkan halaman yang enak dilihat, tetapi tidak mudah menyambungkannya ke sistem bisnis yang sesungguhnya, atau justru harus mengimplementasikan ulang autentikasi, Permission, dan desain tabel data sebuah sistem dari nol.

NocoBase, sebagai platform low-code/no-code, sudah menyediakan implementasi kemampuan dasar tersebut. Anda dapat menganggapnya sebagai fondasi kernel sistem, membiarkan AI Agent fokus menulis logika bisnis, sementara NocoBase yang menyediakan infrastruktur autentikasi, database, API, dan Permission yang andal.

Untuk itu, kami menyediakan sebuah entry akses bernama **AI Portal**, sourcenya dapat disimpan secara lokal dan khusus disediakan bagi AI Agent untuk menulis kode. Kode yang ditulis AI Agent di entry ini dapat langsung mengakses kemampuan dasar yang disediakan NocoBase, dan halaman hasil build-nya dapat langsung diakses.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

## Kemampuan yang Disediakan NocoBase

Saat menulis sebuah sistem bisnis, yang benar-benar menyita waktu sering kali bukan halamannya, melainkan hal-hal di balik halaman itu — login Pengguna, validasi Permission, desain tabel data, antarmuka CRUD, unggah dan unduh file, dan sebagainya. Semua ini dibutuhkan setiap sistem, dan mengerjakannya dari nol setiap kali jelas tidak sepadan.

Semua kemampuan tersebut sudah disediakan NocoBase:

- **Sistem autentikasi** — Login dengan akun dan password siap pakai. OIDC, SAML, CAS, LDAP, SMS, DingTalk, WeCom, dan cara lainnya cukup diaktifkan di sisi server, frontend tinggal menyambungkannya
- **Database dan multi data source** — Manajemen tabel data bawaan, sekaligus dapat terhubung ke data source eksternal seperti MySQL dan PostgreSQL
- **REST API** — Begitu tabel data dibuat, antarmuka CRUD-nya otomatis tersedia, mendukung filter, sorting, pagination, dan Field relasi
- **Kontrol Permission** — ACL berbasis role, dapat sedetail level Field dan record, dan frontend dapat langsung membaca Permission Pengguna saat ini untuk menentukan apa yang ditampilkan
- **Workflow** — Otomatisasi proses bisnis, dipicu dari frontend atau dipicu oleh perubahan data
- **Penyimpanan file** — Unggah dan unduh

![AI Portal Template](https://static-docs.nocobase.com/20260803161414.png)

Berdasarkan kemampuan di atas, kami membungkus [kode template sistem](https://github.com/nocobase/portal-template-default) standar, yang cukup disalin AI Agent untuk menjalankan sebuah aplikasi dasar. Bersamaan dengan itu, NocoBase menyediakan serangkaian kemampuan skill seperti [Pemodelan Data](../data-modeling.md) dan [Konfigurasi Permission](../acl.md), sehingga setelah Anda mendeskripsikan kebutuhan bisnis, AI Agent tidak hanya menghasilkan halaman frontend, tetapi juga dapat membuatkan tabel data, mengonfigurasi Permission, dan operasi lainnya, sehingga terbentuk sebuah sistem bisnis yang lengkap.

## Prasyarat

- NocoBase >= 3.0.0-alpha.6
- Node.js >= 22
- [pnpm](https://pnpm.io/installation) — template Portal memakainya untuk memasang dependensi dan menjalankan server pengembangan
- Sudah memasang `nocobase cli` versi alpha (**perhatian: untuk saat ini hanya versi alpha yang didukung**)
  - `npm install -g @nocobase/cli@alpha`
  - Serta aplikasi NocoBase yang sudah diinisialisasi melalui `nb init --ui`, selengkapnya lihat [Panduan Integrasi AI Agent](../../ai/quick-start.md)
- Sebuah AI Agent, misalnya Claude Code, Codex, atau Cursor

## Langkah Pertama: Pastikan Anda Sudah Memiliki AI Portal

Pastikan dulu `main` yang default memang ada:

```bash
nb portal list
```

![nb portal list](https://static-docs.nocobase.com/20260803163517.png)

Outputnya akan menampilkan nama Portal, URL akses, tipe Portal, source storage, path pengembangan, status aktif, dan status default.

Setelah source ditarik, Anda juga dapat melihat lebih detail dengan `info`, misalnya di mana letak path pengembangan dan path deployment:

```bash
nb portal info main
```

## Langkah Kedua: Memulai Mode Pengembangan

```bash
# Tarik source portal
nb portal pull main
# Jalankan server pengembangan source
nb portal dev main
```

Server pengembangan secara default berjalan di `http://localhost:5173`.

Template ini sudah dilengkapi satu halaman manajemen pengguna berbasis tabel data `users` NocoBase, Anda dapat langsung login untuk melihat hasilnya — halaman ini sekaligus menjadi contoh awal yang bagus untuk dijadikan acuan AI.

![portal dev home page](https://static-docs.nocobase.com/20260802220652.png)

## Langkah Ketiga: Minta AI Mengubah Sebuah Halaman

Masuk ke workspace pengembangan Portal (`pull` secara default menariknya ke `./main`, kalau ragu gunakan `nb portal info main` untuk melihat path pengembangan), buka AI Agent di sana, misalnya Claude Code, Codex, atau Cursor, lalu masukkan prompt:

```
Tambahkan satu halaman manajemen pelanggan,
berisi daftar pelanggan, pencarian berdasarkan nama, dan klik salah satu baris membuka drawer detail
```

<!-- 需要一个视频，展示从输入提示词到 AI 完成页面编写、开发服务热更新出效果的完整过程 -->

AI akan membaca halaman dan ekstensi yang sudah ada, menulis halaman baru mengikuti konvensi template, lalu Anda dapat melihat hasilnya di `http://localhost:5173`.

Untuk mempelajari cara berkolaborasi secara efektif dengan AI Agent, silakan lihat [Membangun Bersama AI Agent](./agent-workflow.md).

## Langkah Keempat: Deployment

Setelah perubahan lokal beres, dorong source ke remote, lalu build dan deploy:

```bash
nb portal push main --message "Add customer management page"
nb portal deploy main
```

Ke mana `push` mendorong source bergantung pada konfigurasi source storage Portal ini. Defaultnya adalah `nocobase`, dengan source dikelola NocoBase; jika Anda mengaturnya menjadi `git` dengan [`nb portal config`](../../api/cli/portal/config.md), `push` akan meng-commit dan mendorong source ke repositori Git yang Anda tentukan, dan `--message` akan menjadi Git commit message. Selengkapnya lihat [Deployment dan Manajemen Source](./deploy.md#source-storage).

Setelah deployment selesai, akses `/x/main/` dan Anda akan melihat perubahan yang tadi dibuat.

Sampai di sini satu siklus utuh sudah berjalan — mendeskripsikan kebutuhan, AI menulis kode, melihat hasilnya secara lokal, lalu push dan deploy.

## Ketika Anda Membutuhkan Lebih Banyak Entry

Satu aplikasi dapat memiliki beberapa Portal. Misalnya satu untuk karyawan internal dan satu lagi untuk pelanggan eksternal, halaman dan Permission kedua entry sepenuhnya terpisah, tetapi berbagi satu set data yang sama:

```bash
nb portal create customer
```

Saat dibuat, `./customer` akan dihasilkan di direktori saat ini sebagai workspace pengembangan, dan Anda juga dapat menentukan lokasi lain dengan `--path`. Portal yang baru dibuat sama-sama dikembangkan melalui `nb portal dev` dan di-deploy melalui `nb portal deploy`, cukup masuk ke workspace-nya lalu buka AI Agent. Penjelasan detailnya lihat [Deployment dan Manajemen Source](./deploy.md).

## Mencoba Demo

Jika Anda ingin merasakan hasil pembangunan AI Portal, Anda dapat mengajukan lingkungan Demo di https://demo.nocobase.com/new. Setelah formulir diisi, kami akan menghasilkan lingkungan Demo khusus untuk Anda — di dalamnya berisi beberapa aplikasi AI Portal yang dibangun di atas fondasi NocoBase.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

Kemudian Anda tinggal memilih satu AI Portal untuk diakses:

![AI Portal CRM](https://static-docs.nocobase.com/20260803154700.png)

Kami juga menyediakan prompt di halaman sambutan Portal, agar AI Agent Anda dapat langsung terhubung ke aplikasi AI Portal ini, menarik kode aplikasi, lalu menjalankan server pengembangan secara lokal, mengubah halaman, dan akhirnya push serta deploy kembali ke lingkungan Demo. Setelah deployment berhasil, cukup refresh halamannya untuk melihat hasilnya.

## Selanjutnya

- [Membangun Bersama AI Agent](./agent-workflow.md) — Cara menulis prompt, dan cara mengembalikan perubahan saat AI salah
- [Struktur Proyek dan Tech Stack](./project-structure.md) — Konvensi direktori template dan perintah yang sering dipakai
- [Deployment dan Manajemen Source](./deploy.md) — Memasukkan source Portal ke Git, serta deployment multi-lingkungan

## Tautan Terkait

- [Membangun Bersama AI Agent](./agent-workflow.md) — Gerakkan AI menulis halaman Portal dengan bahasa natural
- [Struktur Proyek dan Tech Stack](./project-structure.md) — Konvensi direktori template dan perintah yang sering dipakai
- [Komponen Standar dan Ekstensi](./components.md) — Fondasi komponen shadcn/ui dan mekanisme ekstensi
- [Deployment dan Manajemen Source](./deploy.md) — Alur lengkap pengembangan, push, dan deployment
- [Panduan Integrasi AI Agent](../../ai/quick-start.md) — Memasang NocoBase CLI dan menyelesaikan inisialisasi
- [Mulai Cepat Pembangunan AI](../index.md) — Cara pembangunan lain yang tanpa menulis kode
- [Kontrol Versi](../version-control.md) — Snapshot versi untuk pembangunan no-code
- [Referensi Perintah `nb portal`](../../api/cli/portal/index.md) — Penjelasan parameter lengkap untuk semua perintah Portal
