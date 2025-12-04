---
pkg: "@nocobase/plugin-action-export"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Ekspor

## Pendahuluan

Fitur ekspor memungkinkan catatan yang telah difilter untuk diekspor dalam format **Excel**, serta mendukung konfigurasi bidang yang akan diekspor. Pengguna dapat memilih bidang yang mereka perlukan untuk diekspor, guna analisis data, pemrosesan, atau pengarsipan selanjutnya. Fitur ini meningkatkan fleksibilitas operasi data, terutama dalam skenario di mana data perlu ditransfer ke platform lain atau diproses lebih lanjut.

### Sorotan Fitur:
- **Pemilihan Bidang**: Pengguna dapat mengonfigurasi dan memilih bidang yang akan diekspor, memastikan data yang diekspor akurat dan ringkas.
- **Dukungan Format Excel**: Data yang diekspor akan disimpan sebagai file Excel standar, memudahkan integrasi dan analisis dengan data lain.

Dengan fitur ini, pengguna dapat dengan mudah mengekspor data penting dari pekerjaan mereka untuk penggunaan eksternal, sehingga meningkatkan efisiensi kerja.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## Konfigurasi Aksi

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Bidang yang Dapat Diekspor

- Tingkat pertama: Semua bidang dari koleksi saat ini;
- Tingkat kedua: Jika itu adalah bidang relasi, Anda perlu memilih bidang dari koleksi terkait;
- Tingkat ketiga: Hanya tiga tingkat yang diproses; bidang relasi pada tingkat terakhir tidak ditampilkan;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Aturan Keterkaitan](/interface-builder/actions/action-settings/linkage-rule): Menampilkan/menyembunyikan tombol secara dinamis;
- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): Mengedit judul, warna, dan ikon tombol;