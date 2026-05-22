---
title: "Sistem Manajemen Bisnis Terintegrasi - Cara Instalasi"
description: "Instalasi dan deployment Sistem Manajemen Bisnis Terintegrasi: pemulihan dengan Backup Manager (versi Pro/Enterprise) atau impor file SQL (versi Community), membutuhkan PostgreSQL 16, DB_UNDERSCORED tidak boleh true."
keywords: "Sistem Manajemen Bisnis Terintegrasi instalasi, All-in-One, pemulihan backup, Backup Manager, impor SQL, PostgreSQL, NocoBase"
---

# Cara Instalasi

> Versi saat ini menggunakan bentuk **pemulihan backup** untuk deployment. Versi mendatang mungkin diganti menjadi bentuk **migrasi inkremental** agar solusi mudah diintegrasikan ke sistem NocoBase yang sudah Anda miliki.

Sistem Manajemen Bisnis Terintegrasi mencakup enam modul: **CRM (Manajemen Pelanggan), Manajemen Penjualan, Help Desk (Tiket), Manajemen Proyek, Manajemen Aset Tetap, dan Manajemen SDM**. Agar Anda dapat men-deploy solusi ini ke lingkungan NocoBase Anda sendiri dengan cepat dan mulus, kami menyediakan dua cara pemulihan; silakan pilih yang paling sesuai dengan versi pengguna dan latar belakang teknis Anda.

Sebelum memulai, pastikan:

- Anda sudah memiliki lingkungan NocoBase yang berjalan. Untuk instalasi sistem utama, silakan rujuk [dokumentasi instalasi resmi](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- Versi NocoBase **v2.1.0-alpha.34 ke atas**.
- Anda sudah mengunduh file solusi terintegrasi yang relevan:
  - **File backup**: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) — untuk Metode Satu
  - **File SQL**: [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) — untuk Metode Dua

**Catatan penting**:

- Solusi ini dibuat berbasis database **PostgreSQL 16**, pastikan lingkungan Anda menggunakan PostgreSQL 16.
- **DB_UNDERSCORED tidak boleh true**: silakan periksa `docker-compose.yml` Anda dan pastikan variabel lingkungan `DB_UNDERSCORED` tidak diset ke `true`, jika tidak akan terjadi konflik dengan backup solusi sehingga pemulihan gagal.

---

## Metode Satu: Pemulihan dengan Backup Manager (direkomendasikan untuk pengguna Pro/Enterprise)

Cara ini melakukan pemulihan satu klik melalui plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise) bawaan NocoBase, dengan operasi paling sederhana. Namun, ada persyaratan tertentu untuk lingkungan dan versi pengguna.

### Karakteristik Inti

* **Kelebihan**:
  1. **Operasi praktis**: dapat diselesaikan langsung di antarmuka UI dan dapat memulihkan seluruh konfigurasi termasuk plugin secara utuh.
  2. **Pemulihan lengkap**: **mampu memulihkan seluruh file sistem**, termasuk file template print, file yang diunggah pada kolom file di tabel, avatar karyawan AI, dan lain-lain.
* **Keterbatasan**:
  1. **Khusus Pro/Enterprise**: "Backup Manager" adalah plugin enterprise, hanya tersedia untuk pengguna Pro/Enterprise.
  2. **Persyaratan lingkungan ketat**: mengharuskan lingkungan database Anda (versi, pengaturan case-sensitive, dll.) sangat kompatibel dengan lingkungan tempat backup dibuat.
  3. **Ketergantungan plugin**: jika solusi menyertakan plugin komersial yang tidak tersedia di lingkungan lokal Anda, pemulihan akan gagal.

### Langkah Operasi

**Langkah 1: [Sangat disarankan] Menjalankan aplikasi dengan image `full`**

Untuk menghindari kegagalan pemulihan akibat tidak adanya database client, kami sangat menyarankan menggunakan image Docker versi `full`. Image tersebut sudah menyertakan seluruh program pendukung yang diperlukan, tanpa konfigurasi tambahan.

Contoh perintah pull image:

```bash
docker pull nocobase/nocobase:alpha-full
```

Kemudian gunakan image ini untuk menjalankan layanan NocoBase Anda.

> **Catatan**: jika tidak menggunakan image `full`, Anda mungkin perlu memasang database client `pg_dump` secara manual di dalam container, prosesnya rumit dan tidak stabil.

**Langkah 2: Mengaktifkan plugin "Backup Manager"**

1. Login ke sistem NocoBase Anda.
2. Buka **`Plugin Manager`**.
3. Temukan dan aktifkan plugin **`Backup Manager`**.

**Langkah 3: Memulihkan dari file backup lokal**

1. Setelah plugin diaktifkan, segarkan halaman.
2. Masuk ke menu kiri **`System Management`** → **`Backup Manager`**.
3. Klik tombol **`Restore from local backup`** di kanan atas.
4. Seret file `nocobase_all_in_one_backup_260521.nbdata` yang sudah diunduh ke area unggah.
5. Klik **`Submit`**, lalu tunggu hingga sistem menyelesaikan pemulihan. Proses ini dapat memakan waktu beberapa puluh detik hingga beberapa menit.

### Catatan Penting

* **Kompatibilitas database**: ini adalah poin paling kritis untuk metode ini. **Versi PostgreSQL, character set, dan pengaturan case-sensitive** Anda harus sesuai dengan file backup sumber, khususnya nama `schema` harus sama.
* **Kecocokan plugin komersial**: pastikan Anda sudah memiliki dan mengaktifkan seluruh plugin komersial yang dibutuhkan solusi, jika tidak pemulihan akan terhenti. Plugin komersial yang terlibat dalam solusi terintegrasi antara lain: Backup Manager, Mail Manager, Audit Log, AI Employees, dan lain-lain.

---

## Metode Dua: Impor Langsung File SQL (umum, lebih cocok untuk versi Community)

Cara ini melakukan pemulihan data dengan mengoperasikan database secara langsung, melewati plugin "Backup Manager" sehingga tidak terbatas pada plugin Pro/Enterprise.

### Karakteristik Inti

* **Kelebihan**:
  1. **Tanpa batasan versi**: berlaku untuk seluruh pengguna NocoBase, termasuk versi Community.
  2. **Kompatibilitas tinggi**: tidak bergantung pada tool `dump` di dalam aplikasi, cukup dapat terhubung ke database.
  3. **Toleransi tinggi**: jika solusi menyertakan plugin komersial yang tidak Anda miliki, fitur terkait tidak akan diaktifkan, namun tidak mengganggu penggunaan fitur lain, aplikasi dapat berhasil dijalankan.
* **Keterbatasan**:
  1. **Membutuhkan kemampuan operasi database**: pengguna harus memiliki kemampuan dasar operasi database, misalnya cara mengeksekusi file `.sql`.
  2. **File sistem hilang**: **metode ini akan menghilangkan seluruh file sistem**, termasuk file template print, file yang diunggah pada kolom file di tabel, avatar karyawan AI, dan lain-lain.

### Langkah Operasi

**Langkah 1: Menyiapkan database yang bersih**

Siapkan database baru yang kosong (PostgreSQL 16) untuk data yang akan diimpor.

**Langkah 2: Mengimpor file `.sql` ke database**

Ekstrak file `nocobase_all_in_one_sql_260521.zip` yang sudah diunduh untuk memperoleh file `.sql`, lalu impor isinya ke database yang telah disiapkan pada langkah sebelumnya. Cara eksekusi bervariasi tergantung lingkungan Anda:

* **Opsi A: Melalui command line server (contoh dengan Docker)**

  Jika Anda memasang NocoBase dan database menggunakan Docker, Anda dapat mengunggah file `.sql` ke server, lalu mengimpornya dengan perintah `docker exec`. Misalkan nama container PostgreSQL Anda adalah `my-nocobase-db`:

  ```bash
  # Salin file sql ke dalam container
  docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
  # Masuk ke container dan jalankan perintah impor
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
  ```

* **Opsi B: Melalui database client jarak jauh (Navicat, dll.)**

  Jika database Anda memiliki port yang ter-expose, Anda dapat menggunakan database client grafis apa pun (seperti Navicat, DBeaver, pgAdmin, dll.) untuk terhubung ke database, lalu:

  1. Klik kanan pada database tujuan.
  2. Pilih "Run SQL File" atau "Execute SQL Script".
  3. Pilih file `.sql` yang sudah diunduh lalu eksekusi.

**Langkah 3: Menghubungkan database dan menjalankan aplikasi**

Konfigurasikan parameter startup NocoBase Anda (variabel lingkungan seperti `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, dan lain-lain) agar mengarah ke database yang baru saja Anda isi datanya, lalu jalankan layanan NocoBase seperti biasa.

### Catatan Penting

* **Hak akses database**: metode ini mengharuskan Anda memiliki akun dan kata sandi yang dapat mengoperasikan database secara langsung.
* **Status plugin**: setelah impor berhasil, data plugin komersial yang ada di sistem tetap tersimpan, namun jika plugin terkait belum dipasang dan diaktifkan di lingkungan lokal Anda, fitur terkait tidak akan tampil dan tidak dapat digunakan. Hal ini tidak menyebabkan aplikasi crash.

---

## Ringkasan dan Perbandingan

| Karakteristik | Metode Satu: Backup Manager | Metode Dua: Impor Langsung SQL |
| :--- | :--- | :--- |
| **Pengguna yang Sesuai** | Pengguna **Pro/Enterprise** | **Semua pengguna** (termasuk Community) |
| **Kemudahan Operasi** | ⭐⭐⭐⭐⭐ (sangat sederhana, operasi UI) | ⭐⭐⭐ (membutuhkan pengetahuan dasar database) |
| **Persyaratan Lingkungan** | **Ketat**, database, versi sistem, dan lain-lain harus sangat kompatibel | **Umum**, cukup database kompatibel |
| **Ketergantungan Plugin** | **Ketergantungan kuat**, plugin diverifikasi saat pemulihan; jika salah satu plugin tidak ada, **pemulihan gagal** | **Fitur sangat bergantung pada plugin**. Data dapat diimpor secara mandiri, sistem memiliki fitur dasar. Namun jika plugin terkait tidak ada, fitur terkait **sama sekali tidak dapat digunakan** |
| **File Sistem** | **Tersimpan utuh** (template print, file yang diunggah, avatar, dan lain-lain) | **Akan hilang** (template print, file yang diunggah, avatar, dan lain-lain) |
| **Skenario yang Direkomendasikan** | Pengguna enterprise, lingkungan terkontrol dan konsisten, membutuhkan fitur lengkap | Tidak memiliki sebagian plugin, mengutamakan kompatibilitas dan fleksibilitas tinggi, bukan pengguna Pro/Enterprise, dapat menerima ketidaktersediaan fitur file |

---

## Pertanyaan Umum

### Apakah versi Pro bisa digunakan? Apakah akan terjadi error?

Bisa langsung digunakan tanpa error. Demo menggunakan sebagian plugin Enterprise (seperti Mail Manager, Audit Log, AI Employees, dan lain-lain), jika versi Pro tidak memiliki plugin tersebut, akses fitur terkait tidak akan tampil, namun **tidak memengaruhi modul lain sistem**. Misalnya, akses Audit Log akan hilang, tetapi modul inti seperti CRM, Sales, Tickets, Project, Assets, HR tetap berjalan sepenuhnya normal.

### Versi mana yang sebaiknya dipilih setelah pemulihan?

Direkomendasikan menggunakan image versi `alpha-full` terbaru (seperti `nocobase/nocobase:alpha-full`). Image `full` sudah menyertakan dependensi seperti database client untuk menghindari kegagalan pemulihan akibat tool yang tidak tersedia.

### Logo tidak tampil setelah pemulihan?

Logo Demo di situs resmi dikonfigurasi dengan pembatasan domain sehingga tidak dapat dimuat dari domain lokal. Buka **System Settings** dan unggah ulang Logo Anda sendiri.

### Error saat unggah file (OSS Key error)?

Setelah instalasi cara SQL, unggah file mungkin menghasilkan error terkait OSS. Solusinya: buka **Plugin Manager → File Manager**, atur **Local Storage** sebagai default storage, simpan, lalu unggah akan berjalan normal.

### Cara mengganti bahasa?

Solusi terintegrasi sudah dilokalkan ke 20+ bahasa (namespace `nb_demo`). Setelah pemulihan, default-nya bahasa Tionghoa; untuk beralih ke bahasa lain: **System Settings → aktifkan bahasa yang sesuai** (hindari mengaktifkan `ar-SA`, saat ini menyebabkan NocoBase mengalami anomali rendering).

### Bagaimana dengan upgrade inkremental?

Upgrade versi saat ini berbentuk penggantian penuh, modifikasi kustom akan tertimpa. Pastikan backup sebelum upgrade. Solusi migrasi inkremental sedang direncanakan dan akan didukung lebih dulu untuk versi Pro/Enterprise. Versi Community sementara sulit didukung karena tidak memiliki plugin Migration Manager.

Kami berharap tutorial ini dapat membantu Anda men-deploy Sistem Manajemen Bisnis Terintegrasi dengan lancar. Jika Anda mengalami masalah selama proses, silakan hubungi kami kapan saja.
