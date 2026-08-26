# Tutorial Pemula NocoBase 2.0

Tutorial ini akan membawa Anda dari nol untuk membangun **Sistem Tiket IT (HelpDesk) yang sangat sederhana** menggunakan NocoBase 2.0. Seluruh sistem hanya membutuhkan **2 tabel data**, tanpa menulis satu baris kode pun, untuk merealisasikan pengiriman tiket, manajemen kategori, pelacakan perubahan, kontrol izin, dan dashboard data.

## Posisi Tutorial

- **Target Pembaca**: Personel bisnis, personel teknis, atau siapa saja yang tertarik dengan NocoBase (disarankan memiliki pengetahuan dasar komputer)
- **Proyek Studi Kasus**: Sistem Tiket IT (HelpDesk) yang sangat sederhana, hanya 2 tabel
- **Estimasi Waktu**: 2-3 jam (non-teknis), 1-1.5 jam (teknis)
- **Prasyarat**: Lingkungan Docker atau [Demo Online](https://demo-cn.nocobase.com/new) (berlaku 24 jam, tanpa instalasi)
- **Versi**: NocoBase 2.0

## Apa yang Akan Anda Pelajari

Melalui 7 bab praktik, Anda akan menguasai konsep inti dan alur pembuatan NocoBase:

| # | Bab | Poin Utama |
|---|------|------|
| 1 | [Mengenal NocoBase — Berjalan dalam 5 Menit](./01-getting-started) | Instalasi Docker, mode konfigurasi vs mode penggunaan |
| 2 | [Pemodelan Data — Membangun Kerangka Sistem Tiket](./02-data-modeling) | Collection/Field, hubungan asosiasi |
| 3 | [Membangun Halaman — Membuat Data Terlihat](./03-building-pages) | Block, Block Tabel, filter dan sorting |
| 4 | [Form dan Detail — Membuat Data Bisa Diinput](./04-forms-and-details) | Block Form, linkage field, riwayat record |
| 5 | [Pengguna dan Izin — Siapa Bisa Melihat Apa](./05-roles-and-permissions) | Role, izin menu, izin data |
| 6 | [Workflow — Membuat Sistem Bergerak Sendiri](./06-workflows) | Notifikasi otomatis, trigger perubahan status |
| 7 | [Dashboard — Melihat Keseluruhan Sekilas](./07-dashboard) | Pie chart/Line chart/Bar chart, Block Markdown |

## Pratinjau Model Data

Tutorial ini berfokus pada model data yang sangat sederhana — hanya **2 tabel**, tetapi cukup untuk mencakup pemodelan data, pembangunan halaman, desain form, kontrol izin, Workflow, dashboard, dan fitur inti lainnya.

| Tabel Data | Field Utama |
|--------|---------|
| Tiket (tickets) | Judul, deskripsi, status, prioritas |
| Kategori Tiket (categories) | Nama kategori, warna |

## Pertanyaan yang Sering Diajukan

### Untuk Skenario Apa NocoBase Cocok?

Cocok untuk skenario yang membutuhkan kustomisasi fleksibel seperti tool internal perusahaan, sistem manajemen data, alur persetujuan, CRM, ERP, dan lainnya, mendukung deployment privat.

### Apa yang Dibutuhkan untuk Menyelesaikan Tutorial Ini?

Tidak perlu pemrograman, tetapi disarankan memiliki pengetahuan dasar komputer. Tutorial akan menjelaskan konsep tabel data, field, hubungan asosiasi secara bertahap. Pengalaman menggunakan database atau Excel akan memudahkan untuk memulai.

### Apakah Sistem dalam Tutorial Bisa Dikembangkan?

Bisa. Tutorial ini hanya menggunakan 2 tabel, tetapi NocoBase mendukung asosiasi multi-tabel kompleks, integrasi API eksternal, Plugin kustom, dan lainnya.

### Lingkungan Deployment Apa yang Dibutuhkan?

Direkomendasikan Docker (Docker Desktop atau server Linux), minimum 2 core 4GB memori. Mendukung juga eksekusi source code Git. Jika hanya untuk pengalaman belajar, Anda dapat langsung mengajukan [Demo Online](https://demo-cn.nocobase.com/new), tanpa instalasi, berlaku 24 jam.

### Apa Batasan Versi Gratis?

Fitur inti sepenuhnya gratis dan open source. Versi komersial menyediakan Plugin lanjutan tambahan dan dukungan teknis, lihat [Harga Versi Komersial](https://www.nocobase.com/cn/commercial).

## Tech Stack Terkait

NocoBase 2.0 dibangun berdasarkan teknologi berikut:

- **Frontend Framework**: React + [Ant Design](https://ant.design/) 5.0
- **Backend**: Node.js + Koa
- **Database**: PostgreSQL (juga mendukung [MySQL](/get-started/installation/docker), MariaDB)
- **Metode Deployment**: [Docker](/get-started/installation/docker), Kubernetes

## Referensi Platform Serupa

Jika Anda sedang mengevaluasi platform no-code/low-code, berikut adalah beberapa referensi perbandingan:

| Platform | Karakteristik | Perbedaan dengan NocoBase |
|------|------|-------------------|
| [Appsmith](https://www.appsmith.com/) | No-code open source, kemampuan kustomisasi frontend yang kuat | NocoBase lebih fokus pada model data driven |
| [Retool](https://retool.com/) | Platform tool internal | NocoBase sepenuhnya open source, tanpa batasan penggunaan |
| [Airtable](https://airtable.com/) | Database kolaborasi online | NocoBase mendukung deployment privat, data otonom |
| [Budibase](https://budibase.com/) | Low-code open source, mendukung self-hosting | Arsitektur Plugin NocoBase, ekstensibilitas lebih kuat |

## Dokumentasi Terkait

### Panduan Pemula
- [Cara Kerja NocoBase](/get-started/how-nocobase-works) — Pengenalan konsep inti
- [Mulai Cepat](/get-started/quickstart) — Instalasi dan konfigurasi awal
- [Persyaratan Sistem](/get-started/system-requirements) — Persyaratan konfigurasi lingkungan

### Tutorial Lainnya
- [Tutorial NocoBase 1.x](/tutorials/v1/index.md) — Tutorial lanjutan dengan studi kasus sistem manajemen tugas

### Referensi Solusi
- [Solusi Sistem Tiket](/solution/ticket-system/index.md) — Solusi manajemen tiket cerdas berbasis AI
- [Solusi Sistem CRM](/solution/crm/index.md) — Basis manajemen hubungan pelanggan
- [AI Employee](/ai-employees/quick-start) — Mengintegrasikan kemampuan AI ke sistem

Siap? Mari mulai dari [Bab 1: Mengenal NocoBase](./01-getting-started)!
