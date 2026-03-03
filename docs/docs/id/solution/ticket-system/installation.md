:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/solution/ticket-system/installation).
:::

# Cara Menginstal

> Versi saat ini menggunakan bentuk **cadangan dan pemulihan** untuk penerapan. Pada versi mendatang, kami mungkin akan menggantinya menjadi bentuk **migrasi inkremental**, untuk memudahkan integrasi solusi ke dalam sistem Anda yang sudah ada.

Agar Anda dapat menerapkan solusi tiket ke lingkungan NocoBase Anda sendiri dengan cepat dan lancar, kami menyediakan dua metode pemulihan. Silakan pilih yang paling sesuai berdasarkan versi pengguna dan latar belakang teknis Anda.

Sebelum memulai, pastikan:

- Anda sudah memiliki lingkungan berjalan NocoBase dasar. Mengenai instalasi sistem utama, silakan merujuk ke [dokumen instalasi resmi](https://docs-cn.nocobase.com/welcome/getting-started/installation) yang lebih rinci.
- Versi NocoBase **2.0.0-beta.5 ke atas**
- Anda telah mengunduh file yang sesuai untuk sistem tiket:
  - **File cadangan**: [nocobase_tts_v2_backup_260302.nbdata](https://static-docs.nocobase.com/nocobase_tts_v2_backup_260302.nbdata) - Berlaku untuk Metode 1
  - **File SQL**: [nocobase_tts_v2_sql_260302.zip](https://static-docs.nocobase.com/nocobase_tts_v2_sql_260302.zip) - Berlaku untuk Metode 2

**Catatan Penting**:
- Solusi ini dibuat berdasarkan database **PostgreSQL 16**, pastikan lingkungan Anda menggunakan PostgreSQL 16.
- **DB_UNDERSCORED tidak boleh true**: Silakan periksa file `docker-compose.yml` Anda, pastikan variabel lingkungan `DB_UNDERSCORED` tidak disetel ke `true`, jika tidak, ini akan bertentangan dengan cadangan solusi dan menyebabkan kegagalan pemulihan.

---

## Metode 1: Memulihkan menggunakan Pengelola Cadangan (Direkomendasikan untuk pengguna versi Profesional/Perusahaan)

Metode ini dilakukan melalui plugin bawaan NocoBase "[Pengelola Cadangan](https://docs-cn.nocobase.com/handbook/backups)" (versi Profesional/Perusahaan) untuk pemulihan satu klik, pengoperasiannya paling sederhana. Namun, metode ini memiliki persyaratan tertentu terhadap lingkungan dan versi pengguna.

### Fitur Utama

* **Kelebihan**:
  1. **Pengoperasian mudah**: Dapat diselesaikan di antarmuka UI, dapat memulihkan semua konfigurasi termasuk plugin secara lengkap.
  2. **Pemulihan lengkap**: **Dapat memulihkan semua file sistem**, termasuk file cetak templat, file yang diunggah di bidang file dalam tabel, dll., untuk memastikan integritas fungsi.
* **Batasan**:
  1. **Khusus versi Profesional/Perusahaan**: "Pengelola Cadangan" adalah plugin tingkat perusahaan, hanya tersedia untuk pengguna versi Profesional/Perusahaan.
  2. **Persyaratan lingkungan yang ketat**: Memerlukan lingkungan database Anda (versi, pengaturan sensitivitas huruf besar-kecil, dll.) sangat kompatibel dengan lingkungan saat kami membuat cadangan.
  3. **Ketergantungan plugin**: Jika solusi mencakup plugin komersial yang tidak ada di lingkungan lokal Anda, pemulihan akan gagal.

### Langkah-langkah

**Langkah 1: 【Sangat Disarankan】 Gunakan citra `full` untuk memulai aplikasi**

Untuk menghindari kegagalan pemulihan karena kurangnya klien database, kami sangat menyarankan Anda menggunakan citra Docker versi `full`. Ini sudah menyertakan semua program pendukung yang diperlukan, sehingga Anda tidak perlu melakukan konfigurasi tambahan.

Contoh perintah untuk menarik citra:

```bash
docker pull nocobase/nocobase:beta-full
```

Kemudian gunakan citra ini untuk memulai layanan NocoBase Anda.

> **Catatan**: Jika tidak menggunakan citra `full`, Anda mungkin perlu menginstal klien database `pg_dump` secara manual di dalam kontainer, prosesnya rumit dan tidak stabil.

**Langkah 2: Aktifkan plugin "Pengelola Cadangan"**

1. Masuk ke sistem NocoBase Anda.
2. Masuk ke **`Manajemen Plugin`**.
3. Temukan dan aktifkan plugin **`Pengelola Cadangan`**.

**Langkah 3: Pulihkan dari file cadangan lokal**

1. Setelah mengaktifkan plugin, segarkan halaman.
2. Masuk ke menu kiri **`Administrasi Sistem`** -> **`Pengelola Cadangan`**.
3. Klik tombol **`Pulihkan dari cadangan lokal`** di sudut kanan atas.
4. Seret file cadangan yang diunduh ke area unggah.
5. Klik **`Kirim`**, tunggu dengan sabar hingga sistem menyelesaikan pemulihan, proses ini mungkin memakan waktu puluhan detik hingga beberapa menit.

### Catatan

* **Kompatibilitas database**: Ini adalah poin paling krusial dari metode ini. **Versi, set karakter, pengaturan sensitivitas huruf besar-kecil** database PostgreSQL Anda harus cocok dengan file sumber cadangan. Terutama nama `schema` harus konsisten.
* **Kesesuaian plugin komersial**: Pastikan Anda sudah memiliki dan mengaktifkan semua plugin komersial yang diperlukan oleh solusi, jika tidak, pemulihan akan terhenti.

---

## Metode 2: Impor langsung file SQL (Universal, lebih cocok untuk versi Komunitas)

Metode ini memulihkan data dengan mengoperasikan database secara langsung, melewati plugin "Pengelola Cadangan", sehingga tidak ada batasan plugin versi Profesional/Perusahaan.

### Fitur Utama

* **Kelebihan**:
  1. **Tidak ada batasan versi**: Berlaku untuk semua pengguna NocoBase, termasuk versi Komunitas.
  2. **Kompatibilitas tinggi**: Tidak bergantung pada alat `dump` di dalam aplikasi, selama dapat terhubung ke database maka dapat dioperasikan.
  3. **Toleransi kesalahan tinggi**: Jika solusi berisi plugin komersial yang tidak Anda miliki, fungsi terkait tidak akan diaktifkan, tetapi tidak akan memengaruhi penggunaan normal fungsi lainnya, aplikasi dapat dimulai dengan sukses.
* **Batasan**:
  1. **Memerlukan kemampuan operasi database**: Pengguna perlu memiliki kemampuan dasar operasi database, misalnya cara mengeksekusi file `.sql`.
  2. **Kehilangan file sistem**: **Metode ini akan kehilangan semua file sistem**, termasuk file cetak templat, file yang diunggah di bidang file dalam tabel, dll.

### Langkah-langkah

**Langkah 1: Siapkan database yang bersih**

Siapkan database baru yang kosong untuk data yang akan Anda impor.

**Langkah 2: Impor file `.sql` ke dalam database**

Dapatkan file database yang diunduh (biasanya dalam format `.sql`), dan impor isinya ke dalam database yang Anda siapkan pada langkah sebelumnya. Ada berbagai cara eksekusi, tergantung pada lingkungan Anda:

* **Opsi A: Melalui baris perintah server (contoh Docker)**
  Jika Anda menggunakan Docker untuk menginstal NocoBase dan database, Anda dapat mengunggah file `.sql` ke server, lalu menggunakan perintah `docker exec` untuk melakukan impor. Asumsikan nama kontainer PostgreSQL Anda adalah `my-nocobase-db`, dan nama filenya adalah `ticket_system.sql`:

  ```bash
  # Salin file sql ke dalam kontainer
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Masuk ke kontainer untuk mengeksekusi perintah impor
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/ticket_system.sql
  ```
* **Opsi B: Melalui klien database jarak jauh**
  Jika database Anda mengekspos port, Anda dapat menggunakan klien database grafis apa pun (seperti DBeaver, Navicat, pgAdmin, dll.) untuk terhubung ke database, buka jendela kueri baru, tempel seluruh isi file `.sql`, lalu eksekusi.

**Langkah 3: Hubungkan database dan mulai aplikasi**

Konfigurasikan parameter mulai NocoBase Anda (seperti variabel lingkungan `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, dll.), agar mengarah ke database tempat Anda baru saja mengimpor data. Kemudian, mulai layanan NocoBase secara normal.

### Catatan

* **Izin database**: Metode ini mengharuskan Anda memiliki akun dan kata sandi yang dapat mengoperasikan database secara langsung.
* **Status plugin**: Setelah impor berhasil, meskipun data plugin komersial yang disertakan dalam sistem ada, jika Anda tidak menginstal dan mengaktifkan plugin terkait secara lokal, fungsi terkait tidak akan ditampilkan dan digunakan, tetapi ini tidak akan menyebabkan aplikasi mogok.

---

## Ringkasan dan Perbandingan

| Fitur | Metode 1: Pengelola Cadangan | Metode 2: Impor SQL Langsung |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Pengguna Sasaran** | Pengguna **Profesional/Perusahaan** | **Semua pengguna** (termasuk versi Komunitas) |
| **Kemudahan Operasi** | ⭐⭐⭐⭐⭐ (Sangat sederhana, operasi UI) | ⭐⭐⭐ (Memerlukan pengetahuan dasar database) |
| **Persyaratan Lingkungan** | **Ketat**, database, versi sistem, dll. harus sangat kompatibel | **Umum**, memerlukan kompatibilitas database |
| **Ketergantungan Plugin** | **Ketergantungan kuat**, plugin akan divalidasi saat pemulihan, kekurangan plugin apa pun akan menyebabkan **kegagalan pemulihan**. | **Fungsi sangat bergantung pada plugin**. Data dapat diimpor secara independen, sistem memiliki fungsi dasar. Namun jika plugin terkait tidak ada, fungsi terkait akan **sama sekali tidak dapat digunakan**. |
| **File Sistem** | **Tersimpan lengkap** (templat cetak, file unggahan, dll.) | **Akan hilang** (templat cetak, file unggahan, dll.) |
| **Skenario Rekomendasi** | Pengguna perusahaan, dengan lingkungan yang terkendali dan konsisten, memerlukan fungsi lengkap | Kekurangan beberapa plugin, mengejar kompatibilitas dan fleksibilitas tinggi, pengguna non-Profesional/Perusahaan, dapat menerima hilangnya fungsi file |

Semoga panduan ini dapat membantu Anda menerapkan sistem tiket dengan lancar. Jika Anda menemui masalah selama proses pengoperasian, jangan ragu untuk menghubungi kami kapan saja!