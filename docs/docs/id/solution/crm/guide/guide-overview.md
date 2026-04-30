---
title: "Pengenalan Sistem dan Dashboard"
description: "Ikhtisar Sistem CRM 2.0: struktur menu, multi-bahasa dan tema, dashboard Analytics analisis data, workspace Overview."
keywords: "Pengenalan CRM,Dashboard,Analisis Data,KPI,NocoBase CRM"
---

# Pengenalan Sistem dan Dashboard

> Bab ini berfokus memperkenalkan dua dashboard — Analytics (Analisis Data) dan Overview (Workspace Harian).

## Ikhtisar Sistem

CRM 2.0 adalah sistem manajemen penjualan lengkap, mencakup seluruh alur dari akuisisi Lead hingga pengiriman Pesanan. Setelah login, menu bar atas adalah entry point navigasi utama Anda.


### Multi-bahasa dan Tema

Sistem mendukung pergantian multi-bahasa (pojok kanan atas), semua JS Block dan chart sudah diadaptasi multi-bahasa.

Untuk tema, baik tema terang dan gelap didukung, namun saat ini **direkomendasikan menggunakan tema terang + mode kompak**, dengan kepadatan informasi yang lebih tinggi, beberapa masalah tampilan pada tema gelap akan diperbaiki kemudian.

![00-overview-2026-04-01-23-38-28](https://static-docs.nocobase.com/00-overview-2026-04-01-23-38-28.png)

---

## Analytics — Pusat Analisis Data

Analytics adalah halaman pertama di menu bar, dan merupakan antarmuka pertama yang Anda lihat saat membuka sistem setiap hari.

### Filter Global

Bagian atas halaman memiliki filter bar, berisi dua kondisi filter: **rentang tanggal** dan **Owner**. Setelah memfilter, semua KPI card dan chart pada halaman akan refresh secara terkait.

![00-overview-2026-04-01-23-40-45](https://static-docs.nocobase.com/00-overview-2026-04-01-23-40-45.png)


### KPI Card

Di bawah filter bar terdapat 4 KPI card:

| Card | Arti | Aksi Klik |
|------|------|---------|
| **Total Pendapatan** | Total pendapatan kumulatif | Popup: Pie chart status pembayaran + tren pendapatan bulanan |
| **Lead Baru** | Jumlah Lead baru periode ini | Navigasi ke halaman Lead, otomatis filter status "New" |
| **Conversion Rate** | Rasio Lead hingga closing | Popup: Pie chart distribusi setiap tahap + bar chart jumlah |
| **Siklus Closing Rata-rata** | Rata-rata hari dari pembuatan hingga closing | Popup: Distribusi siklus + tren menang bulanan |

Setiap card **dapat diklik untuk drill-through** — popup menampilkan chart analisis yang lebih detail. Jika memiliki kemampuan modifikasi, dapat terus drill-down lebih lanjut (perusahaan → departemen → individu).

![00-overview-2026-04-01-23-42-33](https://static-docs.nocobase.com/00-overview-2026-04-01-23-42-33.gif)

:::tip[Data berkurang setelah navigasi?]
Saat klik dari KPI navigasi ke halaman list, URL akan membawa parameter filter (seperti `?status=new`). Jika Anda menemukan data list berkurang, itu karena parameter ini masih berlaku. Kembali ke dashboard lalu masuk lagi ke halaman list akan mengembalikan data lengkap.
:::

![00-overview-2026-04-01-23-44-19](https://static-docs.nocobase.com/00-overview-2026-04-01-23-44-19.png)


### Area Chart

Di bawah KPI terdapat 5 chart inti:

| Chart | Tipe | Deskripsi | Aksi Klik |
|------|------|------|---------|
| **Distribusi Tahap Peluang** | Bar Chart | Jumlah, nilai, probabilitas berbobot setiap tahap | Popup: Drill-through 3D berdasarkan Pelanggan/Owner/bulan |
| **Sales Funnel** | Funnel Chart | Konversi Lead → Opportunity → Quotation → Order | Klik navigasi ke halaman entitas terkait |
| **Tren Penjualan Bulanan** | Bar+Line | Pendapatan bulanan, jumlah Pesanan, rata-rata per Pesanan | Navigasi halaman Orders (dengan parameter bulan) |
| **Tren Pertumbuhan Pelanggan** | Bar+Line | Pelanggan baru bulanan, kumulatif Pelanggan | Navigasi halaman Customers |
| **Distribusi Industri** | Pie Chart | Distribusi Pelanggan berdasarkan industri | Navigasi halaman Customers |

![00-overview-2026-04-01-23-46-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-46-36.png)

#### Sales Funnel

Menampilkan conversion rate pipeline lengkap Lead → Opportunity → Quotation → Order. Setiap layer dapat diklik, navigasi ke halaman list entitas terkait (seperti klik layer Opportunity → navigasi ke list Peluang).

#### Tren Penjualan Bulanan

Bar chart menampilkan pendapatan setiap bulan, line chart menumpuk jumlah Pesanan dan rata-rata per Pesanan. Klik bar bulan tertentu → navigasi ke halaman Orders dan otomatis membawa filter waktu bulan tersebut (seperti `?month=2026-02`), langsung melihat detail Pesanan bulan tersebut.

#### Tren Pertumbuhan Pelanggan

Bar chart menampilkan jumlah Pelanggan baru setiap bulan, line chart menampilkan total kumulatif Pelanggan. Klik bar bulan tertentu → navigasi ke halaman Customers dan filter Pelanggan baru bulan tersebut.

#### Distribusi Industri

Pie chart menampilkan distribusi Pelanggan berdasarkan industri dan jumlah Pesanan terkait. Klik sektor industri tertentu → navigasi ke halaman Customers dan filter Pelanggan industri tersebut.

### Drill-through Tahap Peluang

Klik bar tahap pada distribusi tahap Peluang, akan muncul analisis mendalam tahap tersebut:

- **Tren Bulanan**: Perubahan bulanan Peluang pada tahap tersebut
- **Berdasarkan Owner**: Siapa yang melakukan follow-up Peluang ini
- **Berdasarkan Pelanggan**: Pelanggan mana yang Peluangnya berada di tahap tersebut
- **Ringkasan Bawah**: Centang Pelanggan untuk melihat jumlah kumulatif

![00-overview-2026-04-01-23-49-04](https://static-docs.nocobase.com/00-overview-2026-04-01-23-49-04.png)


Konten drill-through setiap tahap (Prospecting / Analysis / Proposal / Negotiation / Won / Lost) berbeda, mencerminkan fokus perhatian masing-masing tahap.

Pertanyaan inti yang dijawab chart ini adalah: **Pada tahap mana funnel kehilangan paling banyak?** Jika tahap Proposal menumpuk banyak Peluang tetapi sedikit yang masuk ke Negotiation, berarti mungkin ada masalah pada tahap Penawaran.

![00-overview-2026-04-01-23-48-21](https://static-docs.nocobase.com/00-overview-2026-04-01-23-48-21.gif)

### Konfigurasi Chart (Lanjutan)

Setiap chart memiliki tiga dimensi konfigurasi di belakangnya:

1. **Sumber Data SQL**: Menentukan data apa yang ditampilkan chart, dapat dijalankan dan diverifikasi di SQL builder
2. **Style Chart**: Konfigurasi JSON area kustom, mengontrol tampilan chart
3. **Event**: Perilaku saat klik (popup OpenView / navigasi halaman)

![00-overview-2026-04-01-23-51-00](https://static-docs.nocobase.com/00-overview-2026-04-01-23-51-00.png)


### Filter Linkage

Saat memodifikasi kondisi apa pun di filter bar atas, **semua KPI card dan chart pada halaman akan refresh secara bersamaan**, tanpa perlu mengatur satu per satu. Penggunaan tipikal:

- **Lihat performa seseorang**: Owner pilih "Pak Budi" → Data seluruh halaman beralih ke Lead, Peluang, Pesanan yang menjadi tanggung jawab Pak Budi
- **Bandingkan periode waktu**: Tanggal dari "bulan ini" ke "kuartal ini" → Rentang chart tren berubah secara sinkron

Linkage filter bar dan chart diimplementasikan melalui **page event flow** — sebelum render, variabel form diinjeksi, SQL chart mereferensikan nilai filter melalui variabel.

![00-overview-2026-04-01-23-52-29](https://static-docs.nocobase.com/00-overview-2026-04-01-23-52-29.png)

![00-overview-2026-04-01-23-53-57](https://static-docs.nocobase.com/00-overview-2026-04-01-23-53-57.png)
:::note
Template SQL saat ini hanya mendukung sintaks `if` untuk pernyataan kondisi. Disarankan merujuk ke template yang sudah ada di sistem, atau biarkan AI membantu memodifikasi.
:::

---

## Overview — Workspace Harian

Overview adalah halaman dashboard kedua, lebih berorientasi operasi harian daripada analisis data. Pertanyaan inti yang dijawab adalah: **Apa yang harus dilakukan hari ini? Lead mana yang layak di-follow up?**

![00-overview-2026-04-01-23-56-07](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-07.png)


### Lead Skor Tinggi

Otomatis filter Lead dengan skor AI ≥ 75 dan status New / Working (Top 5), setiap Lead menampilkan:

- **Dashboard Skor AI**: Meter bulat secara intuitif menampilkan kualitas Lead (hijau = skor tinggi = layak diprioritaskan untuk follow-up)
- **Rekomendasi Langkah Berikutnya AI**: Tindakan follow-up yang direkomendasikan sistem otomatis berdasarkan karakteristik Lead (seperti "Schedule a demo")
- **Informasi Dasar Lead**: Nama, perusahaan, sumber, waktu pembuatan

Klik nama Lead untuk navigasi ke detail, klik "View All" untuk navigasi ke halaman list Lead. Setiap pagi saat mulai kerja, lihat tabel ini, Anda akan tahu siapa yang harus diprioritaskan untuk dihubungi hari ini.

![00-overview-2026-04-01-23-56-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-36.png)

### Tugas Hari Ini

Daftar aktivitas hari ini (meeting, telepon, tugas, dll.), mendukung:

- **Tandai Selesai Satu Klik**: Klik "Done" untuk menandai tugas selesai, setelah selesai akan abu-abu
- **Reminder Lewat Tenggat**: Tugas overdue yang belum selesai akan disorot merah
- **Lihat Detail**: Klik nama tugas untuk masuk ke detail
- **Buat Tugas**: Buat record aktivitas baru langsung di sini

![00-overview-2026-04-01-23-57-09](https://static-docs.nocobase.com/00-overview-2026-04-01-23-57-09.png)

### Kalender Aktivitas

Tampilan kalender FullCalendar, dibedakan warna berdasarkan tipe aktivitas (meeting/telepon/tugas/email/note). Mendukung pergantian bulan/minggu/hari, dapat di-drag untuk mengubah jadwal, klik untuk lihat detail.

![00-overview-2026-04-01-23-58-02](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-02.gif)

---

## Dashboard Lainnya (More Charts)

Di menu masih ada tiga dashboard untuk Role yang berbeda, hanya untuk referensi, dapat disimpan atau disembunyikan sesuai kebutuhan:

| Dashboard | Pengguna Target | Karakteristik |
|--------|---------|------|
| **SalesManager** | Manajer Penjualan | Ranking tim, scatter plot risiko, target bulanan |
| **SalesRep** | Tenaga Penjualan | Data otomatis difilter berdasarkan user saat ini, hanya melihat performa sendiri |
| **Executive** | Eksekutif | Forecast pendapatan, kesehatan Pelanggan, tren Win/Loss |

![00-overview-2026-04-01-23-58-39](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-39.png)

Dashboard yang tidak diperlukan dapat disembunyikan di menu, tidak memengaruhi fungsi sistem.

![00-overview-2026-04-02-00-02-39](https://static-docs.nocobase.com/00-overview-2026-04-02-00-02-39.png)

---

## Drill-through KPI

Anda mungkin sudah memperhatikan, hampir setiap angka dan setiap chart yang diperkenalkan di atas dapat "diklik". Ini adalah pola interaksi paling inti di CRM — **Drill-through KPI**: Klik angka summary → Lihat data detail di balik angka tersebut.

Drill-through memiliki dua bentuk:

| Bentuk | Skenario yang Cocok | Contoh |
|------|---------|------|
| **Drill-through Popup** | Analisis perbandingan multi-dimensi | Klik "Total Pendapatan" → Popup menampilkan pie chart + tren |
| **Navigasi Halaman** | Lihat dan operasikan record detail | Klik "Lead Baru" → Navigasi ke list Leads |

**Contoh operasi**: Pada chart "Tren Penjualan Bulanan" di Analytics, Anda menemukan bar pendapatan Februari jelas rendah → Klik bar tersebut → Sistem navigasi ke halaman Orders dan otomatis membawa `month = 2026-02` → Anda langsung melihat semua detail Pesanan Februari, dapat menyelidiki lebih lanjut.

> Dashboard tidak hanya untuk "dilihat", melainkan pusat navigasi seluruh sistem. Setiap angka adalah entry point, memandu Anda dari makro ke mikro, layer demi layer menemukan akar masalah.

---

Setelah memahami gambaran umum sistem dan dashboard, selanjutnya masuk ke alur bisnis inti — mulai dari [Manajemen Lead](./guide-leads).

## Halaman Terkait

- [Panduan Penggunaan CRM](./index.md)
- [Manajemen Lead](./guide-leads)
- [AI Employee](./guide-ai)
