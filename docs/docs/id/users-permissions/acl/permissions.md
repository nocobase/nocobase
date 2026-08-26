---
pkg: '@nocobase/plugin-acl'
title: "Konfigurasi Izin NocoBase"
description: "Konfigurasi izin NocoBase: antarmuka konfigurasi, instalasi plugin, konfigurasi izin plugin, pewarisan izin, izin operasi resource, aturan allow/deny."
keywords: "konfigurasi izin,ACL,izin resource,pewarisan izin,allow,deny,NocoBase"
---

# Konfigurasi Izin

## Konfigurasi Izin Umum

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Konfigurasi Izin

1. Izinkan konfigurasi antarmuka: Izin ini mengontrol apakah pengguna dapat mengkonfigurasi antarmuka. Setelah izin ini diaktifkan, tombol konfigurasi UI akan muncul. Role "admin" mengaktifkan izin ini secara default.
2. Izinkan instalasi, aktivasi, dan menonaktifkan plugin: Izin ini mengontrol apakah pengguna dapat mengaktifkan atau menonaktifkan plugin. Setelah izin ini diaktifkan, pengguna dapat mengakses antarmuka plugin manager. Role "admin" mengaktifkan izin ini secara default.
3. Izinkan konfigurasi plugin: Izin ini mengontrol apakah pengguna dapat mengkonfigurasi parameter plugin atau mengelola data backend plugin. Role "admin" mengaktifkan izin ini secara default.
4. Izinkan menghapus cache, restart aplikasi: Izin ini mengontrol izin operasional sistem pengguna: menghapus cache dan restart aplikasi. Setelah diaktifkan, tombol operasi terkait akan muncul di pusat profil, default tidak diaktifkan.
5. Item menu baru diizinkan diakses secara default: Menu yang baru dibuat default diizinkan untuk diakses, default diaktifkan.

### Izin Operasi Global

Izin operasi global berlaku secara global (semua tabel data) dan dibagi berdasarkan tipe operasi. Mendukung konfigurasi berdasarkan dimensi data scope: semua data dan data milik sendiri. Yang pertama mengizinkan operasi pada seluruh tabel data, sedangkan yang kedua membatasi hanya pada data terkait pengguna sendiri.

## Izin Operasi Tabel Data

![](https://static-docs.nocobase.com/6a6e0281391cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Izin operasi tabel data lebih lanjut menyempurnakan izin operasi global, memungkinkan konfigurasi izin yang berbeda untuk akses resource pada setiap tabel data. Izin ini terbagi dalam dua aspek:

1. Izin operasi: Izin operasi mencakup operasi tambah, lihat, edit, hapus, ekspor, dan impor. Izin ini dikonfigurasi berdasarkan dimensi data scope:
   - Semua data: Mengizinkan pengguna melakukan operasi pada semua record di tabel data.
   - Data milik sendiri: Membatasi pengguna hanya pada record data yang dibuat oleh dirinya sendiri.

2. Izin field: Izin field memungkinkan konfigurasi izin untuk setiap field pada operasi yang berbeda. Misalnya, beberapa field dapat dikonfigurasi hanya untuk dilihat tetapi tidak boleh diedit.

## Izin Akses Menu

Izin akses menu mengontrol izin akses berdasarkan dimensi menu

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Izin Konfigurasi Plugin

Izin konfigurasi plugin digunakan untuk mengontrol izin konfigurasi parameter plugin tertentu. Setelah izin konfigurasi plugin dicentang, antarmuka manajemen plugin yang sesuai akan muncul di pusat manajemen.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)
