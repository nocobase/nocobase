---
pkg: "@nocobase/plugin-action-bulk-update"
title: "Action Bulk Update"
description: "Action Bulk Update: update batch record yang dipilih, mendukung kondisi filter untuk update batch."
keywords: "Bulk Update, BulkUpdate, modifikasi batch, interface builder, NocoBase"
---
# Bulk Update

## Pengantar

Action Bulk Update digunakan ketika perlu melakukan update yang sama pada sekelompok record. Sebelum mengeksekusi Action Bulk Update, pengguna perlu mendefinisikan logika penugasan Field update terlebih dahulu. Logika ini akan diterapkan pada semua record yang dipilih ketika pengguna mengklik tombol update.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Konfigurasi Action

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Data yang Diupdate

Selected/All, default adalah Selected.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Penugasan Field

Atur Field untuk Bulk Update. Hanya Field yang ditetapkan yang akan diupdate.

Seperti pada gambar, konfigurasi Action Bulk Update di Table pesanan, update batch data yang dipilih menjadi "Menunggu Persetujuan".

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): Edit judul, tipe, ikon tombol;
- [Aturan Linkage](/interface-builder/actions/action-settings/linkage-rule): tampilan/sembunyi tombol secara dinamis;
- [Konfirmasi Ganda](/interface-builder/actions/action-settings/double-check)
