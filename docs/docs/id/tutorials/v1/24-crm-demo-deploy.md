# Panduan Deployment CRM Demo

Untuk memungkinkan Anda men-deploy Demo ini ke environment NocoBase Anda sendiri dengan cepat dan lancar, kami menyediakan dua cara restore. Silakan pilih yang paling sesuai berdasarkan versi pengguna dan latar belakang teknis Anda.

Sebelum memulai, pastikan

- Anda sudah memiliki environment dasar NocoBase yang berjalan. Untuk instalasi sistem utama, silakan rujuk pada [Dokumentasi Instalasi Resmi](https://docs-cn.nocobase.com/welcome/getting-started/installation) yang lebih detail.
- Anda sudah mengunduh file CRM Demo kami yang sesuai (versi China):
  - **File backup** (sekitar 21.2MB): [nocobase_crm_demo_cn.nbdata](https://static-docs.nocobase.com/nocobase_crm_demo_cn.nbdata) - Untuk Metode Pertama
  - **File SQL** (setelah dikompresi sekitar 9MB): [nocobase_crm_demo_cn.zip](https://static-docs.nocobase.com/nocobase_crm_demo_cn.zip) - Untuk Metode Kedua

**Penting**: Demo ini dibuat berdasarkan database **PostgreSQL**, pastikan environment Anda menggunakan database PostgreSQL.

---

### Metode Pertama: Restore Menggunakan Backup Manager (Direkomendasikan untuk Pengguna Pro/Enterprise)

Cara ini melalui plugin "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" bawaan NocoBase (Pro/Enterprise) untuk one-click restore, paling sederhana dalam pengoperasian. Namun memiliki persyaratan tertentu untuk environment dan versi pengguna.

#### Karakteristik Inti

* **Keunggulan**:
  1. **Operasi mudah**: Dapat diselesaikan di antarmuka UI, dapat secara lengkap me-restore semua konfigurasi termasuk plugin.
  2. **Restore lengkap**: **Dapat me-restore semua file sistem**, termasuk file template print, file yang diupload pada Field file di tabel, dan sebagainya, untuk memastikan kelengkapan fungsi Demo.
* **Keterbatasan**:
  1. **Khusus Pro/Enterprise**: "Backup Manager" adalah plugin enterprise, hanya tersedia untuk pengguna Pro/Enterprise.
  2. **Persyaratan environment ketat**: Memerlukan environment database Anda (versi, pengaturan case sensitivity, dll.) sangat kompatibel dengan environment saat kami membuat backup.
  3. **Ketergantungan plugin**: Jika Demo mengandung plugin komersial yang tidak ada di environment lokal Anda, restore akan gagal.

#### Langkah Operasi

**Langkah 1: [Sangat Direkomendasikan] Gunakan Image `full` untuk Memulai Aplikasi**

Untuk menghindari kegagalan restore karena tidak adanya client database, kami sangat merekomendasikan Anda menggunakan Docker image versi `full`. Ini memiliki built-in semua program pendukung yang diperlukan, sehingga Anda tidak perlu melakukan konfigurasi tambahan. (Perhatian: image kami dibuat dari 1.9.0-alpha.1, harap perhatikan kompatibilitas versi)

Contoh perintah untuk pull image:

```bash
docker pull nocobase/nocobase:1.9.0-alpha.3-full
```

Kemudian gunakan image ini untuk memulai layanan NocoBase Anda.

> **Catatan**: Jika tidak menggunakan image `full`, Anda mungkin perlu menginstal client database `pg_dump` secara manual di dalam container, prosesnya rumit dan tidak stabil.

**Langkah 2: Aktifkan Plugin "Backup Manager"**

1. Login ke sistem NocoBase Anda.
2. Masuk ke **`Manajemen Plugin`**.
3. Cari dan aktifkan plugin **`Backup Manager`**.

![20250711014113](https://static-docs.nocobase.com/20250711014113.png)

**Langkah 3: Restore dari File Backup Lokal**

1. Setelah mengaktifkan plugin, refresh halaman.
2. Masuk ke menu kiri **`Manajemen Sistem`** -\> **`Backup Manager`**.
3. Klik tombol **`Restore dari Backup Lokal`** di pojok kanan atas.
   ![20250711014216](https://static-docs.nocobase.com/20250711014216.png)
4. Drag file backup Demo yang kami berikan kepada Anda (biasanya format `.zip`) ke area upload.
5. Klik **`Submit`**, dengan sabar tunggu sistem menyelesaikan restore. Proses ini mungkin membutuhkan beberapa puluh detik hingga beberapa menit.
   ![20250711014250](https://static-docs.nocobase.com/20250711014250.png)

#### ⚠️ Hal yang Perlu Diperhatikan

* **Kompatibilitas database**: Ini adalah poin paling kritis dari metode ini. **Versi, character set, pengaturan case sensitivity** PostgreSQL Anda harus cocok dengan file backup Demo. Khususnya nama `schema` harus sama.
* **Pencocokan plugin komersial**: Pastikan Anda telah memiliki dan mengaktifkan semua plugin komersial yang dibutuhkan Demo, jika tidak restore akan terinterupsi.

---

### Metode Kedua: Import Langsung File SQL (Umum, Lebih Cocok untuk Versi Komunitas)

Cara ini langsung mengoperasikan database untuk me-restore data, melewati plugin "Backup Manager", sehingga tidak ada batasan plugin Pro/Enterprise.

#### Karakteristik Inti

* **Keunggulan**:
  1. **Tanpa batasan versi**: Cocok untuk semua pengguna NocoBase, termasuk versi komunitas.
  2. **Kompatibilitas tinggi**: Tidak bergantung pada tool `dump` dalam aplikasi, asalkan dapat terhubung ke database dapat dioperasikan.
  3. **Toleransi error tinggi**: Jika Demo mengandung plugin komersial yang tidak Anda miliki (seperti chart ECharts), fitur terkait tidak akan diaktifkan, namun tidak akan mempengaruhi penggunaan normal fitur lain, aplikasi dapat berhasil dimulai.
* **Keterbatasan**:
  1. **Memerlukan kemampuan operasi database**: Memerlukan pengguna memiliki kemampuan operasi database dasar, misalnya cara mengeksekusi file `.sql`.
  2. **⚠️ Kehilangan file sistem**: **Metode ini akan kehilangan semua file sistem**, termasuk file template print, file yang diupload pada Field file di tabel, dan sebagainya. Ini berarti:
     - Fitur template print mungkin tidak dapat digunakan dengan normal
     - Gambar, dokumen, dan file lain yang sudah diupload akan hilang
     - Fitur yang melibatkan Field file akan terpengaruh

#### Langkah Operasi

**Langkah 1: Siapkan Database yang Bersih**

Siapkan database baru yang kosong untuk data Demo yang akan Anda import.

**Langkah 2: Import File `.sql` ke Database**

Dapatkan file database Demo yang kami berikan (biasanya format `.sql`), dan import isinya ke database yang Anda siapkan pada langkah sebelumnya. Cara eksekusi bermacam-macam, tergantung pada environment Anda:

* **Opsi A: Melalui command line server (contoh dengan Docker)**
  Jika Anda menggunakan Docker untuk menginstal NocoBase dan database, Anda dapat upload file `.sql` ke server, kemudian gunakan perintah `docker exec` untuk mengeksekusi import. Asumsikan container PostgreSQL Anda bernama `my-nocobase-db`, nama file `crm_demo.sql`:

  ```bash
  # Salin file sql ke dalam container
  docker cp crm_demo.sql my-nocobase-db:/tmp/
  # Masuk ke container untuk mengeksekusi perintah import
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/crm_demo.sql
  ```
* **Opsi B: Melalui remote database client**
  Jika database Anda meng-expose port, Anda dapat menggunakan client database grafis apa saja (seperti DBeaver, Navicat, pgAdmin, dll.) untuk terhubung ke database, buat window query baru, paste seluruh isi file `.sql`, lalu eksekusi.

**Langkah 3: Hubungkan Database dan Mulai Aplikasi**

Konfigurasikan parameter startup NocoBase Anda (seperti environment variable `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, dll.), agar mengarah ke database yang baru saja Anda import datanya. Kemudian, mulai layanan NocoBase secara normal.

![img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag](https://static-docs.nocobase.com/img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag.png)

#### ⚠️ Hal yang Perlu Diperhatikan

* **Permission database**: Metode ini mengharuskan Anda memiliki akun dan password yang dapat langsung mengoperasikan database.
* **Status plugin**: Setelah berhasil di-import, meskipun data plugin komersial yang ada di sistem ada, namun jika Anda belum menginstal dan mengaktifkan plugin yang sesuai di lokal, fitur terkait (seperti chart Echarts, Field tertentu, dll.) tidak akan dapat ditampilkan dan digunakan, namun ini tidak akan menyebabkan aplikasi crash.

---

### Ringkasan dan Perbandingan


| Karakteristik         | Metode Pertama: Backup Manager                                   | Metode Kedua: Import Langsung SQL                                                                          |
| :-------------------- | :--------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Pengguna yang Sesuai** | Pengguna **Pro/Enterprise**                                    | **Semua pengguna** (termasuk versi komunitas)                                                              |
| **Tingkat Kemudahan Operasi** | ⭐⭐⭐⭐⭐ (Sangat sederhana, operasi UI)                  | ⭐⭐⭐ (Memerlukan pengetahuan database dasar)                                                              |
| **Persyaratan Environment** | **Ketat**, database, versi sistem, dll. perlu sangat kompatibel | **Umum**, perlu kompatibilitas database                                                                  |
| **Ketergantungan Plugin** | **Ketergantungan kuat**, akan memvalidasi plugin saat restore, kurangnya plugin apa pun akan menyebabkan **restore gagal**. | **Fungsi sangat bergantung pada plugin**. Data dapat di-import secara independen, sistem memiliki fungsi dasar. Namun jika kekurangan plugin terkait, fitur terkait akan **sepenuhnya tidak dapat digunakan**. |
| **File Sistem**       | **✅ Tersimpan lengkap** (template print, file upload, dll.)    | **❌ Akan hilang** (template print, file upload, dll.)                                                    |
| **Skenario Direkomendasikan** | Pengguna enterprise, environment terkontrol dan konsisten, membutuhkan demonstrasi fitur lengkap | Kurang beberapa plugin, mengejar kompatibilitas tinggi, fleksibilitas, pengguna non-Pro/Enterprise, dapat menerima kehilangan fitur file |

Kami berharap tutorial ini dapat membantu Anda dengan lancar men-deploy CRM Demo. Jika selama proses pengoperasian menemui masalah apa pun, silakan hubungi kami kapan saja!
