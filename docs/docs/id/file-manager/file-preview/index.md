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

- [Office File Preview Plugin](./ms-office.md)

## Mekanisme preview PDF

NocoBase memilih metode preview berdasarkan apakah URL file PDF memiliki origin yang sama dengan halaman saat ini:

| URL file | Storage yang umum | Metode preview | Persyaratan CORS |
| --- | --- | --- | --- |
| Origin yang sama dengan NocoBase | Storage lokal | NocoBase membaca file dan merendernya dengan PDF.js built-in | Tidak melibatkan CORS lintas origin |
| Lintas origin | Storage eksternal seperti OSS, S3, COS, atau CDN | Browser membuka URL file di iframe | Preview iframe sendiri tidak memerlukan CORS |

:::tip Dasar penentuan

Metode preview ditentukan oleh origin URL file, bukan langsung oleh nama storage engine. Storage lokal yang disajikan melalui domain file terpisah diperlakukan sebagai lintas origin. Storage eksternal yang diakses melalui proxy NocoBase dengan origin yang sama diperlakukan sebagai origin yang sama.

:::

### Storage lokal atau URL dengan origin yang sama

URL storage lokal biasanya dimulai dengan `/storage/uploads/` dan memiliki origin yang sama dengan halaman NocoBase. Saat preview, NocoBase membaca data PDF lalu menggunakan PDF.js built-in untuk merender halaman dan teks.

Metode ini tidak bergantung pada PDF reader bawaan browser. Meskipun response file menggunakan `Content-Disposition: attachment` untuk keamanan, NocoBase tetap dapat membaca dan merender file di komponen preview. URL file harus dapat diakses dengan sesi login saat ini.

### Storage eksternal atau URL lintas origin

OSS, S3, COS, dan CDN biasanya menggunakan domain terpisah. NocoBase menempatkan URL PDF di iframe, sehingga hasilnya ditentukan oleh browser dan response header dari layanan storage.

Untuk membuka PDF di iframe, layanan storage biasanya harus mengembalikan `Content-Type: application/pdf` dan tidak memaksa download dengan `Content-Disposition: attachment`. Jika response meminta download, browser langsung mengunduh file dan NocoBase tidak dapat mengganti perilaku tersebut dari frontend.

Memuat PDF lintas origin di iframe tidak memerlukan CORS. Namun, tombol download membaca file dengan `fetch` dan membuat Blob. Karena itu, download lintas origin tetap memerlukan layanan storage untuk mengizinkan request CORS dari situs NocoBase.

### Catatan untuk Aliyun OSS

Dalam beberapa kondisi, domain default Aliyun OSS memaksa download dengan mengembalikan `Content-Disposition: attachment` dan `x-oss-force-download: true`. Gambar mungkin tetap dapat dipreview, sedangkan PDF di iframe akan diunduh.

Biasanya masalah ini dapat diatasi dengan mengikat custom domain ke bucket dan mengonfigurasi NocoBase agar mengakses file melalui domain tersebut. Lihat [Masalah umum Aliyun OSS](../storage/aliyun-oss.md#masalah-umum) untuk langkah konfigurasi dan diagnosis.

### Batas keamanan preview lintas origin

Beberapa browser atau PDF reader mungkin mendukung script, form, atau konten interaktif lain di dalam file PDF. Jika file yang dipreview berasal dari sumber yang tidak tepercaya, perhatikan batas keamanan untuk eksekusi script.

Kami menyarankan agar domain akses file dipisahkan dari domain situs NocoBase dan domain API. Misalnya, sajikan file dari OSS, S3, COS, atau CDN melalui domain khusus, bukan menggunakan origin yang sama dengan frontend atau API NocoBase.

Jika domain file berbeda dari domain API, dan API tidak mengaktifkan akses CORS untuk domain file, script yang berjalan di lingkungan preview PDF biasanya dibatasi oleh same-origin policy browser. Script tersebut tidak dapat langsung membaca halaman NocoBase, storage browser, atau respons API.

## Link terkait

- [Office File Preview Plugin](./ms-office.md)
- [Aliyun OSS](../storage/aliyun-oss.md)
- [S3 Pro](../storage/s3-pro.md)
