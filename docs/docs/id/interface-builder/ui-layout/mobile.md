---
title: "Layout mobile"
description: "Navigasi, pembuatan halaman, pratinjau desktop, interaksi halaman anak, route, dan izin pada layout mobile NocoBase."
keywords: "layout mobile,halaman mobile,navigasi bawah,pratinjau mobile,route mobile,UI Editor,NocoBase"
---

# Layout mobile

Di NocoBase, **layout mobile** digunakan untuk membuat navigasi dan halaman independen untuk perangkat mobile. Layout ini dapat diakses melalui `/mobile` secara default, menggunakan bilah Tab bawah sebagai navigasi tingkat pertama, dan cocok untuk memasukkan serta mencari data, memproses persetujuan, dan menangani tugas melalui ponsel.

Layout mobile dan layout desktop menggunakan sumber data serta data bisnis yang sama, tetapi menu, route, dan konten halamannya dikonfigurasi secara terpisah. Dengan begitu, kamu dapat menyusun ulang halaman berdasarkan cara kerja di perangkat mobile tanpa dibatasi struktur halaman desktop.

<!-- Diperlukan screenshot halaman lengkap layout mobile di perangkat asli -->

## Masuk dan meninjau layout mobile

Secara default, klik «Mobile» di Pusat Pengaturan atau langsung akses `/mobile`.

Sebaiknya buat halaman melalui browser komputer. Browser akan menampilkan area pratinjau mobile dan toolbar atas, dengan fungsi berikut:

- «UI Editor» digunakan untuk mengaktifkan atau menonaktifkan mode interface builder.
- «Pratinjau tablet» digunakan untuk memeriksa tampilan di perangkat mobile yang lebih lebar.
- «Pratinjau mobile» digunakan untuk mengembalikan area pratinjau ke ukuran ponsel.
- «Kode QR» digunakan untuk membuka alamat mobile saat ini di ponsel.

![20260715221712](https://static-docs.nocobase.com/20260715221712.png)

Setelah selesai membuat halaman di komputer, gunakan kode QR untuk memeriksanya di perangkat asli. Periksa terutama navigasi, scroll, input Form, halaman popup, dan area aman layar.

## Membuat navigasi mobile

Layout mobile menggunakan bilah Tab bawah sebagai navigasi tingkat pertama. Saat ini, navigasi tingkat pertama terutama mendukung Page dan Link.

### Menambahkan Page

1. Aktifkan «UI Editor».
2. Klik tombol tambah di sisi kanan bilah Tab bawah.
3. Pilih «Page».
4. Isi judul Page dan pilih ikon.
5. Setelah disimpan, masuk ke Page baru dan lanjutkan dengan menambahkan konten.

![20260715221823_rec_](https://static-docs.nocobase.com/20260715221823_rec_.gif)

### Menambahkan Link

Jika perlu berpindah ke alamat internal atau eksternal, pilih «Link», lalu konfigurasikan judul, ikon, dan URL.

Link dapat dibuka di jendela saat ini atau jendela baru, tergantung konfigurasinya.

![20260715221950](https://static-docs.nocobase.com/20260715221950.png)

### Menyesuaikan navigasi

Dalam mode interface builder, Tab pada bilah bawah dapat diseret untuk mengubah urutan. Setiap Tab juga dapat diedit judul dan ikonnya, dikonfigurasi aturan linkage-nya, disalin UID-nya, atau dihapus.

Untuk melihat, menampilkan, menyembunyikan, atau menghapus route mobile secara terpusat, buka «Pusat Pengaturan / Route / Route mobile».

![20260715222113_rec_](https://static-docs.nocobase.com/20260715222113_rec_.gif)

## Membuat halaman mobile

Buat dan masuk ke Page mobile terlebih dahulu, lalu tambahkan Block di dalamnya. Pola penyusunan konten Page pada dasarnya sama dengan desktop: gunakan [Block](../blocks/index.md), [Field](../fields/index.md), dan [Action](../actions/index.md) untuk menyusun konten bisnis. Namun, navigasi mobile dan interaksi beberapa komponen disesuaikan untuk layar kecil.

### Menambahkan konten halaman

1. Masuk ke Page mobile yang ingin dibuat.
2. Pastikan «UI Editor» sudah aktif.
3. Klik «Tambahkan Block» di dalam Page.
4. Pilih Table, Form, Detail, Filter, atau Block lainnya.
5. Lanjutkan dengan mengonfigurasi Field, Action, dan pengaturan Block.

![20260715222230_rec_](https://static-docs.nocobase.com/20260715222230_rec_.gif)

### Menggunakan Tab halaman

Sebuah Page mobile juga dapat menggunakan Tab. Konten yang berada dalam satu akses navigasi tetapi relatif terpisah dapat ditempatkan di Tab yang berbeda.

1. Buka pengaturan Page lalu aktifkan «Aktifkan Tab». Kamu juga dapat mengedit Page di «Pusat Pengaturan / Route / Route mobile» dan mencentang «Aktifkan Tab halaman».
2. Aktifkan «UI Editor».
3. Klik «Tambahkan Tab» di sisi kanan bilah Tab halaman.
4. Tambahkan Tab, lalu konfigurasikan nama dan konten Page.

Jika konten Page mobile tidak banyak, cukup gunakan satu Page tanpa mengaktifkan Tab.

![20260715222354_rec_](https://static-docs.nocobase.com/20260715222354_rec_.gif)

### Interaksi mobile pada komponen umum

Komponen umum di dalam Page akan menyesuaikan susunan dan cara interaksinya dengan layout mobile. Sebagai contoh, konten multikolom otomatis berubah menjadi satu kolom yang lebih nyaman dilihat secara vertikal, Field pilihan serta tanggal dan waktu menggunakan pemilih mobile, sedangkan Filter, record asosiasi, dan halaman anak memakai antarmuka yang lebih sesuai untuk sentuhan.

Table tetap berbentuk Table di layout mobile dan dapat digulir secara horizontal untuk melihat kolom di luar layar. Perilaku mobile tambahan pada Block lainnya bergantung pada dukungan masing-masing Block.

## Page dan halaman anak

Konten yang dibuka dari Action seperti View, Edit, dan memilih record asosiasi akan ditampilkan sebagai halaman anak mobile. Halaman anak menyediakan tombol kembali untuk kembali ke Page sebelumnya.

Saat masuk ke halaman anak yang lebih dalam, bilah Tab bawah akan disembunyikan agar tersedia lebih banyak ruang untuk konten. Setelah halaman anak ditutup atau kembali ke tingkat sebelumnya, bilah Tab bawah akan muncul kembali.

Ketika berpindah antar-Tab bawah, status Page yang sudah dibuka tetap dipertahankan agar kamu dapat beralih di antara beberapa tugas mobile.

![20260715222828_rec_](https://static-docs.nocobase.com/20260715222828_rec_.gif)

## Mengelola route dan izin

Route mobile dapat dikelola secara terpusat melalui [Routes Manager](../../routes/index.md). Buka «Pusat Pengaturan / Route / Route mobile» untuk menambah, mengedit, menghapus, menampilkan, atau menyembunyikan Page dan Link, serta mengonfigurasi Tab halaman.

Izin akses route mobile dikonfigurasi secara terpisah dari route desktop. Pada izin role, buka «Route mobile» lalu pilih Page yang dapat diakses oleh role saat ini. Penjelasan lengkap dapat dilihat di [Konfigurasi izin](../../users-permissions/acl/permissions.md).

![20260715223016_rec_](https://static-docs.nocobase.com/20260715223016_rec_.gif)

![20260715223106_rec_](https://static-docs.nocobase.com/20260715223106_rec_.gif)

## Hubungan dengan layout desktop

Layout desktop dan layout mobile dapat menggunakan tabel data yang sama untuk membuat halaman masing-masing. Sebagai contoh, desktop dapat menggunakan Table dengan banyak Field untuk memproses data, sedangkan mobile menggunakan List atau Form yang lebih sederhana untuk memasukkan data di lapangan.

Page pada kedua layout tidak otomatis disinkronkan. Perubahan Page, menu, atau route desktop tidak mengubah konfigurasi mobile, dan perubahan mobile juga tidak memengaruhi desktop.

:::tip Saran penggunaan

Jika perangkat mobile hanya digunakan untuk sesekali melihat Page desktop, gunakan responsif layar sempit dari [layout desktop](./desktop.md) terlebih dahulu. Layout mobile terpisah hanya diperlukan jika kamu membutuhkan navigasi dan alur Page independen untuk perangkat mobile.

:::

## Tautan terkait

- [Ikhtisar layout UI](./index.md) — Memahami skenario penggunaan layout desktop dan layout mobile
- [Layout desktop](./desktop.md) — Menggunakan layout desktop default dan responsif layar sempit
- [Block](../blocks/index.md) — Menambahkan konten bisnis ke Page mobile
- [Field](../fields/index.md) — Mengonfigurasi Form mobile dan Field untuk menampilkan data
- [Action](../actions/index.md) — Mengonfigurasi Action pada Page mobile
- [Routes Manager](../../routes/index.md) — Mengelola Page, Link, dan Tab mobile
- [Konfigurasi izin](../../users-permissions/acl/permissions.md) — Mengontrol route mobile yang dapat diakses oleh role
