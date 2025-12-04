:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Ikhtisar Ekstensi Blok

Di NocoBase 2.0, mekanisme ekstensi blok telah sangat disederhanakan. Pengembang hanya perlu mewarisi kelas dasar (base class) **FlowModel** yang sesuai dan mengimplementasikan metode antarmuka terkait (terutama metode `renderComponent()`) untuk dapat menyesuaikan blok dengan cepat.

## Kategori Blok

NocoBase mengategorikan blok menjadi tiga jenis, yang ditampilkan dalam grup di antarmuka konfigurasi:

- **Blok Data (Data blocks)**: Blok yang mewarisi dari `DataBlockModel` atau `CollectionBlockModel`
- **Blok Filter (Filter blocks)**: Blok yang mewarisi dari `FilterBlockModel`
- **Blok Lainnya (Other blocks)**: Blok yang secara langsung mewarisi dari `BlockModel`

> Pengelompokan blok ditentukan oleh kelas dasar yang sesuai. Logika klasifikasi didasarkan pada hubungan pewarisan dan tidak memerlukan konfigurasi tambahan.

## Deskripsi Kelas Dasar

Sistem menyediakan empat kelas dasar untuk ekstensi:

### BlockModel

**Model Blok Dasar**, kelas dasar blok yang paling serbaguna.

- Cocok untuk blok yang hanya menampilkan data dan tidak bergantung pada data
- Dikategorikan ke dalam grup **Blok Lainnya**
- Berlaku untuk skenario yang dipersonalisasi

### DataBlockModel

**Model Blok Data (tidak terikat ke tabel data)**, untuk blok dengan sumber data kustom.

- Tidak secara langsung terikat ke tabel data, dapat menyesuaikan logika pengambilan data
- Dikategorikan ke dalam grup **Blok Data**
- Berlaku untuk: memanggil API eksternal, pemrosesan data kustom, bagan statistik, dan skenario lainnya

### CollectionBlockModel

**Model Blok Koleksi**, untuk blok yang perlu diikat ke tabel data.

- Membutuhkan pengikatan ke kelas dasar model tabel data
- Dikategorikan ke dalam grup **Blok Data**
- Berlaku untuk: daftar, formulir, papan kanban, dan blok lain yang secara jelas bergantung pada tabel data tertentu

### FilterBlockModel

**Model Blok Filter**, untuk membangun blok kondisi filter.

- Kelas dasar model untuk membangun kondisi filter
- Dikategorikan ke dalam grup **Blok Filter**
- Biasanya bekerja sama dengan blok data

## Cara Memilih Kelas Dasar

Saat memilih kelas dasar, Anda dapat mengikuti prinsip-prinsip berikut:

- **Perlu diikat ke tabel data tertentu**: Prioritaskan `CollectionBlockModel`
- **Sumber data kustom**: Pilih `DataBlockModel`
- **Untuk mengatur kondisi filter dan bekerja sama dengan blok data**: Pilih `FilterBlockModel`
- **Tidak yakin bagaimana mengategorikan**: Pilih `BlockModel`

## Mulai Cepat

Membuat blok kustom hanya memerlukan tiga langkah:

1. Mewarisi kelas dasar yang sesuai (misalnya, `BlockModel`)
2. Mengimplementasikan metode `renderComponent()` untuk mengembalikan komponen React
3. Mendaftarkan model blok di dalam plugin

Untuk contoh yang lebih detail, silakan lihat [Menulis Plugin Blok](./write-a-block-plugin).