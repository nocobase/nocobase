---
pkg: '@nocobase/plugin-file-manager'
title: "File Preview"
description: "Field file mendukung klik thumbnail untuk preview, format native browser built-in seperti gambar, PDF, video, dapat diperluas dengan plugin Office untuk preview Word/Excel/PPT."
keywords: "file preview,Preview,thumbnail,Office preview,PDF preview,image preview,NocoBase"
---

# File Preview

Di interface yang berisi field file (termasuk field attachment), Anda dapat preview file dengan mengklik thumbnail file atau icon. Fitur preview built-in mendukung berbagai tipe file, termasuk gambar, PDF, dan sebagian besar tipe file yang didukung native oleh browser.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

Untuk tipe file yang tidak mendukung native preview, Anda dapat mengimplementasikan fitur preview dengan menginstal atau mengembangkan plugin file preview yang sesuai. Contohnya, setelah menginstal plugin Office file preview, Anda dapat preview file Word, Excel, dan PowerPoint.

Plugin file preview yang saat ini disediakan NocoBase:

* [Office File Preview Plugin](../file-preview/ms-office.md)

## Preview PDF dengan storage eksternal

NocoBase menampilkan preview PDF melalui iframe browser. Beberapa browser atau PDF reader mungkin mendukung script, form, atau konten interaktif lain di dalam file PDF. Jika file yang dipreview berasal dari sumber yang tidak tepercaya, perhatikan batas keamanan untuk eksekusi script.

Kami menyarankan agar domain akses file dipisahkan dari domain situs NocoBase dan domain API. Misalnya, sajikan file dari OSS, S3, COS, atau CDN melalui domain khusus, bukan menggunakan origin yang sama dengan frontend atau API NocoBase.

Jika domain file berbeda dari domain API, dan API tidak mengaktifkan akses CORS untuk domain file, script yang berjalan di lingkungan preview PDF biasanya dibatasi oleh same-origin policy browser. Script tersebut tidak dapat langsung membaca halaman NocoBase, storage browser, atau respons API.
