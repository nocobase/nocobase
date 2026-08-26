---
pkg: "@nocobase/plugin-kanban"
title: "Block Kanban"
description: "Block Kanban: menampilkan record data berdasarkan kolom group, mendukung peralihan style, tambah cepat, konfigurasi Popup, drag sort dan klik card untuk membuka."
keywords: "Block Kanban, Kanban, group data, drag sort, tambah cepat, pengaturan Popup, layout card, interface builder, NocoBase"
---

# Kanban

## Pengantar

Block Kanban menampilkan record data berdasarkan kolom group, cocok untuk skenario yang memerlukan tampilan dan pemajuan data berdasarkan tahap seperti transisi status tugas, tindak lanjut tahap penjualan, pemrosesan tiket, dll.

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_51_PM.png)

## Konfigurasi Block

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM.png)

### Pengaturan Group

Block Kanban harus terlebih dahulu menentukan Field group, sistem akan mendistribusikan record ke kolom yang berbeda berdasarkan nilai Field.

- Field group mendukung Field single select, Field many-to-one.
- Judul kolom dan warna kolom Field single select akan langsung menggunakan label dan warna yang dikonfigurasi di opsi Field.
- Opsi group Field many-to-one akan dimuat dari record Table relasi.
- Saat Field group adalah Field many-to-one, dapat dikonfigurasi tambahan:
	- Field judul: menentukan nilai Field relasi mana yang ditampilkan di header kolom.
	- Field warna: menentukan warna latar belakang header kolom dan container kolom.
- Melalui "Pilih nilai group" dapat mengontrol kolom mana yang ditampilkan, serta urutan tampilan kolom.
- Record dengan nilai group kosong akan ditampilkan di kolom "Tidak Diketahui".

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM%20(1).png)
![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM.png)

### Style

Kanban mendukung dua style kolom:

- `Classic`: Mempertahankan latar belakang kolom default yang lebih ringan.
- `Filled`: Menggunakan warna kolom untuk merender header kolom dan latar belakang container kolom, cocok untuk skenario dengan warna status yang lebih jelas.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM%20(1).png)

### Pengaturan Drag

Setelah drag diaktifkan, Anda dapat langsung men-drag card untuk menyesuaikan urutan.

- Setelah mengaktifkan "Aktifkan drag sort", Anda dapat lebih lanjut memilih "Field drag sort".
- Drag sort bergantung pada Field sort, Field sort harus cocok dengan Field group saat ini.
- Saat men-drag card ke kolom lain, akan sekaligus mengupdate nilai Field group dan posisi sort record.

Untuk informasi lebih lanjut, lihat [Field Sort](/data-sources/field-sort)

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_55_PM.png)

### Tambah Cepat

Setelah mengaktifkan "Tambah Cepat", tombol plus akan ditampilkan di sebelah kanan judul setiap kolom.

- Klik tombol plus header kolom, akan membuka Popup tambah baru dengan kolom saat ini sebagai konteks.
- Form tambah akan otomatis membawa nilai group yang sesuai dengan kolom saat ini.
- Jika kolom saat ini adalah kolom "Tidak Diketahui", maka Field group akan diisi sebelumnya dengan nilai kosong.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_57_PM.png)

### Pengaturan Popup

"Pengaturan Popup" level Block digunakan untuk mengontrol perilaku Popup yang dibuka oleh tombol tambah cepat header kolom.

- Dapat dikonfigurasi cara membuka, misalnya drawer, dialog, atau page.
- Dapat dikonfigurasi ukuran Popup.
- Dapat di-bind ke template Popup atau melanjutkan menambah konten Block di Popup.

### Jumlah Pagination per Kolom

Digunakan untuk mengontrol jumlah record yang dimuat pertama kali di setiap kolom. Saat record dalam kolom banyak, dapat terus scroll untuk memuat.

### Lebar Kolom

Digunakan untuk mengatur lebar setiap kolom, memudahkan penyesuaian efek tampilan berdasarkan kepadatan konten card.

### Atur Cakupan Data

Digunakan untuk membatasi cakupan data yang ditampilkan di Block Kanban.

Misalnya: Hanya menampilkan tugas yang dibuat oleh penanggung jawab saat ini, atau hanya menampilkan record di proyek tertentu.

Untuk informasi lebih lanjut, lihat [Atur Cakupan Data](/interface-builder/blocks/block-settings/data-scope)


## Konfigurasi Field

Card Kanban menggunakan layout Field tipe detail di dalamnya untuk menampilkan informasi ringkasan record.

### Tambah Field

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM.png)

Konfigurasi Field lihat [Field Detail](/interface-builder/fields/generic/detail-form-item)

### Pengaturan Card

Card itu sendiri mendukung pengaturan berikut:

- Aktifkan klik untuk membuka: Setelah diaktifkan, klik card dapat membuka record saat ini.
- Pengaturan Popup: Dapat mengkonfigurasi cara membuka, ukuran, dan template Popup secara terpisah setelah card diklik.
- Layout: Dapat menyesuaikan layout tampilan Field di card.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_56_PM.png)

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(2).png)

## Konfigurasi Action

Block Kanban mendukung konfigurasi Action global di bagian atas. Tipe Action yang dapat dilihat secara spesifik akan berubah berdasarkan kemampuan action yang sudah diaktifkan di lingkungan saat ini.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_10_02_PM.png)

### Action Global

- [Tambah Baru](/interface-builder/actions/types/add-new)
- [Popup](/interface-builder/actions/types/pop-up)
- [Link](/interface-builder/actions/types/link)
- [Refresh](/interface-builder/actions/types/refresh)
- [Custom Request](/interface-builder/actions/types/custom-request)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)
