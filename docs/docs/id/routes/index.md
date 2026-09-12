---
title: "Routes Manager"
description: "Routes Manager mengelola route halaman utama dan menu, mendukung desktop/mobile, empat tipe route: group/page/tab/link, menu dan route disinkronkan."
keywords: "route,Routes,menu route,NocoBase"
---

# Routes Manager

<PluginInfo name="client"></PluginInfo>

## Pengantar

Routes Manager adalah tool untuk mengelola route halaman utama sistem, mendukung `desktop` dan `mobile`. Route yang dibuat menggunakan Routes Manager akan ditampilkan secara sinkron di menu (dapat dikonfigurasi untuk tidak ditampilkan di menu). Sebaliknya, menu yang ditambahkan di lokasi menu halaman juga akan ditampilkan secara sinkron di daftar Routes Manager.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Manual Penggunaan

### Tipe Route

Sistem mendukung empat tipe route:

- Group: digunakan untuk pengelolaan route secara berkelompok, dapat berisi sub-route
- Page: halaman internal sistem
- Tab: tipe route untuk berpindah tab di dalam halaman
- Link: link internal atau eksternal, dapat langsung menuju ke alamat link yang dikonfigurasi

### Menambahkan Route

Klik tombol "Add new" di kanan atas untuk membuat route baru:

1. Pilih tipe route (Type)
2. Isi judul route (Title)
3. Pilih ikon route (Icon)
4. Atur apakah ditampilkan di menu (Show in menu)
5. Atur apakah Tab page diaktifkan (Enable page tabs)
6. Untuk tipe page, sistem akan secara otomatis menghasilkan path route unik (Path)

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Operasi Route

Setiap entri route mendukung operasi berikut:

- Add child: menambahkan sub-route
- Edit: mengedit konfigurasi route
- View: melihat halaman route
- Delete: menghapus route

### Operasi Batch

Toolbar atas menyediakan fitur operasi batch berikut:

- Refresh: me-refresh daftar route
- Delete: menghapus route yang dipilih
- Hide in menu: menyembunyikan route yang dipilih dari menu
- Show in menu: menampilkan route yang dipilih di menu

### Filter Route

Gunakan fitur "Filter" di bagian atas untuk memfilter daftar route sesuai kebutuhan.

:::info{title=Tips}
Modifikasi konfigurasi route akan langsung memengaruhi struktur menu navigasi sistem. Mohon lakukan dengan hati-hati untuk memastikan kebenaran konfigurasi route.
:::
