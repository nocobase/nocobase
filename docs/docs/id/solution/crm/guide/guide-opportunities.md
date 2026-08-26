---
title: "Peluang dan Penawaran"
description: "Panduan penggunaan manajemen Peluang CRM: tampilan kanban, peningkatan tahap, pembuatan Penawaran, dukungan multi-mata uang, alur persetujuan."
keywords: "Manajemen Peluang,Sales Funnel,Kanban,Persetujuan Penawaran,Multi-mata uang,NocoBase CRM"
---

# Peluang dan Penawaran

> Peluang adalah inti dari seluruh alur penjualan — mewakili sebuah transaksi yang berpotensi closing. Pada bab ini, Anda akan belajar bagaimana mendorong tahap Peluang dengan kanban, membuat Penawaran, melalui alur persetujuan, dan akhirnya mengubah Penawaran menjadi Pesanan resmi.

![cn_02-opportunities](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_02-opportunities.png)

## Ikhtisar Halaman Peluang

Dari menu kiri masuk ke **Sales → Opportunities**, Anda akan melihat dua tab di bagian atas halaman:

- **Pipeline Kanban**: Menampilkan semua Peluang dalam bentuk kanban berdasarkan tahap, cocok untuk follow-up harian dan peningkatan cepat.
- **Tampilan Tabel**: Menampilkan Peluang dalam bentuk list, cocok untuk filter batch dan ekspor data.

Defaultnya membuka Pipeline Kanban — ini juga merupakan tampilan yang paling sering digunakan oleh tenaga penjualan.

![02-opportunities-2026-04-07-00-56-47](https://static-docs.nocobase.com/02-opportunities-2026-04-07-00-56-47.png)

## Pipeline Kanban

### Filter Bar

Bagian atas kanban memiliki barisan tombol filter, membantu Anda dengan cepat memfokuskan ke rentang Peluang yang berbeda:

| Tombol | Fungsi |
|------|------|
| **All Pipeline** | Tampilkan semua Peluang yang sedang berjalan |
| **My Deals** | Hanya melihat Peluang yang ditugaskan kepada Anda |
| **Big Deals** | Transaksi besar dengan nilai ≥ $50K |
| **Closing Soon** | Peluang yang diperkirakan closing dalam 30 hari |

Filter bar juga berisi **2 card statistik** — Open Deals (jumlah Peluang sedang berjalan) dan Pipeline Value (total nilai pipeline), serta **search box real-time**, ketik nama Peluang, nama Pelanggan, atau penanggung jawab untuk dengan cepat menemukannya.

:::tip
Tombol filter ini menggunakan kemampuan cross-block linkage NocoBase (`initResource` + `addFilterGroup`), yang dapat memfilter data di kanban secara real-time, tanpa perlu refresh halaman.
:::

![02-opportunities-2026-04-07-01-00-37](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-00-37.gif)

### Kolom Kanban

Kanban dibagi menjadi **6 kolom**, sesuai dengan 6 tahap Peluang:

```
Prospecting → Analysis → Proposal → Negotiation → Won → Lost
  Kontak Awal   Analisis    Pengajuan   Negosiasi   Menang  Kalah
                Kebutuhan   Proposal    Bisnis
```

Header setiap kolom menampilkan: nama tahap, jumlah Peluang pada tahap tersebut, total nilai, serta tombol "+" untuk tambah cepat.

Setiap card menampilkan informasi berikut:

- **Nama Peluang**: Misalnya "Proyek ERP Perusahaan Tech XYZ"
- **Nama Pelanggan**: Perusahaan Pelanggan terkait
- **Jumlah yang Diharapkan**: Seperti $50K
- **Probabilitas Menang**: Ditampilkan dengan tag berwarna (hijau = probabilitas tinggi, kuning = sedang, merah = rendah)
- **Avatar Penanggung Jawab**: Siapa yang melakukan follow-up Peluang ini

### Drag untuk Mendorong Tahap

Cara operasi paling intuitif: **langsung drag card dari satu kolom ke kolom lain**, sistem akan otomatis update tahap Peluang.

Misalnya, ketika Anda telah menyelesaikan analisis kebutuhan dan siap mengajukan proposal, drag card dari Analysis ke Proposal.

![02-opportunities-2026-04-07-01-02-09](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-02-09.gif)

## Tampilan Tabel

Beralih ke tab tampilan tabel, Anda akan melihat tabel data standar.

### Tombol Filter

Di atas tabel juga ada satu set tombol filter, termasuk:

- **All**: Semua Peluang
- **In Pipeline**: Peluang yang sedang berjalan (kecuali sudah closing dan kalah)
- **Closing Soon**: Akan segera closing
- **Won**: Sudah menang
- **Lost**: Sudah kalah

Setiap tombol membawa **statistik jumlah** di belakangnya, membuat Anda dapat melihat distribusi Peluang berdasarkan status sekilas.

Bagian bawah tabel memiliki **baris ringkasan**: menampilkan total jumlah Peluang yang dipilih/semua, dan tag distribusi tahap, memudahkan untuk dengan cepat memahami situasi keseluruhan.

### Lihat Detail

Klik baris apa pun di tabel, akan muncul popup detail Peluang — ini adalah antarmuka utama untuk mengelola satu Peluang.

![02-opportunities-2026-04-07-01-05-05](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-05.png)

## Detail Peluang

Popup detail Peluang adalah antarmuka dengan informasi paling padat, dari atas ke bawah berisi modul berikut:

![02-opportunities-2026-04-07-01-05-42](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-42.png)


### Bar Alur Tahap

Bagian atas detail memiliki **bar tahap interaktif** (komponen Steps), dengan jelas menampilkan tahap di mana Peluang saat ini berada.

Anda dapat **langsung klik tahap pada bar tahap** untuk mendorong Peluang. Saat Anda klik **Won** atau **Lost**, sistem akan memunculkan dialog konfirmasi, karena keduanya adalah operasi status terminal, sekali dikonfirmasi tidak dapat dibatalkan dengan mudah.

![02-opportunities-2026-04-07-01-06-54](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-06-54.gif)

### Indikator Kunci

Di bawah bar tahap menampilkan empat indikator inti:

| Indikator | Deskripsi |
|------|------|
| **Jumlah yang Diharapkan** | Estimasi jumlah closing untuk Peluang ini |
| **Tanggal Closing yang Diharapkan** | Kapan direncanakan untuk closing |
| **Hari pada Tahap Saat Ini** | Sudah berapa lama berada di tahap saat ini (untuk mengidentifikasi Peluang yang stagnan) |
| **Probabilitas Menang AI** | Probabilitas closing yang dihitung sistem berdasarkan data multi-dimensi |

### Analisis Risiko AI

Ini adalah salah satu fitur unggulan CRM. Sistem akan otomatis menganalisis kondisi kesehatan Peluang, menampilkan:

- **Cincin Probabilitas Menang**: Donut chart intuitif yang menampilkan probabilitas closing
- **Daftar Faktor Risiko**: Seperti "Sudah lebih dari 14 hari sejak kontak terakhir dengan Pelanggan", "Penawaran kompetitor lebih rendah", dll.
- **Rekomendasi Action**: Saran langkah berikutnya yang diberikan AI, seperti "Atur demo Produk"


### Daftar Penawaran
![02-opportunities-2026-04-07-01-16-19](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-16-19.png)
Bagian tengah detail menampilkan **semua Penawaran yang terkait dengan Peluang ini**, dalam bentuk sub-tabel. Setiap baris menampilkan nomor Penawaran, jumlah, status, dll., status persetujuan ditampilkan dengan tag visual (Draft, Sedang Disetujui, Disetujui, Ditolak).

### Komentar dan Lampiran

Sisi kanan detail adalah area komentar dan area lampiran, anggota tim dapat berkomunikasi tentang progress dan upload file terkait di sini.
![02-opportunities-2026-04-07-01-17-01](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-17-01.png)

## Membuat Penawaran

Siap memberikan Penawaran kepada Pelanggan? Alur operasinya sebagai berikut:

**Langkah 1**: Buka detail Peluang, temukan area daftar Penawaran.

**Langkah 2**: Klik tombol **Add new** (Tambah Baru), sistem akan memunculkan form Penawaran.

**Langkah 3**: Isi informasi dasar Penawaran, termasuk nama Penawaran, masa berlaku, dll.

**Langkah 4**: Tambahkan item baris Penawaran pada **sub-tabel detail Produk**:

| Field | Deskripsi |
|------|------|
| **Produk** | Pilih dari katalog Produk |
| **Spesifikasi** | Read-only, otomatis terisi setelah memilih Produk |
| **Satuan** | Read-only, otomatis terisi |
| **Jumlah** | Jumlah Penawaran |
| **Harga Daftar** | Read-only, harga di katalog Produk |
| **Harga Satuan** | Read-only, otomatis cocok harga bertingkat berdasarkan jumlah |
| **Persentase Diskon** | Read-only, diskon dari harga bertingkat |
| **Total Baris** | Otomatis dihitung |

Sistem akan otomatis menyelesaikan rantai perhitungan jumlah: subtotal → diskon → pajak → pengiriman → total → ekuivalen USD. Form berisi JS Block tip yang menampilkan aturan auto-fill dan formula perhitungan.

**Langkah 5**: Jika Pelanggan menggunakan mata uang non-USD untuk transaksi, pilih mata uang yang sesuai. Sistem akan **mengunci nilai tukar saat ini** saat pembuatan, dan otomatis mengkonversi ke jumlah ekuivalen USD, memastikan rekonsiliasi selanjutnya tidak terpengaruh fluktuasi nilai tukar.

**Langkah 6**: Setelah memastikan informasi benar, klik submit untuk menyimpan Penawaran. Saat ini status Penawaran adalah **Draft**.

![02-opportunities-2026-04-07-01-09-11](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-11.gif)

## Alur Persetujuan Penawaran

Penawaran yang dibuat tidak akan langsung berlaku — perlu melalui alur persetujuan, untuk memastikan Penawaran wajar dan diskon dalam batas otorisasi.

### Ikhtisar Alur Persetujuan

```
Draft → Pending Approval → Manager Review → Approved / Rejected / Returned
```

![02-opportunities-2026-04-07-01-09-38](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-38.png)

### Submit untuk Persetujuan

**Langkah 1**: Pada detail Peluang, temukan Penawaran dengan status Draft, klik tombol **Submit for Approval**.

:::note
Tombol ini **hanya terlihat saat status Penawaran adalah Draft**. Penawaran yang sudah disubmit atau disetujui tidak akan menampilkan tombol ini.
:::

**Langkah 2**: Sistem otomatis update status Penawaran menjadi **Pending Approval**, dan memicu Workflow persetujuan.

**Langkah 3**: Manajer persetujuan yang ditunjuk akan menerima notifikasi tugas persetujuan di sistem.

![02-opportunities-2026-04-07-01-12-20](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-12-20.png)

### Persetujuan Manajer

Setelah manajer persetujuan membuka tugas persetujuan, akan melihat konten berikut:

**Card Persetujuan**: Menampilkan informasi kunci Penawaran — nomor Penawaran, nama, jumlah (mata uang lokal + ekuivalen USD), status saat ini.

**Detail Persetujuan**: Menampilkan konten Penawaran secara lengkap dalam bentuk read-only, termasuk:
- Informasi dasar (nama Penawaran, masa berlaku, mata uang)
- Asosiasi Pelanggan dan Peluang
- Sub-tabel detail Produk (Produk, jumlah, harga satuan, diskon, subtotal)
- Total jumlah
- Syarat dan catatan

**Tombol Action**: Manajer persetujuan dapat melakukan operasi berikut:

| Operasi | Efek |
|------|------|
| **Approve** | Status Penawaran menjadi Approved |
| **Reject** | Status Penawaran menjadi Rejected, perlu memberikan alasan |
| **Return** | Penawaran dikembalikan ke pembuat untuk dimodifikasi, status kembali ke Draft |
| **Add Approver** | Tambahkan satu approver |
| **Transfer** | Transfer tugas persetujuan ke orang lain untuk diproses |

![02-opportunities-2026-04-07-01-13-04](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-04.png)

### Pemrosesan Hasil Persetujuan

- **Approved**: Status Penawaran menjadi Approved, dapat masuk ke langkah berikutnya — diubah menjadi Pesanan resmi.
- **Rejected / Returned**: Status Penawaran kembali ke Draft, pembuat dapat memodifikasi lalu submit ulang persetujuan.

![02-opportunities-2026-04-07-01-13-25](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-25.png)

## Konversi Penawaran ke Pesanan

Saat status Penawaran adalah **Approved**, Anda akan melihat tombol **New Order** di area operasi Penawaran.

:::note
Tombol ini **hanya terlihat saat status Penawaran adalah Approved**. Penawaran Draft atau yang sedang dalam persetujuan tidak akan menampilkan tombol ini.
:::

Klik **New Order**, sistem akan otomatis membuat draft Pesanan berdasarkan data Penawaran, termasuk detail Produk, jumlah, informasi Pelanggan, dll., menghemat pekerjaan input ulang.

![02-opportunities-2026-04-07-01-14-41](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-14-41.png)

---

Setelah Penawaran melewati persetujuan, dapat diubah menjadi Pesanan resmi. Selanjutnya, lihat [Manajemen Pesanan](./guide-products-orders) untuk mempelajari alur Pesanan selanjutnya.

## Halaman Terkait

- [Panduan Penggunaan CRM](./index.md)
- [Manajemen Lead](./guide-leads)
- [Manajemen Pesanan](./guide-products-orders)
