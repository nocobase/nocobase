---
pkg: "@nocobase/plugin-block-list"
title: "Block List"
description: "Block List: menampilkan data dari data source dalam bentuk list, mendukung layout card, pagination, filter, konfigurasi Action."
keywords: "Block List, ListBlock, list data, layout card, pagination filter, interface builder, NocoBase"
---
# Block List

## Pengantar

Block List menampilkan data dalam bentuk list, cocok untuk skenario tampilan data seperti list tugas, news, informasi produk, dll.

## Konfigurasi Block

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Atur Cakupan Data

Seperti pada gambar: Filter dokumen dengan status pesanan adalah Cancel

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Untuk informasi lebih lanjut, lihat [Atur Cakupan Data](/interface-builder/blocks/block-settings/data-scope)

### Atur Aturan Sort

Seperti pada gambar: Sort secara descending berdasarkan jumlah pesanan

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Untuk informasi lebih lanjut, lihat [Atur Aturan Sort](/interface-builder/blocks/block-settings/sorting-rule)

## Konfigurasi Field

### Field Table Ini

> **Perhatian**: Field di Table inheritance (yaitu Field Table parent) akan otomatis digabungkan dan ditampilkan di daftar Field saat ini.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Field Table Relasi

> **Perhatian**: Mendukung menampilkan Field Table relasi (saat ini hanya mendukung relasi to-one).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Konfigurasi Field List lihat [Field Detail](/interface-builder/fields/generic/detail-form-item)

## Konfigurasi Action

### Action Global

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [Filter](/interface-builder/actions/types/filter)
- [Tambah](/interface-builder/actions/types/add-new)
- [Hapus](/interface-builder/actions/types/delete)
- [Refresh](/interface-builder/actions/types/refresh)
- [Impor](/interface-builder/actions/types/import)
- [Ekspor](/interface-builder/actions/types/export)
- [Print Template](/template-print/index)
- [Bulk Update](/interface-builder/actions/types/bulk-update)
- [Ekspor Lampiran](/interface-builder/actions/types/export-attachments)
- [Trigger Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)

### Action Baris

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)


- [Edit](/interface-builder/actions/types/edit)
- [Hapus](/interface-builder/actions/types/delete)
- [Link](/interface-builder/actions/types/link)
- [Popup](/interface-builder/actions/types/pop-up)
- [Update Record](/interface-builder/actions/types/update-record)
- [Print Template](/template-print/index)
- [Trigger Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)
