:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Blok Markdown

## Pendahuluan

Blok Markdown dapat digunakan tanpa perlu terikat ke **sumber data**. Ia menggunakan sintaks Markdown untuk mendefinisikan konten teks dan dapat digunakan untuk menampilkan teks yang diformat.

## Menambahkan Blok

Anda dapat menambahkan blok Markdown ke halaman atau pop-up.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Anda juga dapat menambahkan blok Markdown *inline* (blok sebaris) di dalam blok Formulir dan Detail.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Mesin Templat

Menggunakan **[mesin templat Liquid](https://liquidjs.com/tags/overview.html)**, ia menyediakan kemampuan *rendering* templat yang kuat dan fleksibel, memungkinkan konten untuk dihasilkan secara dinamis dan ditampilkan secara kustom. Melalui mesin templat ini, Anda dapat:

-   **Interpolasi Dinamis**: Menggunakan *placeholder* dalam templat untuk mereferensikan variabel, misalnya, `{{ ctx.user.userName }}` secara otomatis diganti dengan nama pengguna yang sesuai.
-   **Rendering Kondisional**: Mendukung pernyataan kondisional (`{% if %}...{% else %}`), menampilkan konten yang berbeda berdasarkan status data yang berbeda.
-   **Perulangan**: Menggunakan `{% for item in list %}...{% endfor %}` untuk mengulang *array* atau **koleksi**, menghasilkan daftar, tabel, atau modul berulang.
-   **Filter Bawaan**: Menyediakan serangkaian filter yang kaya (seperti `upcase`, `downcase`, `date`, `truncate`, dll.) untuk memformat dan memproses data.
-   **Ekstensibilitas**: Mendukung variabel dan fungsi kustom, membuat logika templat dapat digunakan kembali dan mudah dipelihara.
-   **Keamanan dan Isolasi**: *Rendering* templat dieksekusi dalam lingkungan *sandbox*, mencegah eksekusi langsung kode berbahaya, dan meningkatkan keamanan.

Dengan bantuan mesin templat Liquid, pengembang dan pembuat konten dapat **dengan mudah mencapai tampilan konten dinamis, pembuatan dokumen yang dipersonalisasi, dan *rendering* templat untuk struktur data yang kompleks**, secara signifikan meningkatkan efisiensi dan fleksibilitas.

## Menggunakan Variabel

Markdown pada halaman mendukung variabel sistem umum (seperti pengguna saat ini, peran saat ini, dll.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Sementara itu, Markdown dalam pop-up aksi baris blok (atau sub-halaman) mendukung lebih banyak variabel konteks data (seperti catatan saat ini, catatan pop-up saat ini, dll.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## Kode QR

Kode QR dapat dikonfigurasi di Markdown.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```