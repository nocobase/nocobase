---
pkg: '@nocobase/plugin-file-previewer-office'
title: "Office File Preview"
description: "Plugin Office preview: preview online Word, Excel, PowerPoint, ODT berdasarkan Microsoft Office Web Viewer, mendukung format docx/xlsx/pptx, tanpa perlu download."
keywords: "Office preview,Word preview,Excel preview,PowerPoint preview,docx,xlsx,pptx,Office Web Viewer,NocoBase"
---
# Office File Preview <Badge>v1.8.11+</Badge>

Plugin Office file preview digunakan untuk preview file format Office di aplikasi NocoBase, seperti Word, Excel, PowerPoint, dll.
Plugin ini berdasarkan layanan online publik yang disediakan Microsoft, dapat embed file yang dapat diakses melalui URL publik di interface preview. User dapat melihat file ini di browser, tanpa perlu download atau menggunakan aplikasi Office.

## Manual Penggunaan

Secara default plugin ini berada dalam status **belum diaktifkan**. Setelah diaktifkan di plugin manager, dapat digunakan tanpa konfigurasi tambahan.

![Interface aktivasi plugin](https://static-docs.nocobase.com/20250731140048.png)

Setelah upload file Office (Word / Excel / PowerPoint) berhasil di field file tabel data, klik icon atau link file yang sesuai, untuk melihat konten file di interface preview popup atau embedded.

![Contoh operasi preview](https://static-docs.nocobase.com/20250731143231.png)

## Prinsip Implementasi

Preview embedded plugin ini bergantung pada layanan online publik Microsoft (Office Web Viewer), alur utama:

- Frontend menghasilkan URL yang dapat diakses publik untuk file yang di-upload user (termasuk URL signed S3);
- Plugin menggunakan alamat berikut di iframe untuk memuat file preview:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<URL file publik>
  ```

- Layanan Microsoft akan request konten file ke URL tersebut, di-render dan dikembalikan halaman yang dapat dilihat.

## Perhatian

- Karena plugin ini bergantung pada layanan online Microsoft, perlu memastikan koneksi jaringan normal, dan dapat mengakses layanan terkait Microsoft.
- Microsoft akan mengakses URL file yang Anda berikan, konten file akan di-cache sementara di server mereka untuk render halaman preview, sehingga ada risiko privasi tertentu. Jika Anda khawatir tentang ini, disarankan untuk tidak menggunakan plugin ini untuk fitur preview[^1].
- File yang perlu di-preview harus berupa URL yang dapat diakses publik. Biasanya, file yang di-upload ke NocoBase akan otomatis menghasilkan link publik yang dapat diakses (termasuk URL signed yang dihasilkan plugin S3-Pro), tetapi jika file diatur dengan akses permission atau disimpan di environment intranet, tidak dapat di-preview[^2].
- Layanan ini tidak mendukung verifikasi login atau resource storage privat. Contohnya, file yang hanya dapat diakses di intranet atau yang memerlukan login tidak dapat menggunakan fitur preview ini.
- Konten file dapat di-cache untuk waktu singkat setelah diambil oleh layanan Microsoft. Bahkan jika file source dihapus, konten preview mungkin masih dapat diakses untuk beberapa waktu.
- Ada batasan ukuran file yang direkomendasikan: file Word dan PowerPoint disarankan tidak melebihi 10MB, file Excel disarankan tidak melebihi 5MB, untuk memastikan stabilitas preview[^3].
- Layanan ini saat ini tidak memiliki penjelasan lisensi penggunaan komersial yang jelas secara resmi, harap evaluasi sendiri risikonya saat digunakan[^4].

## Format File yang Didukung

Plugin hanya mendukung preview format file Office berikut, berdasarkan tipe MIME atau extension file:

- Dokumen Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) atau `application/msword` (`.doc`)
- Tabel Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) atau `application/vnd.ms-excel` (`.xls`)
- Presentasi PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) atau `application/vnd.ms-powerpoint` (`.ppt`)
- Teks OpenDocument: `application/vnd.oasis.opendocument.text` (`.odt`)

File dengan format lain tidak akan mengaktifkan fitur preview plugin ini.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)
