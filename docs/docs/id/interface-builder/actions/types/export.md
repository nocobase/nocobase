---
pkg: "@nocobase/plugin-action-export"
title: "Action Ekspor"
description: "Action Ekspor: mengekspor data ke format Excel dan lainnya, mendukung ekspor halaman saat ini/semua data."
keywords: "Action Ekspor, Export, ekspor Excel, ekspor data, interface builder, NocoBase"
---
# Ekspor#

## Pengantar

Fitur ekspor memungkinkan ekspor record yang difilter ke format **Excel**, mendukung konfigurasi Field yang akan diekspor. Pengguna dapat memilih Field yang akan diekspor sesuai kebutuhan untuk analisis data, pemrosesan, atau pengarsipan selanjutnya. Fitur ini meningkatkan fleksibilitas operasi data, terutama cocok untuk skenario di mana data perlu ditransfer ke platform lain atau diproses lebih lanjut.

### Highlight Fitur:
- **Pemilihan Field**: Pengguna dapat mengkonfigurasi Field yang akan diekspor untuk memastikan data yang diekspor akurat dan ringkas.
- **Mendukung Format Excel**: Data yang diekspor akan disimpan sebagai file Excel standar, mudah diintegrasikan dengan data lain untuk analisis.

Melalui fitur ini, pengguna dapat dengan mudah mengekspor data penting dalam pekerjaan untuk digunakan secara eksternal, meningkatkan efisiensi kerja.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)
## Konfigurasi Action

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Field yang Dapat Diekspor

- Level pertama: semua Field dari collection saat ini;
- Level kedua: jika Field relasi, perlu memilih Field dari Table yang terkait;
- Level ketiga: hanya menangani tiga level, Field relasi level terakhir tidak ditampilkan;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Aturan Linkage](/interface-builder/actions/action-settings/linkage-rule): tampilan/sembunyi tombol secara dinamis;
- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): Edit judul, tipe, ikon tombol;
