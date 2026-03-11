---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/file-manager/file-preview/ms-office).
:::

# Pratinjau File Office <Badge>v1.8.11+</Badge>

Plugin Pratinjau File Office digunakan untuk melihat pratinjau file berformat Office di aplikasi NocoBase, seperti Word, Excel, PowerPoint, dan lainnya.  
Plugin ini berbasis layanan daring publik yang disediakan oleh Microsoft, yang memungkinkan file yang dapat diakses melalui URL publik untuk disematkan ke dalam antarmuka pratinjau, sehingga pengguna dapat melihat file tersebut di peramban tanpa perlu mengunduh atau menggunakan aplikasi Office.

## Panduan Pengguna

Secara default, plugin ini berada dalam status **dinonaktifkan**. Plugin dapat digunakan setelah diaktifkan di pengelola plugin, tanpa memerlukan konfigurasi tambahan.

![Antarmuka aktivasi plugin](https://static-docs.nocobase.com/20250731140048.png)

Setelah berhasil mengunggah file Office (Word / Excel / PowerPoint) ke bidang file dalam sebuah koleksi, klik ikon atau tautan file yang sesuai untuk melihat konten file dalam antarmuka pratinjau yang muncul atau disematkan.

![Contoh operasi pratinjau](https://static-docs.nocobase.com/20250731143231.png)

## Prinsip Implementasi

Pratinjau yang disematkan oleh plugin ini bergantung pada layanan daring publik Microsoft (Office Web Viewer). Proses utamanya adalah sebagai berikut:

- Frontend menghasilkan URL yang dapat diakses secara publik untuk file yang diunggah oleh pengguna (termasuk URL bertanda tangan S3);
- Plugin memuat pratinjau file dalam iframe menggunakan alamat berikut:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<URL File Publik>
  ```

- Layanan Microsoft akan meminta konten file dari URL tersebut, merendernya, dan mengembalikan halaman yang dapat dilihat.

## Catatan

- Karena plugin ini bergantung pada layanan daring Microsoft, pastikan koneksi jaringan normal dan layanan terkait Microsoft dapat diakses.
- Microsoft akan mengakses URL file yang Anda berikan, dan konten file akan disimpan sementara dalam cache server mereka untuk merender halaman pratinjau. Oleh karena itu, terdapat risiko privasi tertentu. Jika Anda memiliki kekhawatiran mengenai hal ini, disarankan untuk tidak menggunakan fitur pratinjau yang disediakan oleh plugin ini[^1].
- File yang akan dipratinjau harus berupa URL yang dapat diakses secara publik. Dalam keadaan normal, file yang diunggah ke NocoBase akan secara otomatis menghasilkan tautan publik yang dapat diakses (termasuk URL bertanda tangan yang dihasilkan oleh plugin S3-Pro), namun jika file memiliki pengaturan izin akses atau disimpan dalam lingkungan jaringan internal, file tersebut tidak dapat dipratinjau[^2].
- Layanan ini tidak mendukung autentikasi login atau sumber daya dalam penyimpanan pribadi. Misalnya, file yang hanya dapat diakses dalam jaringan internal atau memerlukan login tidak dapat menggunakan fitur pratinjau ini.
- Setelah konten file diambil oleh layanan Microsoft, konten tersebut mungkin disimpan dalam cache untuk waktu yang singkat. Meskipun file sumber dihapus, konten pratinjau mungkin masih dapat diakses untuk jangka waktu tertentu.
- Terdapat batasan ukuran file yang direkomendasikan: File Word dan PowerPoint disarankan tidak melebihi 10MB, dan file Excel disarankan tidak melebihi 5MB untuk memastikan stabilitas pratinjau[^3].
- Saat ini, tidak ada deskripsi lisensi penggunaan komersial resmi yang jelas untuk layanan ini. Harap evaluasi risikonya sendiri saat menggunakan[^4].

## Format File yang Didukung

Plugin ini hanya mendukung pratinjau untuk format file Office berikut, berdasarkan tipe MIME atau ekstensi file:

- Dokumen Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) atau `application/msword` (`.doc`)
- Tabel Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) atau `application/vnd.ms-excel` (`.xls`)
- Presentasi PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) atau `application/vnd.ms-powerpoint` (`.ppt`)
- Teks OpenDocument: `application/vnd.oasis.opendocument.text` (`.odt`)

Format file lainnya tidak akan mengaktifkan fitur pratinjau dari plugin ini.

[^1]: [Apa status dari view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Akses ditolak atau file non-publik tidak dapat dipratinjau](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - Batasan ukuran file untuk Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Penggunaan komersial Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)