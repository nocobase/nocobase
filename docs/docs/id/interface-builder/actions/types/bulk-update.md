---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pembaruan Massal

## Pendahuluan

Aksi pembaruan massal digunakan ketika Anda perlu menerapkan pembaruan yang sama pada sekelompok catatan. Sebelum melakukan pembaruan massal, pengguna perlu menentukan logika penugasan bidang untuk pembaruan tersebut terlebih dahulu. Logika ini akan diterapkan pada semua catatan yang dipilih saat pengguna mengklik tombol pembaruan.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Konfigurasi Aksi

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Data yang Akan Diperbarui

Terpilih/Semua, defaultnya adalah Terpilih.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Penugasan Bidang

Atur bidang-bidang untuk pembaruan massal. Hanya bidang yang diatur yang akan diperbarui.

Seperti yang ditunjukkan pada gambar, konfigurasikan aksi pembaruan massal di tabel pesanan untuk memperbarui data yang dipilih secara massal menjadi "Menunggu Persetujuan".

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Tombol Edit](/interface-builder/actions/action-settings/edit-button): Edit judul, tipe, dan ikon tombol;
- [Aturan Keterkaitan](/interface-builder/actions/action-settings/linkage-rule): Menampilkan/menyembunyikan tombol secara dinamis;
- [Konfirmasi Ulang](/interface-builder/actions/action-settings/double-check)