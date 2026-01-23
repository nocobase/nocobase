:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Blok Tabel

## Pendahuluan

Blok Tabel adalah salah satu blok data inti bawaan **NocoBase**, yang terutama digunakan untuk menampilkan dan mengelola data terstruktur dalam format tabel. Blok ini menawarkan opsi konfigurasi yang fleksibel, memungkinkan pengguna untuk menyesuaikan kolom tabel, lebar kolom, aturan pengurutan, dan cakupan data sesuai kebutuhan, memastikan data yang ditampilkan dalam tabel sesuai dengan kebutuhan bisnis tertentu.

#### Fitur Utama:
- **Konfigurasi Kolom Fleksibel**: Anda dapat menyesuaikan kolom dan lebar kolom tabel untuk memenuhi berbagai kebutuhan tampilan data.
- **Aturan Pengurutan**: Mendukung pengurutan data tabel. Pengguna dapat mengatur data dalam urutan naik atau turun berdasarkan bidang yang berbeda.
- **Pengaturan Cakupan Data**: Dengan mengatur cakupan data, pengguna dapat mengontrol rentang data yang ditampilkan, menghindari gangguan dari data yang tidak relevan.
- **Konfigurasi Aksi**: Blok Tabel memiliki berbagai opsi aksi bawaan. Pengguna dapat dengan mudah mengonfigurasi aksi seperti Filter, Tambah Baru, Edit, dan Hapus untuk manajemen data yang cepat.
- **Edit Cepat**: Mendukung pengeditan data langsung di dalam tabel, menyederhanakan proses operasional dan meningkatkan efisiensi kerja.

## Pengaturan Blok

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Aturan Keterkaitan Blok

Kontrol perilaku blok (misalnya, apakah akan ditampilkan atau menjalankan JavaScript) melalui aturan keterkaitan.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Untuk detail lebih lanjut, lihat [Aturan Keterkaitan](/interface-builder/linkage-rule)

### Atur Cakupan Data

Contoh: Secara default, filter pesanan dengan "Status" "Dibayar".

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Untuk detail lebih lanjut, lihat [Atur Cakupan Data](/interface-builder/blocks/block-settings/data-scope)

### Atur Aturan Pengurutan

Contoh: Tampilkan pesanan dalam urutan tanggal menurun.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Untuk detail lebih lanjut, lihat [Atur Aturan Pengurutan](/interface-builder/blocks/block-settings/sorting-rule)

### Aktifkan Edit Cepat

Aktifkan "Edit Cepat" di pengaturan blok dan pengaturan kolom tabel untuk menyesuaikan kolom mana yang dapat diedit dengan cepat.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Aktifkan Tabel Pohon

Ketika tabel data adalah tabel hierarkis (pohon), blok tabel dapat memilih untuk mengaktifkan fitur "Aktifkan Tabel Pohon". Secara default, opsi ini dinonaktifkan. Setelah diaktifkan, blok akan menampilkan data dalam struktur pohon dan mendukung opsi konfigurasi serta operasi yang sesuai.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Perluas Semua Baris Secara Default

Ketika tabel pohon diaktifkan, blok mendukung perluasan semua data anak secara default saat dimuat.

## Konfigurasi Bidang

### Bidang Koleksi Ini

> **Catatan**: Bidang dari koleksi yang diwarisi (yaitu, bidang koleksi induk) secara otomatis digabungkan dan ditampilkan dalam daftar bidang saat ini.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Bidang Koleksi Terkait

> **Catatan**: Mendukung tampilan bidang dari koleksi terkait (saat ini hanya mendukung hubungan satu-ke-satu).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Kolom Kustom Lainnya

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## Konfigurasi Aksi

### Aksi Global

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Filter](/interface-builder/actions/types/filter)
- [Tambah Baru](/interface-builder/actions/types/add-new)
- [Hapus](/interface-builder/actions/types/delete)
- [Segarkan](/interface-builder/actions/types/refresh)
- [Impor](/interface-builder/actions/types/import)
- [Ekspor](/interface-builder/actions/types/export)
- [Cetak Templat](/template-print/index)
- [Perbarui Massal](/interface-builder/actions/types/bulk-update)
- [Ekspor Lampiran](/interface-builder/actions/types/export-attachments)
- [Picu alur kerja](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Karyawan AI](/interface-builder/actions/types/ai-employee)

### Aksi Baris

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Lihat](/interface-builder/actions/types/view)
- [Edit](/interface-builder/actions/types/edit)
- [Hapus](/interface-builder/actions/types/delete)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Tautkan](/interface-builder/actions/types/link)
- [Perbarui Catatan](/interface-builder/actions/types/update-record)
- [Cetak Templat](/template-print/index)
- [Picu alur kerja](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Karyawan AI](/interface-builder/actions/types/ai-employee)