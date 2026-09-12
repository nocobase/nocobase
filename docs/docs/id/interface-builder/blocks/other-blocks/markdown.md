---
title: "Block Markdown"
description: "Block Markdown: menampilkan konten format Markdown, mendukung rich text, code block, gambar, dll., digunakan untuk menampilkan konten dokumentasi."
keywords: "Block Markdown, Markdown, rich text, tampilan dokumentasi, interface builder, NocoBase"
---

# Block Markdown

## Pengantar

Block Markdown digunakan tanpa perlu bind data source, menggunakan sintaks Markdown untuk mendefinisikan konten teks, dapat digunakan untuk menampilkan konten teks yang diformat.

## Tambah Block

Anda dapat menambahkan Block Markdown di Page atau Popup

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Anda juga dapat menambahkan Block Markdown inline (inline-block) di Block Form dan Block Detail

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Template Engine

Menggunakan **[Liquid Template Engine](https://liquidjs.com/tags/overview.html)**, menyediakan kemampuan render template yang kuat dan fleksibel, sehingga konten dapat dihasilkan dan ditampilkan secara dinamis. Dengan template engine, Anda dapat:

- **Interpolasi Dinamis**: Gunakan placeholder untuk merujuk variabel di template, misalnya `{{ ctx.user.userName }}` otomatis diganti dengan nama pengguna yang sesuai.
- **Render Kondisional**: Mendukung statement kondisional (`{% if %}...{% else %}`), menampilkan konten berbeda berdasarkan status data berbeda.
- **Loop**: Gunakan `{% for item in list %}...{% endfor %}` untuk mengiterasi array atau collection, menghasilkan list, table, atau modul berulang.
- **Filter Bawaan**: Menyediakan filter yang kaya (seperti `upcase`, `downcase`, `date`, `truncate`, dll.), dapat memformat dan memproses data.
- **Extensibility**: Mendukung variabel dan fungsi kustom, sehingga logika template dapat digunakan kembali dan dipelihara.
- **Keamanan dan Isolasi**: Render template dieksekusi di lingkungan sandbox, menghindari menjalankan kode berbahaya secara langsung, meningkatkan keamanan.

Dengan Liquid Template Engine, developer dan content creator dapat **dengan mudah mengimplementasikan tampilan konten dinamis, generasi dokumentasi personal, dan render template struktur data kompleks**, sangat meningkatkan efisiensi dan fleksibilitas.


## Menggunakan Variabel

Markdown di Page mendukung variabel sistem umum (seperti pengguna saat ini, peran saat ini, dll.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Sedangkan Markdown di Popup Action baris Block (atau sub-page) mendukung lebih banyak variabel konteks data (seperti record saat ini, record popup saat ini, dll.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

<!-- ## Lokalisasi

Filter `t` bawaan, mendukung terjemahan teks lokalisasi.

> Perhatian: teks perlu dimasukkan terlebih dahulu ke table lokalisasi, di masa mendatang akan dioptimalkan untuk mendukung pembuatan kosakata lokalisasi kustom.

![20251026223542](https://static-docs.nocobase.com/20251026223542.png) -->

## QR Code

Markdown mendukung konfigurasi QR code

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```
