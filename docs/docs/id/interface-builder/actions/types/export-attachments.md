---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Ekspor Lampiran

## Pendahuluan

Fitur ekspor lampiran memungkinkan Anda mengekspor bidang-bidang terkait lampiran dalam format paket terkompresi.

#### Konfigurasi Ekspor Lampiran

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Konfigurasikan bidang lampiran yang akan diekspor; mendukung banyak pilihan.
- Anda dapat memilih apakah akan membuat folder untuk setiap catatan.

Aturan penamaan berkas:

- Jika Anda memilih untuk membuat folder untuk setiap catatan, aturan penamaan berkas adalah: `{nilai bidang judul catatan}/{nama bidang lampiran}[-{nomor urut berkas}].{ekstensi berkas}`.
- Jika Anda memilih untuk tidak membuat folder, aturan penamaan berkas adalah: `{nilai bidang judul catatan}-{nama bidang lampiran}[-{nomor urut berkas}].{ekstensi berkas}`.

Nomor urut berkas akan dibuat secara otomatis jika ada beberapa lampiran dalam satu bidang lampiran.

- [Aturan Keterkaitan](/interface-builder/actions/action-settings/linkage-rule): Menampilkan/menyembunyikan tombol secara dinamis;
- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): Mengedit judul, tipe, dan ikon tombol;