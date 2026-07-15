---
title: "Layout desktop"
description: "Navigasi, pembuatan halaman, pengelolaan route, dan perilaku responsif layout desktop NocoBase di layar sempit."
keywords: "layout desktop,layout UI,responsif layar sempit,pembuatan halaman,pengelolaan route,UI Editor,NocoBase"
---

# Layout desktop

Di NocoBase, **layout desktop** adalah antarmuka aplikasi default. Layout ini cocok untuk mengelola data, memasukkan data melalui Form, mengonfigurasi proses bisnis, dan melakukan pekerjaan sehari-hari di komputer. Navigasi dan konten halamannya juga dapat menyesuaikan diri di perangkat berlayar sempit.

Layout desktop dapat diakses melalui `/admin` secara default. Jika aplikasi memiliki prefiks akses khusus, alamat sebenarnya akan otomatis menyertakan prefiks tersebut.

<!-- Diperlukan screenshot halaman lengkap layout desktop yang menampilkan navigasi atas, navigasi samping, dan area konten -->

## Karakteristik layout

Layout desktop terdiri atas beberapa area utama:

- **Navigasi atas** — Menampilkan perpindahan aplikasi dan akses Action global.
- **Navigasi samping** — Menampilkan Page dan Link dalam Group saat ini.
- **Area konten halaman** — Menampilkan Tab halaman, Block, Field, dan Action.
- **UI Editor** — Membuka mode interface builder untuk menyesuaikan menu dan konten halaman.

Navigasi atas dan samping mempertahankan status terpilih berdasarkan route saat ini. Saat berpindah halaman, konten akan ditampilkan di area kanan dan status halaman yang sudah dibuka biasanya tetap dipertahankan.

## Membuat halaman

### Langkah 1: Masuk ke layout desktop

Akses `/admin` untuk masuk ke layout desktop. Biasanya, aplikasi juga langsung membuka halaman ini setelah login berhasil.

<!-- Diperlukan screenshot halaman setelah masuk ke layout desktop -->

### Langkah 2: Aktifkan UI Editor

Klik «UI Editor» di sudut kanan atas halaman untuk masuk ke mode interface builder. Setelah aktif, titik konfigurasi akan muncul di sekitar menu, Page, Block, Field, dan Action.

<!-- Diperlukan screenshot lokasi tombol «UI Editor» dan tampilan halaman setelah diaktifkan -->

### Langkah 3: Buat menu dan halaman

Kamu dapat menambahkan Group, Page, atau Link di area navigasi, serta mengaktifkan Tab pada sebuah Page. Setelah membuat Page, buka Page tersebut dan tambahkan Block yang diperlukan.

Konten halaman dibuat dengan cara yang sama seperti antarmuka lainnya: tambahkan [Block](../blocks/index.md), lalu konfigurasikan [Field](../fields/index.md) dan [Action](../actions/index.md) sesuai kebutuhan bisnis.

<!-- Diperlukan video yang menampilkan proses menambahkan menu, membuat Page, dan masuk ke Page tersebut -->

### Langkah 4: Konfigurasikan konten halaman

Tambahkan Block seperti Table, Form, Detail, dan Filter, lalu sesuaikan susunan Field, Action, dan Block. Semua perubahan akan langsung terlihat di halaman saat ini.

<!-- Diperlukan screenshot halaman desktop dalam mode interface builder yang menampilkan titik konfigurasi Block, Field, dan Action -->

## Mengelola route dan menu

Menu dan route desktop menggunakan konfigurasi yang sama. Setelah Page atau Link ditambahkan di area navigasi, item terkait juga akan muncul di [Routes Manager](../../routes/index.md). Perubahan route di Routes Manager juga akan memperbarui menu.

Layout desktop mendukung beberapa jenis route umum:

- **Group** — Mengelompokkan beberapa Page dan Link dalam satu grup navigasi.
- **Page** — Membuka halaman yang dapat diisi dengan Block.
- **Link** — Membuka alamat internal atau eksternal.
- **Tab** — Mengelompokkan beberapa konten dalam satu Page.

Di Routes Manager, kamu dapat menambah, mengedit, menghapus, menampilkan, atau menyembunyikan route. Gunakan Routes Manager jika perlu merapikan struktur menu secara terpusat.

<!-- Diperlukan screenshot halaman «Pusat Pengaturan / Route / Route desktop» -->

## Responsif di layar sempit

Layout desktop dapat langsung digunakan di ponsel atau jendela browser yang sempit. Dalam kondisi ini, layout tetap menggunakan route dan Page desktop yang sama dan tidak otomatis beralih menjadi layout mobile.

### Perubahan layout

Menu navigasi akan menjadi ringkas dan Action di bagian atas dipindahkan ke akses yang lebih padat. Margin halaman serta jarak antar-Block juga mengecil, sedangkan area konten menyesuaikan tinggi tampilan browser mobile.

UI Editor tidak tersedia di layar sempit. Jika perlu mengubah menu atau halaman, lakukan melalui browser komputer.

<!-- Diperlukan video yang menampilkan perubahan Page desktop yang sama dari layar lebar ke layar sempit -->

### Penyesuaian konten halaman

Layout dan komponen umum di dalam halaman juga menyesuaikan diri untuk layar sempit. Sebagai contoh, konten multikolom menjadi lebih nyaman dibaca secara vertikal, Table dapat digulir secara horizontal untuk melihat kolom di luar layar, dan pagination serta akses Action menjadi lebih ringkas. Pemilih nilai, tanggal dan waktu, Filter, serta halaman anak juga menggunakan interaksi yang lebih sesuai untuk layar kecil.

Perilaku tambahan Block lain di layar sempit bergantung pada dukungan masing-masing Block. Table tetap berbentuk Table dan tidak otomatis berubah menjadi kartu.

:::tip Responsif desktop dan layout mobile

Jika hanya sesekali mengakses melalui ponsel, responsif layar sempit pada layout desktop sudah cukup. Jika membutuhkan navigasi bawah, halaman, dan alur kerja khusus mobile, buat [layout mobile](./mobile.md) secara terpisah.

:::

## Saran penggunaan

- Gunakan layout desktop sebagai pilihan default untuk pekerjaan yang terutama dilakukan di komputer.
- Selesaikan pembuatan halaman di layar lebar, lalu perkecil jendela untuk memeriksa tampilannya di layar sempit.
- Jika Page memiliki banyak kolom Table atau Action horizontal, pertahankan konten yang diperlukan saja agar penggunaan di layar kecil tetap ringan.
- Jika alur kerja desktop dan mobile sangat berbeda, buat halaman terpisah untuk masing-masing layout.

## Tautan terkait

- [Ikhtisar layout UI](./index.md) — Memahami skenario penggunaan layout desktop dan layout mobile
- [Layout mobile](./mobile.md) — Membuat navigasi dan halaman khusus mobile
- [Block](../blocks/index.md) — Menambahkan dan mengonfigurasi Block di halaman
- [Field](../fields/index.md) — Mengonfigurasi Field pada Table, Form, dan Detail
- [Action](../actions/index.md) — Mengonfigurasi Action pada Page dan Block
- [Routes Manager](../../routes/index.md) — Mengelola menu dan route desktop secara terpusat
- [Konfigurasi izin](../../users-permissions/acl/permissions.md) — Mengontrol route desktop yang dapat diakses oleh role
