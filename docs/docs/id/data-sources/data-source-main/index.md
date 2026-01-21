---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Basis Data Utama

## Pendahuluan

Basis data utama NocoBase dapat digunakan untuk menyimpan data bisnis maupun metadata aplikasi, termasuk data tabel sistem, data tabel kustom, dan lain-lain. Basis data utama ini mendukung basis data relasional seperti MySQL, PostgreSQL, dan lain-lain. Saat menginstal aplikasi NocoBase, basis data utama harus diinstal secara bersamaan dan tidak dapat dihapus.

## Instalasi

Ini adalah plugin bawaan, tidak perlu instalasi terpisah.

## Manajemen Koleksi

Sumber data utama menyediakan fungsionalitas manajemen koleksi yang lengkap, memungkinkan Anda membuat tabel baru melalui NocoBase dan menyinkronkan struktur tabel yang sudah ada dari basis data.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Menyinkronkan Tabel yang Sudah Ada dari Basis Data

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Salah satu fitur penting dari sumber data utama adalah kemampuannya untuk menyinkronkan tabel yang sudah ada di basis data ke NocoBase untuk dikelola. Ini berarti:

- **Melindungi Investasi yang Ada**: Jika Anda sudah memiliki banyak tabel bisnis di basis data Anda, tidak perlu membuatnya ulang – Anda dapat langsung menyinkronkan dan menggunakannya.
- **Integrasi Fleksibel**: Tabel yang dibuat melalui alat lain (seperti skrip SQL, alat manajemen basis data, dll.) dapat dikelola di bawah NocoBase.
- **Migrasi Progresif**: Mendukung migrasi sistem yang ada ke NocoBase secara bertahap, alih-alih melakukan refactoring sekaligus.

Melalui fitur "Muat dari Basis Data", Anda dapat:
1. Menjelajahi semua tabel di basis data
2. Memilih tabel yang perlu Anda sinkronkan
3. Mengidentifikasi struktur tabel dan tipe bidang secara otomatis
4. Mengimpornya ke NocoBase untuk dikelola dengan satu klik.

### Mendukung Berbagai Tipe Koleksi

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase mendukung pembuatan dan pengelolaan berbagai tipe koleksi:
- **Koleksi Umum**: memiliki bidang sistem yang umum digunakan secara bawaan;
- **Koleksi Warisan**: memungkinkan pembuatan tabel induk dari mana tabel turunan dapat diturunkan. Tabel turunan akan mewarisi struktur tabel induk dan dapat mendefinisikan kolomnya sendiri.
- **Koleksi Pohon**: tabel berstruktur pohon, saat ini hanya mendukung desain daftar kedekatan (adjacency list);
- **Koleksi Kalender**: untuk membuat tabel peristiwa terkait kalender;
- **Koleksi Berkas**: untuk mengelola penyimpanan berkas;
- **Koleksi Ekspresi**: untuk skenario ekspresi dinamis dalam alur kerja;
- **Koleksi SQL**: bukan tabel basis data aktual, melainkan menyajikan kueri SQL secara terstruktur dengan cepat;
- **Koleksi Tampilan Basis Data**: menghubungkan ke tampilan basis data yang sudah ada;
- **Koleksi FDW**: memungkinkan sistem basis data untuk langsung mengakses dan mengkueri data di sumber data eksternal, berdasarkan teknologi FDW;

### Mendukung Manajemen Klasifikasi Koleksi

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Tipe Bidang yang Beragam

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Konversi Tipe Bidang yang Fleksibel

NocoBase mendukung konversi tipe bidang yang fleksibel berdasarkan tipe basis data yang sama.

**Contoh: Opsi Konversi Bidang Tipe String**

Ketika sebuah bidang basis data bertipe String, bidang tersebut dapat dikonversi ke salah satu bentuk berikut di NocoBase:

- **Dasar**: Teks satu baris, Teks panjang, Nomor telepon, Email, URL, Kata sandi, Warna, Ikon
- **Pilihan**: Menu tarik-turun (pilihan tunggal), Grup radio
- **Media Kaya**: Markdown, Markdown (Vditor), Teks Kaya, Lampiran (URL)
- **Tanggal & Waktu**: Tanggal waktu (dengan zona waktu), Tanggal waktu (tanpa zona waktu)
- **Lanjutan**: Urutan, Pemilih koleksi, Enkripsi

Mekanisme konversi yang fleksibel ini berarti:
- **Tidak Perlu Modifikasi Struktur Basis Data**: Tipe penyimpanan dasar bidang tetap tidak berubah; hanya representasinya di NocoBase yang berubah.
- **Beradaptasi dengan Perubahan Bisnis**: Seiring dengan evolusi kebutuhan bisnis, Anda dapat dengan cepat menyesuaikan tampilan dan metode interaksi bidang.
- **Keamanan Data**: Proses konversi tidak memengaruhi integritas data yang sudah ada.

### Sinkronisasi Fleksibel Tingkat Bidang

NocoBase tidak hanya menyinkronkan seluruh tabel, tetapi juga mendukung manajemen sinkronisasi tingkat bidang yang terperinci:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Fitur Sinkronisasi Bidang:

1. **Sinkronisasi Waktu Nyata**: Ketika struktur tabel basis data berubah, bidang yang baru ditambahkan dapat disinkronkan kapan saja.
2. **Sinkronisasi Selektif**: Anda dapat secara selektif menyinkronkan bidang yang Anda butuhkan, bukan semua bidang.
3. **Pengenalan Tipe Otomatis**: Secara otomatis mengidentifikasi tipe bidang basis data dan memetakannya ke tipe bidang NocoBase.
4. **Menjaga Integritas Data**: Proses sinkronisasi tidak memengaruhi data yang sudah ada.

#### Skenario Penggunaan:

- **Evolusi Skema Basis Data**: Ketika kebutuhan bisnis berubah dan bidang baru perlu ditambahkan ke basis data, bidang tersebut dapat dengan cepat disinkronkan ke NocoBase.
- **Kolaborasi Tim**: Ketika anggota tim lain atau DBA menambahkan bidang di basis data, bidang tersebut dapat segera disinkronkan.
- **Mode Manajemen Hibrida**: Beberapa bidang dikelola melalui NocoBase, sementara yang lain melalui metode tradisional – kombinasi yang fleksibel.

Mekanisme sinkronisasi yang fleksibel ini memungkinkan NocoBase untuk berintegrasi dengan baik ke dalam arsitektur teknis yang ada, tanpa perlu mengubah praktik manajemen basis data yang sudah ada, sekaligus tetap menikmati kemudahan pengembangan low-code yang disediakan NocoBase.

Lihat lebih lanjut di bagian 「[Bidang Koleksi / Gambaran Umum](/data-sources/data-modeling/collection-fields)」.