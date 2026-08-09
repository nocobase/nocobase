---
title: "Membangun Bersama AI Agent"
description: "Gerakkan AI Agent menulis halaman frontend AI Portal dengan bahasa natural, termasuk cara menulis prompt, tips kolaborasi, dan cara menangani masalah yang sering muncul."
keywords: "AI Portal,AI Agent,pembangunan kolaboratif,prompt,nocobase-portal-manage,Skills"
---

# Membangun Bersama AI Agent

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah menjalankan Portal pertama Anda sesuai [Mulai Cepat AI Portal](./index.md).

:::

Pengembangan AI Portal sehari-hari pada dasarnya adalah berbicara dengan AI Agent — Anda mendeskripsikan halaman yang diinginkan, ia menulis kodenya, dan Anda melihat hasilnya di browser.

## Bekerja di Dalam Direktori Portal

Sebelum mulai, disarankan masuk dulu ke direktori source Portal, baru membuka AI Agent di sana. Dengan begitu Agent langsung berada dalam konteks yang tepat, dan dapat membaca `AGENTS.md` serta kode yang sudah ada.

Cari tahu dulu di mana direktorinya:

```bash
nb portal info main
```

Path pengembangan pada outputnya adalah lokasi source Portal berada. `cd` ke sana, lalu buka AI Agent Anda:

```bash
cd <direktori workspace pengembangan>
```

Setelah itu tinggal deskripsikan kebutuhan Anda:

```
Tolong tambahkan satu halaman daftar pesanan di main portal aplikasi nocobase saya
```

## Biarkan AI Membaca Dulu Sebelum Menulis

Di direktori root template ada satu `AGENTS.md` yang menjelaskan konvensi pengembangan proyek ini: utamakan menggunakan kembali implementasi yang sudah ada di `src/extensions`, kustomisasi komponen UI dengan komposisi alih-alih langsung mengubah komponen dasarnya, dan jangan memasukkan Ant Design. AI Agent yang mendukung pembacaan file ini akan otomatis mengikuti konvensi tersebut.

Anda juga dapat menambahkan konvensi proyek Anda sendiri ke `AGENTS.md`, misalnya kebiasaan penamaan, terminologi bisnis, atau direktori mana yang jangan disentuh. Setelah tertulis di sana, konvensi itu berlaku di setiap percakapan, sehingga Anda tidak perlu mengulanginya terus.

Di bawah `src/extensions` ada beberapa ekstensi bawaan, dan salah satunya, `nocobase-users-example`, adalah halaman CRUD yang lengkap dengan tampilan daftar, buat, edit, dan detail. Meminta AI menulis halaman baru dengan mengacu padanya jauh lebih hemat tenaga daripada mendeskripsikan dari nol:

```
Mengacu pada cara penulisan nocobase-users-example, buatkan satu halaman manajemen produk
```

## Contoh Prompt

### Skenario A: Membuat Halaman Bisnis Baru

Cukup jelaskan tiga hal ini — apa isi halamannya, datanya dari mana, dan bagaimana interaksinya:

```
Tambahkan satu halaman manajemen pelanggan:
tabel menampilkan nama, telepon, email, waktu pembuatan, mendukung pencarian berdasarkan nama,
klik salah satu baris membuka drawer detail, dan di dalam drawer record dapat langsung diedit lalu disimpan
```

<!-- 需要一张 AI 生成的客户管理页面效果截图，展示表格、搜索框和详情抽屉 -->

### Skenario B: Mengubah Halaman yang Sudah Ada

Untuk kebutuhan yang sifatnya perubahan, sebutkan secara spesifik bagian yang ingin diubah, tanpa perlu mendeskripsikan ulang seluruh halaman:

```
Tambahkan filter status pada daftar pelanggan,
dengan pilihan "Sedang ditindaklanjuti", "Berhasil", dan "Hilang", secara default tidak difilter
```

<!-- 需要一张添加状态筛选后的页面截图 -->

### Skenario C: Menghubungkan Tabel Data Baru

Setelah tabel data dibuat, minta AI menghasilkan halaman yang sesuai. Ia akan membaca definisi Field, lalu menentukan kontrol formulir dan Field daftar berdasarkan itu:

```
Saya baru saja membuat tabel contracts, tolong buatkan satu set halaman CRUD yang sesuai
```

Jika tabelnya belum dibuat, Anda dapat menggunakan [Pemodelan Data](../data-modeling.md) terlebih dahulu agar AI merancang struktur datanya, baru kembali membuat halaman.

<!-- 需要一张根据数据表自动生成的增删改查页面截图 -->

### Skenario D: Meniru UI dari Prototipe

Ketika Anda punya file desain atau prototipe HTML yang sudah jadi, berikan langsung kepada AI:

```
Buatkan halaman beranda sesuai gambar prototipe ini,
pertahankan warna dan layout-nya, dan hubungkan datanya ke tabel orders
```

<!-- 需要一个视频，展示给出原型图后 AI 复刻出页面的过程 -->

### Skenario E: Menambahkan Metode Autentikasi

Setelah suatu metode autentikasi diaktifkan di sisi server, halaman login perlu dukungan frontend yang sesuai:

```
Login DingTalk sudah diaktifkan di NocoBase, tolong tambahkan tombol login DingTalk di halaman login
```

<!-- 需要一张登录页出现第三方登录按钮的截图 -->

## Tips Kolaborasi

**Iterasi dalam langkah kecil.** Minta AI mengerjakan satu halaman atau satu perubahan dalam satu waktu, lihat hasilnya, baru lanjut. Jika Anda mendeskripsikan lima halaman sekaligus, akan sulit menentukan langkah mana yang melenceng ketika ada masalah.

**Biarkan server pengembangan tetap menyala.** Setelah `nb portal dev main` berjalan, hot reload aktif, sehingga setiap kali AI selesai mengubah sesuatu Anda langsung melihat hasilnya — inilah siklus umpan balik yang paling singkat.

**Berikan pesan error yang jelas.** Halaman putih, build gagal, antarmuka mengembalikan 403 — tempelkan pesan error lengkap dan tangkapan layarnya kepada AI, jangan biarkan AI menebak sendiri, biasanya beberapa putaran percakapan sudah cukup untuk menyelesaikannya. Anda tidak perlu lebih dulu menentukan sendiri masalahnya ada di lapisan mana.

![error](https://static-docs.nocobase.com/20260803204308.png)

## Pertanyaan Umum

**Bagaimana mengembalikan perubahan saat AI salah?**

Jika source Portal dikelola dengan Git, cukup `git checkout` untuk mengembalikannya. Saat memakai source storage `nocobase` yang default, Anda dapat menarik ulang satu salinan dari source storage untuk menimpa yang lokal:

```bash
nb portal pull main --force
```

`--force` akan menghapus workspace pengembangan lalu menariknya ulang, jadi pastikan tidak ada perubahan yang ingin dipertahankan sebelum menjalankannya. Untuk menghindari pilihan sulit semacam ini, disarankan segera memindahkan source ke pengelolaan Git, caranya lihat [Deployment dan Manajemen Source](./deploy.md).

**Bagaimana menelusuri penyebab build yang gagal?**

Jalankan dulu build secara lokal untuk melihat pesan error lengkapnya:

```bash
nb portal deploy main
```

Error tipe TypeScript dan dependensi yang hilang adalah dua penyebab paling umum, cukup tempelkan pesan errornya ke AI dan minta ia memperbaikinya.

**Apakah perubahan kode manual dan perubahan oleh AI akan berkonflik?**

Tidak. Source Portal hanyalah proyek frontend biasa, Anda dapat mengubahnya sendiri kapan saja, dan juga dapat membiarkan AI melanjutkannya. Selama tidak mengubah file yang sama pada saat yang bersamaan, tidak akan ada masalah.

## Tautan Terkait

- [Mulai Cepat AI Portal](./index.md) — Jalankan entry frontend pertama yang ditulis AI
- [Deployment dan Manajemen Source](./deploy.md) — Memasukkan source Portal ke Git, serta alur deployment
- [Struktur Proyek dan Tech Stack](./project-structure.md) — Konvensi direktori template, membantu Anda menilai apakah tulisan AI sudah benar
- [Komponen Standar dan Ekstensi](./components.md) — Fondasi komponen shadcn/ui dan mekanisme ekstensi
- [Pemodelan Data](../data-modeling.md) — Minta AI merancang tabel datanya dulu sebelum membuat halaman
- [`nb portal info`](../../api/cli/portal/info.md) — Melihat lokasi workspace pengembangan Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — Menarik ulang source dari source storage
