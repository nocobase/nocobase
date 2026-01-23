:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Penyimpanan Vektor

## Pendahuluan

Dalam basis pengetahuan, saat menyimpan dokumen, dokumen akan diubah menjadi vektor. Demikian pula, saat mengambil dokumen, istilah pencarian juga akan diubah menjadi vektor. Kedua proses ini memerlukan `Embedding model` untuk memvektorisasi teks asli.

Dalam plugin Basis Pengetahuan AI, penyimpanan vektor adalah gabungan antara `Embedding model` dan database vektor.

## Manajemen Penyimpanan Vektor

Buka halaman konfigurasi plugin Karyawan AI, klik tab `Vector store`, lalu pilih `Vector store` untuk masuk ke halaman manajemen penyimpanan vektor.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Klik tombol `Add new` di pojok kanan atas untuk menambahkan penyimpanan vektor baru:

- Pada kolom input `Name`, masukkan nama penyimpanan vektor;
- Pada `Vector store`, pilih database vektor yang sudah dikonfigurasi. Lihat: [Database Vektor](/ai-employees/knowledge-base/vector-database);
- Pada `LLM service`, pilih layanan LLM yang sudah dikonfigurasi. Lihat: [Manajemen Layanan LLM](/ai-employees/quick-start/llm-service);
- Pada kolom input `Embedding model`, masukkan nama model `Embedding` yang akan digunakan;

Klik tombol `Submit` untuk menyimpan informasi penyimpanan vektor.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)