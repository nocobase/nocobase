---
pkg: "@nocobase/plugin-action-bulk-edit"
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/actions/types/bulk-edit).
:::

# Edit Massal

## Pengantar

Edit Massal cocok untuk skenario yang memerlukan pembaruan data secara massal yang fleksibel. Setelah mengeklik tombol Edit Massal, Anda dapat mengonfigurasi formulir edit massal di jendela pop-up dan menetapkan strategi pembaruan yang berbeda untuk setiap bidang.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM.png)


## Konfigurasi Tindakan

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM%20(1).png)


## Panduan Pengguna

### Konfigurasi Formulir Edit Massal

1. Tambahkan tombol Edit Massal.

2. Atur cakupan edit massal: Terpilih/Semua, defaultnya adalah Terpilih.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_14_AM.png)

3. Tambahkan formulir edit massal.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_14_AM.png)

4. Konfigurasikan bidang yang perlu diedit dan tambahkan tombol kirim.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM%20(1).png)

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM.png)

### Pengiriman Formulir

1. Pilih baris data yang perlu diedit.

2. Pilih mode edit untuk bidang tersebut dan isi nilai yang akan dikirimkan.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_10_33_AM.png)

:::info{title=Mode Edit yang Tersedia}
* **Jangan perbarui**: Bidang tetap tidak berubah.
* **Ubah menjadi**: Memperbarui bidang ke nilai yang dikirimkan.
* **Kosongkan**: Menghapus data pada bidang tersebut.

:::

3. Kirim formulir.