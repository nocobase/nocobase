---
title: "Editor Tema"
description: "Editor Tema: kustomisasi SeedToken/MapToken/AliasToken berbasis Ant Design 5.x, mendukung mode dark/compact, tambah/edit/hapus tema, mengatur tema default dan tema yang dapat dipilih user."
keywords: "editor tema,Tema Ant Design,mode dark,mode compact,SeedToken,MapToken,AliasToken,tema kustom,manajemen sistem,NocoBase"
---

# Editor Tema

> Fitur tema saat ini diimplementasikan berdasarkan Ant Design versi 5.x. Disarankan untuk memahami konsep terkait [Customize Theme](https://ant.design/docs/react/customize-theme#customize-theme) sebelum membaca artikel ini.

## Pengantar

Plugin Editor Tema digunakan untuk memodifikasi style seluruh halaman frontend. Saat ini mendukung pengeditan [SeedToken](https://ant.design/docs/react/customize-theme#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme#maptoken), [AliasToken](https://ant.design/docs/react/customize-theme#aliastoken) pada cakupan global, dan mendukung [switching](https://ant.design/docs/react/customize-theme#use-preset-algorithms) ke `dark mode` dan `compact mode`. Di masa depan mungkin akan mendukung kustomisasi tema [tingkat komponen](https://ant.design/docs/react/customize-theme#modify-component-token).

## Petunjuk Penggunaan

### Aktifkan Plugin Tema

Pertama, update NocoBase ke versi terbaru (v0.11.1 ke atas), kemudian cari card `Editor Tema` di halaman Plugin Manager, klik tombol `Aktifkan` di pojok kanan bawah card, tunggu hingga halaman refresh.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Masuk ke Halaman Konfigurasi Tema

Setelah plugin diaktifkan, klik tombol settings di pojok kiri bawah card untuk pindah ke halaman editor tema. Default menyediakan empat opsi tema: `Default Theme`, `Dark Theme`, `Compact Theme`, dan `Compact Dark Theme`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Tambah Tema

Klik tombol `Add New Theme`, pilih `Add a brand new theme`. Editor tema akan muncul di sisi kanan halaman, mendukung pengeditan opsi seperti `Color`, `Size`, `Style`, dll. Setelah selesai mengedit, masukkan nama tema dan klik save untuk menyelesaikan penambahan tema.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Terapkan Tema Baru

Arahkan mouse ke pojok kanan atas halaman, Anda akan melihat item theme switching. Klik untuk beralih ke tema lain, misalnya tema yang baru saja ditambahkan.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Edit Tema yang Ada

Klik tombol `Edit` di pojok kiri bawah card. Editor tema akan muncul di sisi kanan halaman (sama seperti tambah tema). Setelah selesai mengedit, klik save untuk menyelesaikan modifikasi tema.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Atur Tema yang Dapat Dipilih User

Tema yang baru ditambahkan secara default mengizinkan user untuk beralih. Jika tidak ingin user beralih ke tema tertentu, Anda dapat menonaktifkan switch `Selectable by User` di pojok kanan bawah card tema, sehingga user tidak dapat beralih ke tema tersebut.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Atur sebagai Tema Default

Pada status awal, tema default adalah `Default Theme`. Jika Anda perlu menetapkan tema tertentu sebagai tema default, Anda dapat mengaktifkan switch `Default Theme` di pojok kanan bawah card tema tersebut, sehingga user akan melihat tema ini saat pertama kali membuka halaman. Perhatian: tema default tidak dapat dihapus.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Hapus Tema

Klik tombol `Delete` di bawah card. Pada dialog konfirmasi yang muncul, klik konfirmasi untuk menghapus tema.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)
