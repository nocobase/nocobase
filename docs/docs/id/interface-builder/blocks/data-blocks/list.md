---
pkg: "@nocobase/plugin-block-list"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Blok Daftar

## Pendahuluan

Blok Daftar menampilkan data dalam format daftar, cocok untuk skenario tampilan data seperti daftar tugas, berita, dan informasi produk.

## Konfigurasi Blok

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Mengatur Lingkup Data

Seperti yang ditunjukkan: Saring pesanan dengan status "Dibatalkan".

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Untuk informasi lebih lanjut, lihat [Mengatur Lingkup Data](/interface-builder/blocks/block-settings/data-scope)

### Mengatur Aturan Pengurutan

Seperti yang ditunjukkan: Urutkan berdasarkan jumlah pesanan secara menurun.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Untuk informasi lebih lanjut, lihat [Mengatur Aturan Pengurutan](/interface-builder/blocks/block-settings/sorting-rule)

## Mengkonfigurasi Bidang

### Bidang dari Koleksi Ini

> **Catatan**: Bidang dari koleksi yang diwarisi (yaitu, bidang koleksi induk) secara otomatis digabungkan dan ditampilkan dalam daftar bidang saat ini.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Bidang dari Koleksi Terkait

> **Catatan**: Bidang dari koleksi terkait dapat ditampilkan (saat ini hanya mendukung relasi satu-ke-satu).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Untuk konfigurasi bidang daftar, lihat [Bidang Detail](/interface-builder/fields/generic/detail-form-item)

## Mengkonfigurasi Aksi

### Aksi Global

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [Saring](/interface-builder/actions/types/filter)
- [Tambah](/interface-builder/actions/types/add-new)
- [Hapus](/interface-builder/actions/types/delete)
- [Segarkan](/interface-builder/actions/types/refresh)
- [Impor](/interface-builder/actions/types/import)
- [Ekspor](/interface-builder/actions/types/export)
- [Cetak Templat](/template-print/index)
- [Perbarui Massal](/interface-builder/actions/types/bulk-update)
- [Ekspor Lampiran](/interface-builder/actions/types/export-attachments)
- [Picu Alur Kerja](/interface-builder/actions/types/trigger-workflow)
- [Aksi JS](/interface-builder/actions/types/js-action)
- [Karyawan AI](/interface-builder/actions/types/ai-employee)

### Aksi Baris

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [Edit](/interface-builder/actions/types/edit)
- [Hapus](/interface-builder/actions/types/delete)
- [Tautkan](/interface-builder/actions/types/link)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Perbarui Catatan](/interface-builder/actions/types/update-record)
- [Cetak Templat](/template-print/index)
- [Picu Alur Kerja](/interface-builder/actions/types/trigger-workflow)
- [Aksi JS](/interface-builder/actions/types/js-action)
- [Karyawan AI](/interface-builder/actions/types/ai-employee)