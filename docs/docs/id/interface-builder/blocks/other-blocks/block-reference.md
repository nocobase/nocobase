---
pkg: "@nocobase/plugin-block-reference"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Blok Referensi

## Pendahuluan
Blok Referensi menampilkan blok yang sudah ada di halaman saat ini dengan mengisi UID blok target. Anda tidak perlu mengonfigurasi ulang blok tersebut.

## Mengaktifkan plugin
Plugin ini sudah bawaan tetapi dinonaktifkan secara default.
Buka "Manajemen Plugin" → cari "Blok: Referensi" → klik "Aktifkan".

![Mengaktifkan blok Referensi di Manajemen Plugin](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Cara Menambahkan
1) Tambahkan blok → grup "Blok Lainnya" → pilih "Blok Referensi".  
2) Di "Konfigurasi Blok Referensi", isi:
   - `UID Blok`: UID dari blok target
   - `Mode Referensi`: pilih `Referensi` atau `Salin`

![Demo penambahan dan konfigurasi blok Referensi](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Cara Mendapatkan UID Blok
- Buka menu pengaturan blok target, lalu klik `Salin UID` untuk menyalin UID blok tersebut.  

![Contoh menyalin UID dari pengaturan blok](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Mode dan Perilaku
- `Referensi` (default)
  - Berbagi konfigurasi yang sama dengan blok asli; perubahan pada blok asli atau di mana pun blok tersebut direferensikan akan memperbarui semua referensi secara bersamaan.

- `Salin`
  - Membuat blok independen yang identik dengan blok asli pada saat itu; perubahan selanjutnya tidak akan saling memengaruhi atau tersinkronisasi.

## Konfigurasi
- Blok Referensi:
  - `Konfigurasi Blok Referensi`: digunakan untuk menentukan UID blok target, dan memilih mode "Referensi/Salin";
  - sekaligus akan menampilkan pengaturan lengkap dari "blok yang direferensikan" (setara dengan mengonfigurasi langsung pada blok asli).

![Antarmuka konfigurasi blok Referensi](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Hasil Salinan:
  - Blok yang dihasilkan setelah disalin memiliki tipe yang sama dengan blok asli, dan hanya berisi pengaturannya sendiri;
  - tidak lagi menyertakan `Konfigurasi Blok Referensi`.

## Status Kesalahan dan Pengganti
- Jika target tidak ada/tidak valid: akan menampilkan pesan status kesalahan. Anda dapat menetapkan ulang UID blok di pengaturan blok Referensi (Konfigurasi Blok Referensi → UID Blok), lalu simpan untuk memulihkan tampilan.  

![Status kesalahan ketika blok target tidak valid](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Catatan dan Batasan
- Fitur eksperimental, gunakan dengan hati-hati di lingkungan produksi.
- Saat menyalin blok, beberapa konfigurasi yang bergantung pada UID target mungkin perlu dikonfigurasi ulang.
- Semua konfigurasi blok referensi akan disinkronkan secara otomatis, termasuk konfigurasi seperti "cakupan data". Namun, blok referensi dapat memiliki [konfigurasi alur kerja peristiwa](/interface-builder/event-flow/) sendiri, sehingga Anda dapat secara tidak langsung mencapai cakupan data yang berbeda atau konfigurasi terkait lainnya melalui alur kerja peristiwa dan operasi JavaScript kustom.