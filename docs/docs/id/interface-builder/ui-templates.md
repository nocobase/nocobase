---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/ui-templates).
:::

# Templat UI

## Pengantar

Templat antarmuka digunakan untuk menggunakan kembali konfigurasi dalam pembangunan antarmuka, mengurangi pembuatan berulang, dan menjaga sinkronisasi pembaruan konfigurasi di berbagai tempat saat diperlukan.

Jenis templat yang didukung saat ini meliputi:

- Templat Blok: Menggunakan kembali seluruh konfigurasi blok.
- Templat Bidang: Menggunakan kembali konfigurasi "area bidang" pada blok formulir/detail.
- Templat Popup: Menggunakan kembali konfigurasi popup yang dipicu oleh tindakan/bidang.

## Konsep Inti

### Referensi dan Salinan

Biasanya ada dua cara untuk menggunakan templat:

- `Referensi`: Berbagi konfigurasi templat yang sama di beberapa tempat; memodifikasi templat atau salah satu titik referensi akan menyinkronkan pembaruan ke semua titik referensi lainnya.
- `Salinan`: Menyalin sebagai konfigurasi independen; modifikasi selanjutnya tidak akan saling memengaruhi.

### Simpan sebagai Templat

Ketika sebuah blok/popup sudah dikonfigurasi, Anda dapat menggunakan `Simpan sebagai templat` di menu pengaturannya dan memilih metode penyimpanan:

- `Ubah ... saat ini menjadi templat`: Setelah disimpan, posisi saat ini akan beralih menjadi referensi ke templat tersebut.
- `Salin ... saat ini sebagai templat`: Hanya membuat templat, posisi saat ini tetap tidak berubah.

## Templat Blok

### Simpan Blok sebagai Templat

1) Buka menu pengaturan blok target, klik `Simpan sebagai templat`.
2) Isi `Nama templat` / `Deskripsi templat`, dan pilih mode penyimpanan:
   - `Ubah blok saat ini menjadi templat`: Setelah disimpan, posisi saat ini akan diganti dengan blok `Templat blok` (yaitu, merujuk ke templat tersebut).
   - `Salin blok saat ini sebagai templat`: Hanya membuat templat, blok saat ini tetap tidak berubah.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Menggunakan Templat Blok

1) Tambah blok → "Blok lainnya" → `Templat Blok`.
2) Dalam konfigurasi, pilih:
   - `Templat`: Pilih sebuah templat.
   - `Mode`: `Referensi` atau `Salinan`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Ubah Referensi menjadi Salinan

Saat blok sedang merujuk ke templat, Anda dapat menggunakan `Ubah referensi menjadi salinan` di menu pengaturan blok untuk mengubah blok saat ini menjadi blok biasa (memutus referensi), sehingga modifikasi selanjutnya tidak akan saling memengaruhi.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Catatan

- Mode `Salinan` akan membuat ulang UID untuk blok dan node anaknya, beberapa konfigurasi yang bergantung pada UID mungkin perlu dikonfigurasi ulang.

## Templat Bidang

Templat bidang digunakan untuk menggunakan kembali konfigurasi area bidang (pemilihan bidang, tata letak, dan pengaturan bidang) dalam **blok formulir** dan **blok detail**, menghindari penambahan bidang berulang di beberapa halaman/blok.

> Templat bidang hanya berpengaruh pada "area bidang" dan tidak menggantikan seluruh blok. Untuk menggunakan kembali seluruh blok, silakan gunakan Templat Blok yang dijelaskan di atas.

### Menggunakan Templat Bidang dalam Blok Formulir/Detail

1) Masuk ke mode konfigurasi, buka menu "Bidang" di blok formulir atau blok detail.
2) Pilih `Templat Bidang`.
3) Pilih sebuah templat dan pilih mode: `Referensi` atau `Salinan`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Perintah Penimpaan

Ketika bidang sudah ada di dalam blok, menggunakan mode **Referensi** biasanya akan memunculkan konfirmasi (karena bidang referensi akan menggantikan area bidang saat ini).

### Ubah Bidang Referensi menjadi Salinan

Saat blok sedang merujuk ke templat bidang, Anda dapat menggunakan `Ubah bidang referensi menjadi salinan` di menu pengaturan blok untuk menjadikan area bidang saat ini sebagai konfigurasi independen (memutus referensi), sehingga modifikasi selanjutnya tidak akan saling memengaruhi.

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Catatan

- Templat bidang hanya berlaku untuk **blok formulir** dan **blok detail**.
- Jika tabel data yang terikat pada templat dan blok saat ini tidak sama, templat akan ditampilkan sebagai tidak tersedia di pemilih beserta alasannya.
- Jika Anda ingin melakukan "penyesuaian personal" pada bidang di blok saat ini, disarankan untuk menggunakan mode `Salinan` secara langsung, atau lakukan "Ubah bidang referensi menjadi salinan" terlebih dahulu.

## Templat Popup

Templat popup digunakan untuk menggunakan kembali satu set antarmuka popup dan logika interaksi. Untuk konfigurasi umum seperti metode pembukaan popup dan ukuran, lihat [Edit Popup](/interface-builder/actions/action-settings/edit-popup).

### Simpan Popup sebagai Templat

1) Buka menu pengaturan tombol/bidang yang dapat memicu popup, klik `Simpan sebagai templat`.
2) Isi nama/deskripsi templat dan pilih mode penyimpanan:
   - `Ubah popup saat ini menjadi templat`: Setelah disimpan, popup saat ini akan beralih menjadi referensi ke templat tersebut.
   - `Salin popup saat ini sebagai templat`: Hanya membuat templat, popup saat ini tetap tidak berubah.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Menggunakan Templat dalam Konfigurasi Popup

1) Buka konfigurasi popup dari tombol/bidang.
2) Pilih templat di `Templat popup` untuk menggunakannya kembali.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Kondisi Penggunaan (Rentang Ketersediaan Templat)

Templat popup berkaitan dengan skenario tindakan yang memicu popup. Pemilih akan secara otomatis memfilter/menonaktifkan templat yang tidak kompatibel berdasarkan skenario saat ini (dengan alasan yang ditampilkan jika kondisi tidak terpenuhi).

| Jenis Tindakan Saat Ini | Templat Popup yang Tersedia |
| --- | --- |
| **Tindakan Koleksi** | Templat popup yang dibuat oleh tindakan Koleksi dari Koleksi yang sama |
| **Tindakan Record non-asosiasi** | Templat popup yang dibuat oleh tindakan Koleksi atau tindakan Record non-asosiasi dari Koleksi yang sama |
| **Tindakan Record asosiasi** | Templat popup yang dibuat oleh tindakan Koleksi atau tindakan Record non-asosiasi dari Koleksi yang sama; atau templat popup yang dibuat oleh tindakan Record asosiasi dari bidang asosiasi yang sama |

### Popup Data Asosiasi

Popup yang dipicu oleh data asosiasi (bidang asosiasi) memiliki aturan pencocokan khusus:

#### Pencocokan Ketat untuk Templat Popup Asosiasi

Ketika templat popup dibuat dari **tindakan Record asosiasi** (templat memiliki `associationName`), templat tersebut hanya dapat digunakan oleh tindakan/bidang dengan **bidang asosiasi yang sama persis**.

Contoh: Templat popup yang dibuat pada bidang asosiasi `Pesanan.Pelanggan` hanya dapat digunakan oleh tindakan bidang asosiasi `Pesanan.Pelanggan` lainnya. Ini tidak dapat digunakan oleh bidang asosiasi `Pesanan.Referal` (meskipun keduanya menargetkan tabel data `Pelanggan` yang sama).

Ini karena variabel internal dan konfigurasi templat popup asosiasi bergantung pada konteks hubungan asosiasi tertentu.

#### Tindakan Asosiasi Menggunakan Kembali Templat Tabel Data Target

Bidang/tindakan asosiasi dapat menggunakan kembali **templat popup non-asosiasi dari tabel data target** (templat yang dibuat oleh tindakan Koleksi atau tindakan Record non-asosiasi), selama tabel datanya cocok.

Contoh: Bidang asosiasi `Pesanan.Pelanggan` dapat menggunakan templat popup dari tabel data `Pelanggan`. Pendekatan ini cocok untuk berbagi konfigurasi popup yang sama di beberapa bidang asosiasi (seperti popup detail pelanggan yang seragam).

### Ubah Referensi menjadi Salinan

Saat popup sedang merujuk ke templat, Anda dapat menggunakan `Ubah referensi menjadi salinan` di menu pengaturan untuk menjadikan popup saat ini sebagai konfigurasi independen (memutus referensi), sehingga modifikasi selanjutnya tidak akan saling memengaruhi.

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Manajemen Templat

Di Pengaturan sistem → `Templat UI`, Anda dapat melihat dan mengelola semua templat:

- **Templat Blok (v2)**: Mengelola templat blok.
- **Templat Popup (v2)**: Mengelola templat popup.

> Templat bidang berasal dari templat blok dan dikelola di dalam templat blok.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Operasi yang didukung: Lihat, Filter, Edit, Hapus.

> **Catatan**: Jika templat sedang dirujuk, templat tersebut tidak dapat dihapus secara langsung. Silakan gunakan `Ubah referensi menjadi salinan` terlebih dahulu di posisi yang merujuk ke templat tersebut untuk memutus referensi, kemudian hapus templatnya.