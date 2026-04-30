---
pkg: "@nocobase/plugin-action-bulk-edit"
title: "Action Bulk Edit"
description: "Action Bulk Edit: update batch Field tertentu pada record yang dipilih, mendukung modifikasi terpadu setelah multi-select."
keywords: "Bulk Edit, BulkEdit, update batch, multi-select, interface builder, NocoBase"
---
# Bulk Edit

## Pengantar

Bulk Edit cocok untuk skenario yang memerlukan update batch data secara fleksibel. Setelah mengklik tombol Bulk Edit, konfigurasi Form Bulk Edit di Popup, dan atur strategi update yang berbeda untuk Field.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM.png)


## Konfigurasi Action

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM%20(1).png)


## Panduan Penggunaan

### Konfigurasi Form Bulk Edit

1. Tambahkan tombol Bulk Edit.

2. Atur cakupan Bulk Edit: Selected/All, default adalah Selected.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_14_AM.png)

3. Tambahkan Form Bulk Edit.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_14_AM.png)

4. Konfigurasi Field yang perlu diedit dan tambahkan tombol submit.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM%20(1).png)

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM.png)

### Submit Form

1. Pilih baris data yang perlu diedit.

2. Pilih mode edit untuk Field dan masukkan nilai yang akan disubmit.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_10_33_AM.png)

:::info{title=Mode Edit yang Tersedia}
* Tidak update: Field tetap tidak berubah
* Ubah menjadi: Update Field menjadi nilai yang disubmit
* Kosongkan: Kosongkan data Field

:::

3. Submit Form.
