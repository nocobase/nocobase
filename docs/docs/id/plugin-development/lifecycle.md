:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Siklus Hidup

Bagian ini menjelaskan *hook* siklus hidup untuk *plugin* di sisi server dan sisi klien, membantu pengembang mendaftarkan dan melepaskan sumber daya dengan benar.

Ini dapat dibandingkan dengan siklus hidup FlowModel untuk menyoroti konsep-konsep umum.

## Konten yang Disarankan

-   *Callback* yang dipicu saat *plugin* diinstal, diaktifkan, dinonaktifkan, atau dihapus.
-   Waktu pemasangan, pembaruan, dan penghancuran komponen sisi klien.
-   Rekomendasi untuk menangani tugas asinkron dan kesalahan selama siklus hidup.