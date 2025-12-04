:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Aturan Keterkaitan Bidang

## Pendahuluan

Aturan keterkaitan bidang memungkinkan penyesuaian status bidang secara dinamis pada blok Formulir/Detail berdasarkan tindakan pengguna. Saat ini, blok yang mendukung aturan keterkaitan bidang meliputi:

- [Blok Formulir](/interface-builder/blocks/data-blocks/form)
- [Blok Detail](/interface-builder/blocks/data-blocks/details)
- [Sub-formulir](/interface-builder/fields/specific/sub-form)

## Petunjuk Penggunaan

### **Blok Formulir**

Dalam blok Formulir, aturan keterkaitan dapat menyesuaikan perilaku bidang secara dinamis berdasarkan kondisi tertentu:

- **Mengontrol tampilan/penyembunyian bidang**: Menentukan apakah bidang saat ini ditampilkan berdasarkan nilai bidang lain.
- **Menetapkan bidang sebagai wajib diisi**: Menetapkan bidang secara dinamis sebagai wajib diisi atau tidak wajib diisi dalam kondisi tertentu.
- **Mengisi nilai**: Secara otomatis mengisi nilai pada bidang berdasarkan kondisi.
- **Menjalankan JavaScript tertentu**: Menulis JavaScript sesuai kebutuhan bisnis.

### **Blok Detail**

Dalam blok Detail, aturan keterkaitan terutama digunakan untuk mengontrol tampilan dan penyembunyian bidang secara dinamis pada blok Detail.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Keterkaitan Properti

### Mengisi Nilai

Contoh: Ketika pesanan ditandai sebagai pesanan tambahan, status pesanan secara otomatis diisi dengan nilai 'Menunggu Peninjauan'.

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Wajib Diisi

Contoh: Ketika status pesanan adalah 'Sudah Dibayar', bidang jumlah pesanan wajib diisi.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Tampilkan/Sembunyikan

Contoh: Akun pembayaran dan jumlah total hanya ditampilkan ketika status pesanan adalah 'Menunggu Pembayaran'.

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)