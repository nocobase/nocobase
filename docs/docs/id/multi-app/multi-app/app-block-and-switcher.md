---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Blok aplikasi dan app switcher'
description: 'Blok aplikasi dan app switcher dalam multi-app: menampilkan entry sub-aplikasi di frontend, mengatur ikon, visibilitas, dan app switcher di kiri atas.'
keywords: 'multi-app,blok aplikasi,app switcher,entry sub-aplikasi,NocoBase'
---

# Blok aplikasi dan app switcher

Selain mengelola sub-aplikasi di admin, multi-app juga dapat menyediakan entry aplikasi di frontend. Cara umum meliputi:

- Menambahkan blok "Applications" pada halaman untuk menampilkan sub-aplikasi yang dapat diakses
- Mengaktifkan app switcher di kiri atas agar pengguna dapat berpindah antara aplikasi utama dan sub-aplikasi

## Blok aplikasi

![](https://static-docs.nocobase.com/202605271350840.png)

Blok "Applications" menampilkan daftar sub-aplikasi pada halaman frontend. Blok ini cocok sebagai portal aplikasi sederhana, sehingga pengguna dapat masuk ke berbagai aplikasi bisnis dari satu halaman.

Setiap aplikasi menampilkan:

- Ikon aplikasi
- Nama aplikasi
- Entry akses

Klik aplikasi untuk membuka sub-aplikasi terkait.

### Mengatur ikon aplikasi

Saat membuat atau mengedit aplikasi di App Supervisor, Anda dapat mengunggah ikon aplikasi di "Display configuration".

Jika tidak ada ikon yang diunggah, sistem akan membuat ikon default dari huruf pertama nama aplikasi.

![](https://static-docs.nocobase.com/202605271402603.png)

### Menyembunyikan aplikasi

Jika aplikasi tidak ingin ditampilkan di blok "Applications", centang "Hide in Applications block" pada konfigurasi aplikasi.

Setelah disembunyikan:

- Aplikasi tetap dapat dikelola di admin
- Aplikasi tetap dapat dibuka melalui URL langsung
- Aplikasi hanya tidak tampil lagi di blok "Applications"

![](https://static-docs.nocobase.com/202605271403980.png)

## App switcher

![](https://static-docs.nocobase.com/202605271403304.png)

App switcher tampil di kiri atas untuk berpindah cepat ke aplikasi lain.

Jika ingin aplikasi muncul di app switcher, aktifkan "Show in app switcher" pada konfigurasi aplikasi.

Setelah aktif, pengguna dapat melihat app switcher di aplikasi utama atau sub-aplikasi dan masuk ke aplikasi lain dari daftar.

![](https://static-docs.nocobase.com/202605271404322.png)

### Cara membuka

App switcher membuka aplikasi sebagai berikut:

- Dari aplikasi utama ke sub-aplikasi: dibuka di tab baru
- Dari satu sub-aplikasi ke sub-aplikasi lain: dibuka di tab saat ini

Dengan demikian, pekerjaan di aplikasi utama tidak terganggu dan perpindahan antar sub-aplikasi tetap natural.
