:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Mengatur Lingkup Data

## Pendahuluan

Pengaturan lingkup data untuk *field* relasi mirip dengan pengaturan lingkup data untuk *block*. Ini berfungsi untuk menetapkan kondisi filter bawaan untuk data yang berelasi.

## Petunjuk Penggunaan

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Nilai Statis

Contoh: Hanya produk yang belum dihapus yang dapat dipilih untuk dihubungkan.

> Daftar *field* berisi *field* dari **koleksi** target *field* relasi.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Nilai Variabel

Contoh: Hanya produk dengan tanggal layanan setelah tanggal pesanan yang dapat dipilih untuk dihubungkan.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Untuk informasi lebih lanjut tentang variabel, lihat [Variabel](/interface-builder/variables)

### Keterkaitan *Field* Relasi

Keterkaitan antar *field* relasi dicapai dengan mengatur lingkup data.

Contoh: **Koleksi** Pesanan memiliki *field* relasi Satu-ke-Banyak "Produk Peluang" dan *field* relasi Banyak-ke-Satu "Peluang". **Koleksi** Produk Peluang memiliki *field* relasi Banyak-ke-Satu "Peluang". Dalam *block* formulir pesanan, data yang dapat dipilih untuk "Produk Peluang" difilter untuk menampilkan hanya produk peluang yang terkait dengan "Peluang" yang saat ini dipilih dalam formulir.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)