---
pkg: '@nocobase/plugin-user-data-sync'
title: "Sinkronisasi Data Pengguna NocoBase"
description: "Sinkronisasi data pengguna NocoBase: mendaftarkan sumber sinkronisasi, HTTP API, WeCom, sinkronisasi tabel pengguna dan departemen, ekstensi sumber data plugin."
keywords: "sinkronisasi data pengguna,sinkronisasi data,HTTP API,WeCom,sumber sinkronisasi,plugin-user-data-sync,NocoBase"
---

# Sinkronisasi Data Pengguna

## Pengantar

Mendaftarkan dan mengelola sumber sinkronisasi data pengguna. Default menyediakan HTTP API, dan dapat memperluas sumber data lain melalui plugin. Default mendukung sinkronisasi data ke tabel **users** dan **departments**, dan juga dapat memperluas resource target sinkronisasi lain melalui plugin.

## Manajemen Sumber Data dan Sinkronisasi Data

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Saat plugin yang menyediakan sumber sinkronisasi data pengguna belum diinstal, Anda dapat menyinkronkan data pengguna melalui HTTP API. Lihat [Sumber Data - HTTP API](./sources/api.md).
:::

## Menambahkan Sumber Data

Setelah menginstal plugin yang menyediakan sumber sinkronisasi data pengguna, Anda dapat menambahkan sumber data yang sesuai. Hanya sumber data yang aktif yang akan menampilkan tombol sinkronisasi dan tugas.

> Contoh dengan WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Menyinkronkan Data

Klik tombol "Sinkronkan" untuk memulai sinkronisasi data.

![](https://static-docs.nocobase.com/202412041055022.png)

Klik tombol "Tugas" untuk melihat status sinkronisasi. Setelah sinkronisasi berhasil, Anda dapat melihat data di daftar pengguna dan departemen.

![](https://static-docs.nocobase.com/202412041202337.png)

Untuk tugas sinkronisasi yang gagal, klik "Coba Lagi".

![](https://static-docs.nocobase.com/202412041058337.png)

Saat sinkronisasi gagal, Anda dapat menyelidiki penyebabnya melalui log sistem. Pada saat yang sama, di direktori `user-data-sync` di dalam direktori log aplikasi tersimpan record sinkronisasi data asli.

![](https://static-docs.nocobase.com/202412041205655.png)
