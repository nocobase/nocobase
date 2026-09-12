---
title: "Sistem Manajemen Bisnis Terintegrasi - Cara Instalasi"
description: "Instalasi dan deployment Sistem Manajemen Bisnis Terintegrasi: restore satu klik file backup nbdata melalui plugin Backup Manager. Membutuhkan NocoBase v2.1.0-alpha.40 ke atas, PostgreSQL 16, dan DB_UNDERSCORED tidak boleh true."
keywords: "Sistem Manajemen Bisnis Terintegrasi instalasi, All-in-One, restore backup, Backup Manager, nbdata, PostgreSQL, NocoBase"
---

# Cara Instalasi

Sistem Manajemen Bisnis Terintegrasi mencakup enam modul: **CRM (Manajemen Pelanggan), Manajemen Penjualan, Help Desk (Tiket), Manajemen Proyek, Manajemen Aset Tetap, dan Manajemen SDM**. Cukup lakukan restore satu klik atas file backup `.nbdata` melalui plugin "Backup Manager" bawaan NocoBase untuk mendapatkan data lengkap.

:::tip Prasyarat

- Sudah memiliki lingkungan NocoBase yang berjalan. Untuk instalasi sistem utama, lihat [dokumentasi instalasi resmi](https://docs-cn.nocobase.com/welcome/getting-started/installation)
- Versi NocoBase **v2.1.0-alpha.40 ke atas** (plugin Backup Manager bersifat open source mulai dari versi ini, tersedia di versi Community)
- Sudah mengunduh file backup: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata)

:::

:::warning Perhatian

- Solusi ini dibuat berbasis **PostgreSQL 16**, lingkungan Anda wajib menggunakan PostgreSQL 16
- **`DB_UNDERSCORED` tidak boleh `true`** — periksa `docker-compose.yml`, jika diset `true` restore akan gagal
- **Pemulihan akan menimpa SEMUA data aplikasi tujuan** — jika lingkungan tujuan sudah memiliki data, cadangkan dulu aplikasi saat ini lalu jalankan pemulihan dengan hati-hati

:::

Versi saat ini menggunakan bentuk **restore backup** untuk deployment, versi mendatang akan diganti menjadi migrasi inkremental agar mudah diintegrasikan ke sistem NocoBase yang sudah ada.

---

## Langkah-langkah

### Langkah 1: Jalankan aplikasi dengan image `full`

Sangat disarankan menggunakan image Docker versi `full` karena sudah menyertakan database client dan semua program pendukung tanpa konfigurasi tambahan:

```bash
docker pull nocobase/nocobase:alpha-full
```

Kemudian gunakan image ini untuk menjalankan layanan NocoBase.

:::tip

Jika tidak menggunakan image `full`, Anda mungkin perlu memasang database client `pg_dump` secara manual di dalam container, prosesnya rumit dan tidak stabil.

:::

### Langkah 2: Aktifkan plugin Backup Manager

1. Login ke sistem NocoBase
2. Buka **Manajemen Plugin**
3. Temukan dan aktifkan plugin **Backup Manager**

### Langkah 3: Restore dari file backup lokal

1. Setelah plugin diaktifkan, segarkan halaman
2. Buka menu kiri **Manajemen Sistem / Backup Manager**

   ![Tampilan utama Backup Manager](https://static-docs.nocobase.com/202510302154966.png)

3. Klik tombol **Restore from local backup** di kanan atas
4. Seret file `nocobase_all_in_one_backup_260521.nbdata` yang sudah diunduh ke area unggah

   ![Pulihkan dari file cadangan lokal (dialog unggah)](https://static-docs.nocobase.com/202510302155602.png)

5. Klik **Submit**, tunggu hingga restore selesai, biasanya beberapa puluh detik hingga beberapa menit

---

## Catatan

- **Kompatibilitas database** — versi PostgreSQL, character set, dan pengaturan case-sensitive harus sesuai dengan sumber backup, terutama nama `schema` harus sama
- **Kecocokan plugin komersial** — semua plugin komersial yang ada di backup harus diaktifkan terlebih dahulu di lokal, jika tidak restore akan terhenti. Plugin komersial yang terlibat dalam solusi terintegrasi antara lain: Mail Manager, Audit Log, AI Employees. Jika versi Community tidak memiliki plugin tersebut, akses fitur terkait tidak akan tampil, tetapi tidak memengaruhi modul lain

---

## Konfigurasi wajib setelah instalasi

Setelah restore selesai sistem sudah dapat dibuka, namun ada dua bagian konfigurasi yang **mengarah ke lingkungan demo kami**, perlu diganti ke milik Anda sendiri.

### 1. Engine penyimpanan file (OSS / lokal)

Engine penyimpanan default di backup demo mengarah ke Alibaba Cloud OSS yang kami gunakan untuk demo, Access Key tidak terbuka untuk publik, sehingga semua upload kolom file, template print, dan avatar AI Employees akan gagal.

Pada umumnya, beralih ke penyimpanan lokal sudah cukup. Jika butuh akselerasi CDN atau skenario file besar, gunakan OSS Anda sendiri.

**Langkah pergantian:**

1. Buka **Manajemen Plugin / Manajer Berkas** (atau langsung akses `/admin/settings/file-manager`)

2. **Opsi A — Gunakan penyimpanan lokal** (paling sederhana, cocok untuk self-deploy):

   - Temukan item **Local Storage** yang dibuat otomatis
   - Klik **Edit**, di bagian bawah panel konfigurasi centang **Set as default storage engine** → Submit

   ![Konfigurasi umum engine penyimpanan (bagian bawah "Set as default storage engine")](https://static-docs.nocobase.com/20240529115151.png)

   :::warning Perhatian

   Pada deployment Docker, penyimpanan lokal berada di dalam container, file akan hilang jika container dihapus. Untuk lingkungan produksi disarankan mount volume atau ganti ke cloud storage.

   :::

3. **Opsi B — Gunakan OSS / S3 / COS milik sendiri**:

   - Klik **Add new**, pilih tipe yang sesuai (Alibaba Cloud OSS / Amazon S3 / Tencent Cloud COS / S3 Pro)
   - Isi Access Key, Bucket, Region, domain, dan parameter lain, centang **Set as default storage engine**, lalu Submit

   ![Contoh konfigurasi engine penyimpanan Alibaba Cloud OSS](https://static-docs.nocobase.com/20240712220011.png)

4. Hapus atau nonaktifkan item OSS bawaan demo untuk menghindari penggunaan yang keliru

Untuk penjelasan parameter detail lihat [Gambaran umum engine penyimpanan](../../file-manager/storage/index.md).

### 2. Kunci layanan LLM AI Employees

Backup demo sudah memuat sejumlah item layanan LLM (OpenAI, Claude, Gemini, DeepSeek, Qwen, Kimi, dan lain-lain), API Key di dalamnya adalah milik kami dan **tidak berlaku untuk publik**. Fitur AI Employees tidak dapat digunakan sebelum diganti.

**Langkah konfigurasi:**

1. Buka **Pengaturan Sistem / AI Employees / LLM service** (atau akses `/admin/settings/ai/llm-services`)

   ![Masuk ke halaman konfigurasi LLM service](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

2. Pada daftar layanan bawaan, Anda dapat menyeret untuk mengurutkan, dan menggunakan switch `Enabled` untuk mengaktifkan atau menonaktifkan

   ![Daftar layanan LLM (aktif/nonaktif + urutkan)](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

3. Untuk setiap layanan yang akan digunakan:

   - Klik **Edit**
   - Ganti **API Key** dengan kunci milik Anda sendiri (peroleh dari akun penyedia layanan terkait: OpenAI, Anthropic, Google AI Studio, DeepSeek, Qwen, Kimi, dan lain-lain)
   - Jika melewati proxy atau relay domestik, sesuaikan **Base URL**
   - Pada **Enabled Models**, simpan model yang akan digunakan, sisanya dapat dihapus

   ![Edit layanan LLM (API Key, Base URL, Enabled Models)](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

4. Klik **Test flight** di bagian bawah untuk menguji konektivitas, jika berhasil klik **Submit** untuk menyimpan

   ![Test flight uji koneksi](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

5. Layanan yang tidak akan digunakan cukup di-Disabled, tidak perlu dihapus

Untuk konfigurasi detail lihat [Konfigurasi layanan LLM](../../ai-employees/features/llm-service.md).

:::tip

Kedua bagian ini wajib diganti setelah restore demo. Konfigurasi lain (Logo situs, SMTP, plugin enterprise, dan lain-lain) sesuaikan dengan kebutuhan.

:::

---

## Pertanyaan umum

### Apakah versi Community bisa digunakan? Apakah akan error?

Bisa langsung digunakan, tidak akan error. Backup Manager bersifat open source mulai dari `v2.1.0-alpha.40`, sehingga dapat dipasang pada versi Community. Demo menggunakan sebagian plugin enterprise (Mail Manager, Audit Log, AI Employees, dan lain-lain); jika versi Community tidak memiliki plugin tersebut, akses fitur terkait tidak akan tampil, namun tidak memengaruhi modul lain. Misalnya akses Audit Log akan hilang, tetapi modul inti seperti CRM, Sales, Tickets, Project, Assets, HR tetap berjalan normal sepenuhnya.

### Versi mana yang sebaiknya dipilih setelah restore?

Direkomendasikan menggunakan image `alpha-full` terbaru (`nocobase/nocobase:alpha-full`). Image `full` sudah menyertakan dependensi seperti database client untuk menghindari kekurangan tool saat restore.

### Logo tidak tampil setelah restore?

Logo demo di situs resmi dikonfigurasi dengan pembatasan domain sehingga tidak dapat dimuat dari domain lokal. Buka **Pengaturan Sistem** dan unggah ulang Logo milik Anda sendiri.

### Error saat unggah file (OSS Key error)?

Engine penyimpanan bawaan backup demo mengarah ke OSS yang kami gunakan untuk demo, dan Key-nya tidak terbuka untuk publik. Buka **Manajemen Plugin / Manajer Berkas**, atur **Local Storage** sebagai default storage, simpan, lalu upload akan berjalan normal.

Untuk penanganan detail lihat bagian [Engine penyimpanan file](#1-engine-penyimpanan-file-oss--lokal) di atas.

### Cara mengganti bahasa?

Solusi terintegrasi sudah dilokalkan ke 20+ bahasa (namespace `nb_demo`). Setelah restore default-nya bahasa Tionghoa, untuk beralih ke bahasa lain: **Pengaturan Sistem / aktifkan bahasa yang sesuai**.

### Bagaimana dengan upgrade inkremental?

Upgrade versi saat ini berbentuk penggantian penuh, modifikasi kustom akan tertimpa. Pastikan backup sebelum upgrade. Solusi migrasi inkremental sedang direncanakan.
