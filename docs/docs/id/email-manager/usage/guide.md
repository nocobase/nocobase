---
pkg: "@nocobase/plugin-email-manager"
title: "Panduan Penggunaan Email Center"
description: "Email center: Link account untuk asosiasi akun, otorisasi OAuth, sinkronisasi data, filter email, pengiriman dan penerimaan, hapus akun."
keywords: "email center,asosiasi akun,Link account,otorisasi OAuth,sinkronisasi data,NocoBase"
---

# Email Center

<PluginInfo commercial="true" name="email-manager"></PluginInfo>

## Pengantar
Setelah plugin email diaktifkan, sistem default menyediakan email management center, untuk integrasi akun, manajemen email, dan konfigurasi fitur.

Klik icon email message di kanan atas untuk masuk ke halaman manajemen email.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_02_PM.png)

## Asosiasi Akun

### Link Akun

Klik tombol **Settings**, setelah popup terbuka klik tombol **Link account**, pilih tipe email yang perlu diasosiasikan.

![](https://static-docs.nocobase.com/email-manager/Email-01-01-2026_09_00_AM.png)

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_03_PM.png)

Browser otomatis membuka halaman login email yang sesuai, login akun dan setujui otorisasi (alur otorisasi setiap provider berbeda).

![](https://static-docs.nocobase.com/mail-1733816162534.png)

![](https://static-docs.nocobase.com/email-manager/Microsoft-%E5%B8%90%E6%88%B7-12-31-2025_09_49_PM.png)

Setelah otorisasi selesai akan kembali ke NocoBase, pilih waktu mulai sinkronisasi untuk asosiasi akun dan sinkronisasi data (sinkronisasi pertama mungkin memerlukan waktu lebih lama, mohon tunggu).

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_51_PM.png)

Setelah sinkronisasi data selesai, halaman saat ini akan otomatis tertutup, dan kembali ke halaman email message asal. Pada saat ini Anda dapat melihat akun sudah terasosiasi.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_51_PM%20(1).png)

### Hapus Akun
Klik **Delete** untuk menghapus akun dan email yang terasosiasi.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_08_PM.png)

## Manajemen Email

### Filter Email

Sebelah kiri halaman manajemen email adalah area filter, sebelah kanan adalah area list email.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_11_PM.png)

Email dengan subject yang sama akan digabung, dengan tanda jumlah email berkaitan setelah field subject.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_13_PM.png)

Judul email yang belum dibaca ditampilkan dalam bold, di sebelah icon email atas akan ditandai jumlah email yang belum dibaca.


### Sinkronisasi Email Manual

Interval sinkronisasi email saat ini adalah 5 menit. Jika perlu sinkronisasi email secara paksa, Anda dapat mengklik tombol **Sync email**.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_43_PM.png)

### Kirim Email

Klik tombol **Send email** di bagian atas untuk membuka panel pengiriman.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_13_PM%20(2).png)

Setelah mengisi informasi terkait, kirim email. Attachment hanya mendukung file dalam 3MB.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_14_PM.png)

### Lihat Email

Klik field **Subject** di baris untuk melihat detail email. Detail email memiliki dua bentuk:

Bentuk email tunggal dapat langsung melihat informasi detail.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_34_PM.png)

Beberapa email dengan subject yang sama default ditampilkan dalam bentuk list, dapat diklik untuk expand atau collapse.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_29_PM.png)

Setelah melihat detail email, status email default diatur sebagai sudah dibaca. Anda dapat mengklik operasi **Mark as unread** di tombol **...** di sebelah kanan untuk mengaturnya sebagai belum dibaca.

### Reply dan Forward

Setelah masuk ke detail email, ada tombol **Reply**, **Forward** di bagian bawah, untuk operasi yang sesuai.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_45_PM.png)
