---
title: "Layout UI"
description: "Ikhtisar layout UI NocoBase yang membahas karakteristik, skenario penggunaan, dan hubungan konfigurasi antara layout desktop dan layout mobile."
keywords: "layout UI,layout desktop,layout mobile,layout responsif,halaman mobile,NocoBase"
---

# Layout UI

NocoBase menyediakan layout desktop dan layout mobile. Keduanya dapat menggunakan fitur interface builder untuk membuat halaman serta mengonfigurasi Block, Field, dan Action di dalamnya.

Layout desktop merupakan pilihan default dan cocok untuk pengelolaan serta pemrosesan data sehari-hari di komputer. Jika membutuhkan navigasi dan halaman independen untuk perangkat mobile, kamu dapat menyiapkan layout mobile secara terpisah.

## Layout desktop

[Layout desktop](./desktop.md) dapat diakses melalui `/admin` secara default. Layout ini terdiri atas navigasi atas, navigasi samping, dan area konten halaman. Layout desktop cocok untuk skenario umum seperti mengelola Table, mengisi Form, dan melihat data.

Layout desktop juga mendukung tampilan responsif untuk layar sempit. Saat halaman dibuka di layar yang lebih sempit, navigasi, jarak, dan komponen umum akan disesuaikan agar lebih nyaman digunakan, sementara menu dan halaman desktop tetap sama.

![20260715224020](https://static-docs.nocobase.com/20260715224020.png)

## Layout mobile

[Layout mobile](./mobile.md) dapat diakses melalui `/mobile` secara default. Layout ini menggunakan bilah Tab bawah sebagai navigasi tingkat pertama serta menyediakan halaman, Link, dan Tab halaman khusus mobile.

Layout mobile cocok untuk aktivitas yang sering dilakukan melalui ponsel, seperti memasukkan data di lapangan, memproses persetujuan, menangani tugas, dan mencari data. Kamu dapat membuat dan meninjau halaman di browser komputer, lalu menggunakan kode QR untuk memeriksa hasilnya di ponsel.

![20260715230725](https://static-docs.nocobase.com/20260715230725.png)

## Cara memilih

Secara default, gunakan layout desktop.

| Saya ingin… | Pilihan yang disarankan |
| --- | --- |
| Terutama bekerja di komputer dan sesekali mengakses melalui ponsel | [Layout desktop](./desktop.md) |
| Membuat navigasi, halaman, dan alur kerja khusus untuk ponsel | [Layout mobile](./mobile.md) |
| Menyediakan pengalaman lengkap di komputer dan perangkat mobile | Buat layout desktop dan layout mobile secara terpisah |

## Hubungan antar-konfigurasi

Layout desktop dan layout mobile menggunakan sumber data serta data bisnis yang sama. Kamu dapat membuat halaman berbeda dari tabel data yang sama agar sesuai untuk setiap jenis perangkat.

Menu, route, dan konfigurasi halaman dikelola secara terpisah. Perubahan pada halaman desktop tidak otomatis memperbarui halaman mobile, dan perubahan navigasi mobile tidak memengaruhi navigasi desktop. [Izin akses route](../../users-permissions/acl/permissions.md) untuk kedua layout juga perlu dikonfigurasi secara terpisah.

## Tautan terkait

- [Layout desktop](./desktop.md) — Membuat halaman desktop dan memahami perilaku responsif di layar sempit
- [Layout mobile](./mobile.md) — Membuat navigasi dan halaman khusus mobile
- [Routes Manager](../../routes/index.md) — Mengelola halaman, Link, dan menu desktop maupun mobile
- [Konfigurasi izin](../../users-permissions/acl/permissions.md) — Mengatur menu dan halaman yang dapat diakses setiap role
