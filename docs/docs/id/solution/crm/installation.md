---
title: "Cara Instalasi CRM 2.0"
description: "Instalasi dan deployment CRM 2.0: restore Backup Manager (Pro/Enterprise) atau impor file SQL (Community), membutuhkan PostgreSQL 16, DB_UNDERSCORED tidak boleh true."
keywords: "Instalasi CRM,Restore Backup,Backup Manager,Impor SQL,PostgreSQL,NocoBase"
---

# Cara Instalasi

> Versi saat ini menggunakan format **restore backup** untuk deployment. Pada versi mendatang, kami mungkin akan beralih ke format **migrasi inkremental**, untuk memudahkan integrasi solusi ke sistem yang sudah ada.

Agar Anda dapat dengan cepat dan lancar men-deploy solusi CRM 2.0 ke lingkungan NocoBase Anda sendiri, kami menyediakan dua metode restore. Silakan pilih yang paling sesuai dengan versi pengguna dan latar belakang teknis Anda.

Sebelum memulai, pastikan:

- Anda sudah memiliki lingkungan NocoBase yang berjalan. Untuk instalasi sistem utama, silakan merujuk ke [dokumentasi instalasi resmi](https://docs-cn.nocobase.com/welcome/getting-started/installation) yang lebih detail.
- Versi NocoBase **v2.1.0-beta.2 atau lebih tinggi**
- Anda telah mengunduh file yang sesuai untuk sistem CRM:
  - **File backup**: [nocobase_crm_v2_backup_260406.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260406.nbdata) - untuk metode satu
  - **File SQL**: [nocobase_crm_v2_sql_260406.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260406.zip) - untuk metode dua

**Catatan Penting**:
- Solusi ini dibuat berdasarkan database **PostgreSQL 16**, pastikan lingkungan Anda menggunakan PostgreSQL 16.
- **DB_UNDERSCORED tidak boleh true**: Periksa file `docker-compose.yml` Anda, pastikan environment variable `DB_UNDERSCORED` tidak diatur ke `true`, jika tidak akan konflik dengan backup solusi dan menyebabkan kegagalan restore.

---

## Metode Satu: Restore dengan Backup Manager (Direkomendasikan untuk Pengguna Pro/Enterprise)

Metode ini menggunakan plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise) bawaan NocoBase untuk restore satu klik, paling sederhana untuk dilakukan. Namun, ada persyaratan tertentu untuk lingkungan dan versi pengguna.

### Karakteristik Inti

* **Kelebihan**:
  1. **Mudah dioperasikan**: Dapat diselesaikan melalui antarmuka UI, dapat me-restore semua konfigurasi termasuk Plugin secara lengkap.
  2. **Restore lengkap**: **Dapat me-restore semua file sistem**, termasuk file Template print, file yang diupload di field file di tabel, dll., memastikan kelengkapan fungsi.
* **Keterbatasan**:
  1. **Khusus Pro/Enterprise**: "Backup Manager" adalah plugin tingkat enterprise, hanya tersedia untuk pengguna Pro/Enterprise.
  2. **Persyaratan lingkungan ketat**: Membutuhkan lingkungan database Anda (versi, pengaturan case sensitivity, dll.) yang sangat kompatibel dengan lingkungan saat backup dibuat.
  3. **Ketergantungan Plugin**: Jika solusi mengandung Plugin komersial yang tidak ada di lingkungan lokal Anda, restore akan gagal.

### Langkah-langkah Operasi

**Langkah 1: [Sangat Disarankan] Gunakan image `full` untuk menjalankan aplikasi**

Untuk menghindari kegagalan restore karena tidak ada client database, kami sangat menyarankan Anda menggunakan Docker image versi `full`. Image ini sudah berisi semua program pendukung yang diperlukan, sehingga Anda tidak perlu konfigurasi tambahan.

Contoh perintah pull image:

```bash
docker pull nocobase/nocobase:beta-full
```

Lalu gunakan image ini untuk menjalankan layanan NocoBase Anda.

> **Catatan**: Jika tidak menggunakan image `full`, Anda mungkin perlu menginstal client database `pg_dump` secara manual di dalam container, prosesnya rumit dan tidak stabil.

**Langkah 2: Aktifkan Plugin "Backup Manager"**

1. Login ke sistem NocoBase Anda.
2. Masuk ke **`Plugin Management`**.
3. Cari dan aktifkan Plugin **`Backup Manager`**.

**Langkah 3: Restore dari File Backup Lokal**

1. Setelah plugin diaktifkan, refresh halaman.
2. Masuk ke menu kiri **`System Management`** -> **`Backup Manager`**.
3. Klik tombol **`Restore from Local Backup`** di pojok kanan atas.
4. Drag file backup yang sudah diunduh ke area upload.
5. Klik **`Submit`**, tunggu dengan sabar hingga sistem menyelesaikan restore, proses ini dapat memakan waktu beberapa puluh detik hingga beberapa menit.

### Perhatian

* **Kompatibilitas Database**: Ini adalah hal paling penting dalam metode ini. **Versi, character set, pengaturan case sensitivity** PostgreSQL Anda harus cocok dengan file sumber backup. Khususnya nama `schema` harus sama.
* **Pencocokan Plugin Komersial**: Pastikan Anda sudah memiliki dan mengaktifkan semua Plugin komersial yang dibutuhkan oleh solusi, jika tidak restore akan terhenti.

---

## Metode Dua: Impor Langsung File SQL (Universal, Lebih Cocok untuk Community)

Metode ini me-restore data dengan mengoperasikan database secara langsung, melewati Plugin "Backup Manager", sehingga tidak ada batasan plugin Pro/Enterprise.

### Karakteristik Inti

* **Kelebihan**:
  1. **Tanpa batasan versi**: Berlaku untuk semua pengguna NocoBase, termasuk Community.
  2. **Kompatibilitas tinggi**: Tidak bergantung pada tool `dump` di dalam aplikasi, selama dapat terhubung ke database, dapat dijalankan.
  3. **Toleransi kesalahan tinggi**: Jika solusi mengandung Plugin komersial yang tidak Anda miliki, fungsi terkait tidak akan diaktifkan, tetapi tidak akan memengaruhi penggunaan normal fungsi lain, dan aplikasi dapat berhasil dijalankan.
* **Keterbatasan**:
  1. **Membutuhkan kemampuan operasi database**: Pengguna perlu memiliki kemampuan dasar operasi database, seperti cara menjalankan file `.sql`.
  2. **File sistem hilang**: **Metode ini akan kehilangan semua file sistem**, termasuk file Template print, file yang diupload di field file di tabel, dll.

### Langkah-langkah Operasi

**Langkah 1: Siapkan Database Bersih**

Siapkan database baru yang kosong untuk data yang akan diimpor.

**Langkah 2: Impor File `.sql` ke Database**

Dapatkan file database yang sudah diunduh (biasanya format `.sql`), dan impor isinya ke database yang sudah disiapkan di langkah sebelumnya. Ada beberapa cara eksekusi, tergantung pada lingkungan Anda:

* **Opsi A: Melalui command line server (contoh Docker)**
  Jika Anda menginstal NocoBase dan database menggunakan Docker, Anda dapat mengupload file `.sql` ke server, lalu menggunakan perintah `docker exec` untuk menjalankan impor. Misalkan nama container PostgreSQL Anda adalah `my-nocobase-db`, dan nama file adalah `nocobase_crm_v2_sql_260327.sql`:

  ```bash
  # Salin file sql ke dalam container
  docker cp nocobase_crm_v2_sql_260327.sql my-nocobase-db:/tmp/
  # Masuk ke container untuk menjalankan perintah impor
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260327.sql
  ```
* **Opsi B: Melalui Client Database Remote (Navicat, dll.)**
  Jika database Anda mengekspos port, Anda dapat menggunakan client database grafis apa pun (seperti Navicat, DBeaver, pgAdmin, dll.) untuk terhubung ke database, lalu:
  1. Klik kanan database target
  2. Pilih "Run SQL File" atau "Execute SQL Script"
  3. Pilih file `.sql` yang sudah diunduh dan jalankan

**Langkah 3: Sambungkan Database dan Jalankan Aplikasi**

Konfigurasikan parameter startup NocoBase Anda (seperti environment variables `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, dll.) agar mengarah ke database yang baru saja Anda impor datanya. Lalu, jalankan layanan NocoBase secara normal.

### Perhatian

* **Izin Database**: Metode ini mengharuskan Anda memiliki akun dan password yang dapat mengoperasikan database secara langsung.
* **Status Plugin**: Setelah impor berhasil, data Plugin komersial yang terdapat dalam sistem ada, tetapi jika lokal Anda belum menginstal dan mengaktifkan Plugin yang sesuai, fungsi terkait tidak akan ditampilkan dan tidak dapat digunakan, tetapi ini tidak akan menyebabkan aplikasi crash.

---

## Ringkasan dan Perbandingan

| Karakteristik   | Metode Satu: Backup Manager                                       | Metode Dua: Impor SQL Langsung                                                                          |
| :-------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **Pengguna**    | Pengguna **Pro/Enterprise**                                       | **Semua pengguna** (termasuk Community)                                                                 |
| **Kemudahan**   | Sangat sederhana (operasi UI)                                     | Sedang (membutuhkan pengetahuan database dasar)                                                         |
| **Persyaratan Lingkungan** | **Ketat**, database, versi sistem, dll. perlu sangat kompatibel | **Umum**, butuh database yang kompatibel                                                              |
| **Ketergantungan Plugin** | **Sangat bergantung**, restore akan memvalidasi plugin, kekurangan plugin apa pun akan menyebabkan **kegagalan restore**. | **Fungsi sangat bergantung pada plugin**. Data dapat diimpor secara independen, sistem memiliki fungsi dasar. Tetapi jika kekurangan plugin yang sesuai, fungsi terkait akan **sepenuhnya tidak dapat digunakan**. |
| **File Sistem** | **Disimpan lengkap** (Template print, file upload, dll.)         | **Akan hilang** (Template print, file upload, dll.)                                                  |
| **Skenario Direkomendasikan** | Pengguna enterprise, dengan lingkungan terkontrol dan konsisten, butuh fungsi lengkap | Kekurangan beberapa plugin, butuh kompatibilitas tinggi, fleksibilitas, bukan pengguna Pro/Enterprise, dapat menerima kehilangan fungsi file |

---

## FAQ

### Apakah versi Pro dapat digunakan? Apakah akan error?

Dapat langsung digunakan, tidak akan error. Demo menggunakan beberapa Plugin Enterprise (seperti email manager, audit log, dll.), saat versi Pro kekurangan Plugin ini, entry point fungsi yang sesuai tidak akan ditampilkan, tetapi **tidak akan memengaruhi fungsi lain dari sistem**. Misalnya entry email akan menghilang, tetapi modul inti seperti Lead, Peluang, Pesanan akan berfungsi normal.

### Versi mana yang harus dipilih setelah restore?

Direkomendasikan menggunakan image versi `beta-full` terbaru (seperti `nocobase/nocobase:beta-full`). Image `full` sudah berisi dependency seperti client database, menghindari kegagalan saat restore karena tidak ada tool.

### Logo tidak ditampilkan setelah restore?

Logo Demo di situs resmi memiliki batasan domain, domain lokal tidak dapat memuatnya. Masuk ke **System Settings** dan upload Logo Anda sendiri.

### Error upload file (kesalahan OSS Key)?

Setelah instalasi metode SQL, upload file mungkin error terkait OSS. Solusi: Masuk ke **Plugin Management → File Manager**, atur **Local Storage** sebagai default storage, simpan, lalu upload akan normal.

### Bagaimana dengan upgrade inkremental?

Saat ini upgrade versi adalah penggantian penuh, modifikasi kustom akan ditimpa. Pastikan untuk backup sebelum upgrade. Solusi migrasi inkremental sedang direncanakan, akan diprioritaskan untuk Pro/Enterprise. Community sulit didukung sementara karena tidak memiliki plugin migration management.

Semoga tutorial ini membantu Anda men-deploy sistem CRM 2.0 dengan lancar. Jika Anda mengalami masalah dalam proses operasi, jangan ragu untuk menghubungi kami!

---

*Last updated: 2026-04-02*
