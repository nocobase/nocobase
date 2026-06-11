---
title: "Cara Instalasi Solusi Ticket"
description: "Instalasi dan deployment solusi Ticket: restore satu klik dengan plugin Backup Manager yang kini open-source, membutuhkan PostgreSQL 16, DB_UNDERSCORED tidak boleh true."
keywords: "Instalasi Ticket,Restore Backup,Backup Manager,PostgreSQL,NocoBase"
---

# Cara Instalasi

> Versi saat ini menggunakan format **restore backup** untuk deployment. Pada versi mendatang, kami mungkin akan beralih ke format **migrasi inkremental**, untuk memudahkan integrasi solusi ke sistem yang sudah ada.

> **Plugin Backup Manager kini open-source**: plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" yang dibutuhkan untuk me-restore solusi kini sudah open-source dan tersedia untuk semua versi (termasuk Community). Kami menyarankan untuk me-restore langsung melalui plugin ini.

Sebelum memulai, pastikan:

- Anda sudah memiliki lingkungan NocoBase yang berjalan. Untuk instalasi sistem utama, silakan merujuk ke [dokumentasi instalasi resmi](https://docs-cn.nocobase.com/welcome/getting-started/installation) yang lebih detail.
- Versi NocoBase **2.0.0-beta.5 atau lebih tinggi**
- Anda telah mengunduh file backup untuk sistem Ticket: [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata)

**Catatan Penting**:
- Solusi ini dibuat berdasarkan database **PostgreSQL 16**, pastikan lingkungan Anda menggunakan PostgreSQL 16.
- **DB_UNDERSCORED tidak boleh true**: Periksa file `docker-compose.yml` Anda, pastikan environment variable `DB_UNDERSCORED` tidak diatur ke `true`, jika tidak akan konflik dengan backup solusi dan menyebabkan kegagalan restore.

---

## Restore dengan Backup Manager

Metode ini menggunakan plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" bawaan NocoBase untuk restore satu klik, paling sederhana untuk dilakukan. Plugin ini kini sudah open-source dan tersedia untuk semua versi (termasuk Community).

### Karakteristik Inti

* **Kelebihan**:
  1. **Mudah dioperasikan**: Dapat diselesaikan melalui antarmuka UI, dapat me-restore semua konfigurasi termasuk Plugin secara lengkap.
  2. **Restore lengkap**: **Dapat me-restore semua file sistem**, termasuk file Template print, file yang diupload di field file di tabel, dll., memastikan kelengkapan fungsi.
* **Keterbatasan**:
  1. **Persyaratan lingkungan ketat**: Membutuhkan lingkungan database Anda (versi, pengaturan case sensitivity, dll.) yang sangat kompatibel dengan lingkungan saat backup dibuat.
  2. **Ketergantungan Plugin**: Jika solusi mengandung Plugin komersial yang tidak ada di lingkungan lokal Anda, restore akan gagal.

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

Semoga tutorial ini membantu Anda men-deploy sistem Ticket dengan lancar. Jika Anda mengalami masalah dalam proses operasi, jangan ragu untuk menghubungi kami!

---

*Last updated: 2026-03-24*
