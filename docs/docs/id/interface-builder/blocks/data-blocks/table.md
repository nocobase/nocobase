---
title: "Block Table"
description: "Block Table: menampilkan data dari data source dalam bentuk Table, mendukung pagination, sort, filter, edit inline, konfigurasi tombol Action."
keywords: "Block Table, TableBlock, Table data, pagination sort, edit inline, interface builder, NocoBase"
---

# Block Table

## Pengantar


Block Table adalah salah satu Data Block inti yang sudah ada di **NocoBase**, terutama digunakan untuk menampilkan dan mengelola data terstruktur dalam bentuk Table. Memberikan opsi konfigurasi yang fleksibel, pengguna dapat mengkustomisasi kolom Table, lebar kolom, aturan sort, dan cakupan data, dll. sesuai kebutuhan, memastikan data yang ditampilkan di Table sesuai dengan kebutuhan bisnis tertentu.

#### Fungsi Utama:
- **Konfigurasi Kolom yang Fleksibel**: Dapat mengkustomisasi kolom Table dan lebar kolom untuk beradaptasi dengan kebutuhan tampilan data yang berbeda.
- **Aturan Sort**: Mendukung sort data Table, pengguna dapat mengurutkan data secara ascending atau descending berdasarkan Field yang berbeda.
- **Pengaturan Cakupan Data**: Melalui pengaturan cakupan data, pengguna dapat mengontrol cakupan data yang ditampilkan, menghindari gangguan dari data yang tidak relevan.
- **Konfigurasi Action**: Block Table dilengkapi dengan berbagai opsi Action, pengguna dapat dengan mudah mengkonfigurasi Action seperti filter, baru, edit, hapus, dll. untuk mengelola data dengan cepat.
- **Edit Cepat**: Mendukung edit data langsung di Table, menyederhanakan alur Action, meningkatkan efisiensi kerja.

## Konfigurasi Block

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Aturan Linkage Block

Mengontrol perilaku Block melalui aturan linkage (seperti apakah ditampilkan atau menjalankan JavaScript).

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Untuk informasi lebih lanjut, lihat [Aturan Linkage](/interface-builder/linkage-rule)

### Atur Cakupan Data

Contoh: Default filter pesanan dengan "status" sudah dibayar.

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Untuk informasi lebih lanjut, lihat [Atur Cakupan Data](/interface-builder/blocks/block-settings/data-scope)

### Atur Aturan Sort

Contoh: Tampilkan tanggal pesanan secara descending.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Untuk informasi lebih lanjut, lihat [Atur Aturan Sort](/interface-builder/blocks/block-settings/sorting-rule)

### Aktifkan Edit Cepat

Aktifkan "Edit Cepat" di konfigurasi Block dan konfigurasi kolom Table, kemudian Anda dapat mengkustomisasi kolom mana yang dapat diedit dengan cepat.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Aktifkan Tree Table

Saat Collection adalah Table tipe tree, Block Table dapat memilih untuk mengaktifkan fitur "Aktifkan Tree Table". Secara default tetap dinonaktifkan. Setelah diaktifkan, Block akan menampilkan data dalam struktur tree, dan mendukung opsi konfigurasi dan fungsi Action yang sesuai.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Default Expand Semua Baris

Saat Tree Table diaktifkan, mendukung default expand semua data anak saat Block dimuat.
## Konfigurasi Field

### Field Table Ini

> **Perhatian**: Field di Table inheritance (yaitu Field Table parent) akan otomatis digabungkan dan ditampilkan di daftar Field saat ini.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Field Table Relasi

> **Perhatian**: Mendukung menampilkan Field Table relasi (saat ini hanya mendukung relasi to-one).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Kolom Kustom Lainnya

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## Konfigurasi Action

### Action Global

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

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

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Lihat](/interface-builder/actions/types/view)
- [Edit](/interface-builder/actions/types/edit)
- [Hapus](/interface-builder/actions/types/delete)
- [Popup](/interface-builder/actions/types/pop-up)
- [Link](/interface-builder/actions/types/link)
- [Update Record](/interface-builder/actions/types/update-record)
- [Print Template](/template-print/index)
- [Trigger Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)
