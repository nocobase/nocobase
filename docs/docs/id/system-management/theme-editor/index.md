:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Editor Tema

> Fitur tema saat ini diimplementasikan berdasarkan Ant Design 5.x. Disarankan untuk memahami konsep terkait [Kustomisasi Tema](https://ant.design/docs/react/customize-theme) sebelum membaca dokumen ini.

## Pendahuluan

Plugin Editor Tema digunakan untuk memodifikasi gaya seluruh halaman front-end. Saat ini, plugin ini mendukung pengeditan [SeedToken](https://ant.design/docs/react/customize-theme#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme#maptoken), dan [AliasToken](https://ant.design/docs/react/customize-theme#aliastoken) secara global, serta mendukung [pengalihan](https://ant.design/docs/react/customize-theme#use-preset-algorithms) ke `Mode Gelap` dan `Mode Kompak`. Ke depannya, mungkin akan ada dukungan untuk kustomisasi tema [tingkat komponen](https://ant.design/docs/react/customize-theme#component-level-customization).

## Petunjuk Penggunaan

### Mengaktifkan Plugin Editor Tema

Pertama, perbarui NocoBase ke versi terbaru (v0.11.1 atau lebih tinggi). Kemudian, cari kartu `Editor Tema` di halaman Pengelola Plugin. Klik tombol `Aktifkan` di kanan bawah kartu dan tunggu hingga halaman dimuat ulang.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Mengakses Halaman Konfigurasi Tema

Setelah plugin diaktifkan, klik tombol pengaturan di kiri bawah kartu untuk menuju halaman pengeditan tema. Secara default, tersedia empat opsi tema: `Tema Default`, `Tema Gelap`, `Tema Kompak`, dan `Tema Gelap Kompak`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Menambah Tema Baru

Klik tombol `Tambah Tema Baru` dan pilih `Buat Tema Baru Sepenuhnya`. Editor Tema akan muncul di sisi kanan halaman, memungkinkan Anda mengedit opsi seperti `Warna`, `Ukuran`, `Gaya`, dan lainnya. Setelah selesai mengedit, masukkan nama tema dan klik simpan untuk menyelesaikan penambahan tema.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Menerapkan Tema Baru

Arahkan kursor ke pojok kanan atas halaman untuk melihat opsi pengalih tema. Klik untuk beralih ke tema lain, seperti tema yang baru saja Anda tambahkan.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Mengedit Tema yang Sudah Ada

Klik tombol `Edit` di kiri bawah kartu. Editor Tema akan muncul di sisi kanan halaman (sama seperti saat menambah tema baru). Setelah selesai mengedit, klik simpan untuk menyelesaikan modifikasi tema.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Mengatur Tema yang Dapat Dipilih Pengguna

Tema yang baru ditambahkan secara default dapat dipilih oleh pengguna. Jika Anda tidak ingin pengguna beralih ke tema tertentu, Anda dapat mematikan sakelar `Dapat dipilih pengguna` di kanan bawah kartu tema. Dengan demikian, pengguna tidak akan dapat beralih ke tema tersebut.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Mengatur sebagai Tema Default

Pada kondisi awal, tema default adalah `Tema Default`. Jika Anda ingin mengatur tema tertentu sebagai tema default, Anda dapat mengaktifkan sakelar `Tema Default` di kanan bawah kartu tema tersebut. Ini akan memastikan bahwa saat pengguna pertama kali membuka halaman, mereka akan melihat tema ini. Catatan: Tema default tidak dapat dihapus.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Menghapus Tema

Klik tombol `Hapus` di bawah kartu, lalu konfirmasi di dialog pop-up untuk menghapus tema.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)