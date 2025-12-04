:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Komponen Bidang Relasi

## Pendahuluan

Komponen bidang relasi NocoBase dirancang untuk membantu pengguna menampilkan dan mengelola data terkait dengan lebih baik. Terlepas dari jenis relasinya, komponen-komponen ini fleksibel dan serbaguna, memungkinkan pengguna untuk memilih dan mengonfigurasinya sesuai kebutuhan spesifik.

### Dropdown

Untuk semua bidang relasi, kecuali ketika koleksi target adalah koleksi berkas, komponen bawaan dalam mode edit adalah dropdown. Opsi dropdown menampilkan nilai dari bidang judul, sehingga cocok untuk skenario di mana data terkait dapat dipilih dengan cepat hanya dengan menampilkan informasi bidang kunci.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Untuk detail lebih lanjut, lihat [Dropdown](/interface-builder/fields/specific/select)

### Pemilih Data

Pemilih data menyajikan data dalam bentuk modal pop-up. Pengguna dapat mengonfigurasi bidang yang perlu ditampilkan dalam pemilih data (termasuk bidang dari relasi bertingkat), memungkinkan pemilihan data terkait yang lebih akurat.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Untuk detail lebih lanjut, lihat [Pemilih Data](/interface-builder/fields/specific/picker)

### Sub-formulir

Ketika mengelola data relasi yang lebih kompleks, menggunakan dropdown atau pemilih data bisa menjadi tidak praktis. Dalam kasus seperti itu, pengguna perlu sering membuka pop-up. Untuk skenario ini, sub-formulir dapat digunakan. Ini memungkinkan pengguna untuk langsung mengelola bidang dari koleksi terkait di halaman saat ini atau di blok pop-up saat ini tanpa perlu berulang kali membuka pop-up baru, membuat alur kerja lebih lancar. Relasi multi-level ditampilkan dalam bentuk formulir bersarang.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Untuk detail lebih lanjut, lihat [Sub-formulir](/interface-builder/fields/specific/sub-form)

### Sub-tabel

Sub-tabel menampilkan catatan relasi satu-ke-banyak atau banyak-ke-banyak dalam format tabel. Ini menyediakan cara yang jelas dan terstruktur untuk menampilkan dan mengelola data terkait, serta mendukung pembuatan data baru secara massal atau memilih data yang sudah ada untuk dikaitkan.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Untuk detail lebih lanjut, lihat [Sub-tabel](/interface-builder/fields/specific/sub-table)

### Sub-detail

Sub-detail adalah komponen yang sesuai dengan sub-formulir dalam mode baca-saja. Ini mendukung tampilan data dengan relasi multi-level yang bersarang.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Untuk detail lebih lanjut, lihat [Sub-detail](/interface-builder/fields/specific/sub-detail)

### Manajer Berkas

Manajer berkas adalah komponen bidang relasi yang khusus digunakan ketika koleksi target dari relasi adalah koleksi berkas.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Untuk detail lebih lanjut, lihat [Manajer Berkas](/interface-builder/fields/specific/file-manager)

### Judul

Komponen bidang judul adalah komponen bidang relasi yang digunakan dalam mode baca-saja. Dengan mengonfigurasi bidang judul, Anda dapat mengonfigurasi komponen bidang yang sesuai.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Untuk detail lebih lanjut, lihat [Judul](/interface-builder/fields/specific/title)