---
pkg: "@nocobase/plugin-action-export-pro"
title: "Action Ekspor Lampiran"
description: "Action Ekspor Lampiran: mengekspor lampiran file yang terkait dengan record, mendukung ekspor batch, download paket terkompresi."
keywords: "Ekspor Lampiran, ExportAttachments, ekspor lampiran, download file, interface builder, NocoBase"
---
# Ekspor Lampiran

## Pengantar

Ekspor lampiran mendukung ekspor Field terkait lampiran ke format paket terkompresi.

#### Konfigurasi Ekspor Lampiran

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Konfigurasi Field lampiran yang akan diekspor, mendukung multi-select.
- Anda dapat memilih apakah akan membuat folder untuk setiap record.

Aturan penamaan file:

- Jika memilih untuk membuat folder untuk setiap record, aturan penamaan file adalah: `{nilai Field judul record}/{nama Field lampiran}[-{nomor file}].{ekstensi file}`.
- Jika memilih untuk tidak membuat folder, aturan penamaan file adalah: `{nilai Field judul record}-{nama Field lampiran}[-{nomor file}].{ekstensi file}`.

Nomor file akan otomatis dihasilkan saat ada beberapa lampiran di Field lampiran.


- [Aturan Linkage](/interface-builder/actions/action-settings/linkage-rule): tampilan/sembunyi tombol secara dinamis;
- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): Edit judul, tipe, ikon tombol;
