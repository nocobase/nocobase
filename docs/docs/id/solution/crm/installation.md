:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/solution/crm/installation).
:::

# Cara Instalasi

> Versi saat ini menggunakan bentuk **cadangkan dan pulihkan** (backup and restore) untuk penerapan. Pada versi mendatang, kami mungkin akan menggantinya menjadi bentuk **migrasi inkremental** (incremental migration), untuk memudahkan integrasi solusi ke dalam sistem yang sudah Anda miliki.

Agar Anda dapat menerapkan solusi CRM 2.0 ke lingkungan NocoBase Anda sendiri dengan cepat dan lancar, kami menyediakan dua metode pemulihan. Silakan pilih yang paling sesuai berdasarkan versi pengguna dan latar belakang teknis Anda.

Sebelum memulai, pastikan:

- Anda sudah memiliki lingkungan dasar NocoBase yang sedang berjalan. Mengenai instalasi sistem utama, silakan merujuk ke [dokumen instalasi resmi](https://docs-cn.nocobase.com/welcome/getting-started/installation) yang lebih rinci.
- Versi NocoBase **v2.1.0-beta.2 ke atas**
- Anda telah mengunduh file sistem CRM yang sesuai:
  - **File cadangan**: [nocobase_crm_v2_backup_260223.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260223.nbdata) - Berlaku untuk Metode Satu
  - **File SQL**: [nocobase_crm_v2_sql_260223.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260223.zip) - Berlaku untuk Metode Dua

**Keterangan Penting**:
- Solusi ini dibuat berdasarkan database **PostgreSQL 16**, pastikan lingkungan Anda menggunakan PostgreSQL 16.
- **DB_UNDERSCORED tidak boleh true**: Silakan periksa file `docker-compose.yml` Anda, pastikan variabel lingkungan `DB_UNDERSCORED` tidak diatur ke `true`, jika tidak, akan terjadi konflik dengan cadangan solusi yang menyebabkan kegagalan pemulihan.

---

## Metode Satu: Menggunakan Manajer Cadangan untuk Memulihkan (Direkomendasikan untuk pengguna Edisi Profesional/Perusahaan)

Cara ini dilakukan melalui plugin "[Manajer Cadangan](https://docs-cn.nocobase.com/handbook/backups)" (Edisi Profesional/Perusahaan) bawaan NocoBase untuk pemulihan satu klik, pengoperasiannya paling sederhana. Namun, cara ini memiliki persyaratan tertentu terhadap lingkungan dan versi pengguna.

### Karakteristik Utama

* **Kelebihan**:
  1. **Operasi mudah**: Dapat diselesaikan di antarmuka UI, dapat memulihkan semua konfigurasi termasuk plugin secara lengkap.
  2. **Pemulihan lengkap**: **Mampu memulihkan semua file sistem**, termasuk file cetak templat, file yang diunggah pada bidang file dalam koleksi (collection), dll., untuk memastikan integritas fungsional.
* **Batasan**:
  1. **Terbatas untuk Edisi Profesional/Perusahaan**: "Manajer Cadangan" adalah plugin tingkat perusahaan, hanya tersedia untuk pengguna Edisi Profesional/Perusahaan.
  2. **Persyaratan lingkungan yang ketat**: Mengharuskan lingkungan database Anda (versi, pengaturan sensitivitas huruf, dll.) sangat kompatibel dengan lingkungan saat kami membuat cadangan.
  3. **Ketergantungan plugin**: Jika solusi menyertakan plugin komersial yang tidak ada di lingkungan lokal Anda, pemulihan akan gagal.

### Langkah-langkah Operasi

**Langkah 1: 【Sangat Disarankan】 Gunakan image `full` untuk menjalankan aplikasi**

Untuk menghindari kegagalan pemulihan yang disebabkan oleh kurangnya klien database, kami sangat menyarankan Anda menggunakan versi `full` dari image Docker. Image ini sudah menyertakan semua program pendukung yang diperlukan, sehingga Anda tidak perlu melakukan konfigurasi tambahan.

Contoh perintah untuk menarik image:

```bash
docker pull nocobase/nocobase:beta-full
```

Kemudian gunakan image ini untuk menjalankan layanan NocoBase Anda.

> **Catatan**: Jika tidak menggunakan image `full`, Anda mungkin perlu menginstal klien database `pg_dump` secara manual di dalam kontainer, proses ini rumit dan tidak stabil.

**Langkah 2: Aktifkan plugin "Manajer Cadangan"**

1. Masuk ke sistem NocoBase Anda.
2. Masuk ke **`Manajemen Plugin`**.
3. Temukan dan aktifkan plugin **`Manajer Cadangan`**.

**Langkah 3: Pulihkan dari file cadangan lokal**

1. Setelah mengaktifkan plugin, segarkan halaman.
2. Masuk ke menu sebelah kiri **`Manajemen Sistem`** -> **`Manajer Cadangan`**.
3. Klik tombol **`Pulihkan dari cadangan lokal`** di sudut kanan atas.
4. Seret file cadangan yang telah diunduh ke area unggah.
5. Klik **`Kirim`**, dan tunggu dengan sabar hingga sistem menyelesaikan pemulihan. Proses ini mungkin memakan waktu puluhan detik hingga beberapa menit.

### Hal-hal yang Perlu Diperhatikan

* **Kompatibilitas Database**: Ini adalah poin paling krusial dari metode ini. **Versi, set karakter, dan pengaturan sensitivitas huruf** database PostgreSQL Anda harus sesuai dengan file sumber cadangan. Terutama nama `schema` yang harus konsisten.
* **Kesesuaian Plugin Komersial**: Pastikan Anda telah memiliki dan mengaktifkan semua plugin komersial yang diperlukan oleh solusi, jika tidak, pemulihan akan terhenti.

---

## Metode Dua: Impor Langsung File SQL (Universal, lebih cocok untuk Edisi Komunitas)

Cara ini memulihkan data dengan mengoperasikan database secara langsung, melewati plugin "Manajer Cadangan", sehingga tidak ada batasan plugin Edisi Profesional/Perusahaan.

### Karakteristik Utama

* **Kelebihan**:
  1. **Tanpa batasan versi**: Berlaku untuk semua pengguna NocoBase, termasuk Edisi Komunitas.
  2. **Kompatibilitas tinggi**: Tidak bergantung pada alat `dump` di dalam aplikasi, selama dapat terhubung ke database maka dapat dioperasikan.
  3. **Toleransi kesalahan yang tinggi**: Jika solusi menyertakan plugin komersial yang tidak Anda miliki, fungsi terkait tidak akan diaktifkan, tetapi tidak akan memengaruhi penggunaan normal fungsi lainnya, dan aplikasi dapat dijalankan dengan sukses.
* **Batasan**:
  1. **Memerlukan kemampuan operasi database**: Pengguna perlu memiliki kemampuan dasar operasi database, misalnya cara mengeksekusi file `.sql`.
  2. **Kehilangan file sistem**: **Metode ini akan kehilangan semua file sistem**, termasuk file cetak templat, file yang diunggah pada bidang file dalam koleksi (collection), dll.

### Langkah-langkah Operasi

**Langkah 1: Siapkan database yang bersih**

Siapkan database baru yang kosong untuk data yang akan Anda impor.

**Langkah 2: Impor file `.sql` ke dalam database**

Dapatkan file database yang telah diunduh (biasanya dalam format `.sql`), dan impor isinya ke dalam database yang telah Anda siapkan pada langkah sebelumnya. Ada berbagai cara eksekusi, tergantung pada lingkungan Anda:

* **Opsi A: Melalui baris perintah server (Contoh dengan Docker)**
  Jika Anda menggunakan Docker untuk menginstal NocoBase dan database, Anda dapat mengunggah file `.sql` ke server, lalu menggunakan perintah `docker exec` untuk melakukan impor. Asumsikan nama kontainer PostgreSQL Anda adalah `my-nocobase-db`, dan nama filenya adalah `nocobase_crm_v2_sql_260223.sql`:

  ```bash
  # Salin file sql ke dalam kontainer
  docker cp nocobase_crm_v2_sql_260223.sql my-nocobase-db:/tmp/
  # Masuk ke kontainer untuk mengeksekusi perintah impor
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260223.sql
  ```
* **Opsi B: Melalui klien database jarak jauh (Navicat, dll.)**
  Jika port database Anda terbuka, Anda dapat menggunakan klien database grafis apa pun (seperti Navicat, DBeaver, pgAdmin, dll.) untuk terhubung ke database, lalu:
  1. Klik kanan pada database target
  2. Pilih "Jalankan File SQL" atau "Eksekusi Skrip SQL"
  3. Pilih file `.sql` yang telah diunduh dan eksekusi

**Langkah 3: Hubungkan database dan jalankan aplikasi**

Konfigurasikan parameter awal NocoBase Anda (seperti variabel lingkungan `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, dll.) agar mengarah ke database tempat Anda baru saja mengimpor data. Kemudian, jalankan layanan NocoBase secara normal.

### Hal-hal yang Perlu Diperhatikan

* **Izin Database**: Metode ini mengharuskan Anda memiliki akun dan kata sandi yang dapat mengoperasikan database secara langsung.
* **Status Plugin**: Setelah impor berhasil, meskipun data plugin komersial yang disertakan dalam sistem ada, jika Anda tidak menginstal dan mengaktifkan plugin terkait secara lokal, fungsi terkait tidak akan ditampilkan dan tidak dapat digunakan, namun hal ini tidak akan menyebabkan aplikasi rusak.

---

## Ringkasan dan Perbandingan

| Fitur | Metode Satu: Manajer Cadangan | Metode Dua: Impor Langsung SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Pengguna Sasaran** | Pengguna **Edisi Profesional/Perusahaan** | **Semua pengguna** (termasuk Edisi Komunitas) |
| **Kemudahan Operasi** | ⭐⭐⭐⭐⭐ (Sangat mudah, operasi UI) | ⭐⭐⭐ (Memerlukan pengetahuan dasar database) |
| **Persyaratan Lingkungan** | **Ketat**, database, versi sistem, dll. harus sangat kompatibel | **Umum**, memerlukan kompatibilitas database |
| **Ketergantungan Plugin** | **Ketergantungan kuat**, plugin akan divalidasi saat pemulihan, kekurangan plugin apa pun akan menyebabkan **pemulihan gagal**. | **Fungsi sangat bergantung pada plugin**. Data dapat diimpor secara independen, sistem memiliki fungsi dasar. Namun jika kekurangan plugin terkait, fungsi tersebut akan **sama sekali tidak dapat digunakan**. |
| **File Sistem** | **Tersimpan lengkap** (templat cetak, file unggahan, dll.) | **Akan hilang** (templat cetak, file unggahan, dll.) |
| **Skenario Rekomendasi** | Pengguna perusahaan, dengan lingkungan terkendali dan konsisten, memerlukan fungsi lengkap | Kekurangan beberapa plugin, mengejar kompatibilitas dan fleksibilitas tinggi, pengguna non-Profesional/Perusahaan, dapat menerima kehilangan fungsi file |

Kami berharap tutorial ini dapat membantu Anda menerapkan sistem CRM 2.0 dengan lancar. Jika Anda menemui masalah selama proses operasi, jangan ragu untuk menghubungi kami kapan saja!