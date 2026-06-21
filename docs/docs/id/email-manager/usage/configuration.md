---
pkg: "@nocobase/plugin-email-manager"
title: "Konfigurasi Email Block"
description: "Email table block: tambah block, konfigurasi field, data range (semua/user saat ini), filter berdasarkan alamat email atau suffix."
keywords: "email block,email table,data range,filter email,NocoBase"
---
# Konfigurasi Block

## Email Message Block

### Tambah Block

Di halaman konfigurasi klik tombol **Create block**, pilih block **Email table** untuk menambahkan email message block.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_56_PM.png)

### Konfigurasi Field

Klik tombol **Field** di block untuk memilih field yang perlu ditampilkan. Untuk operasi detail, lihat konfigurasi field tabel.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM.png)

### Atur Data Range
Konfigurasi di sebelah kanan block dapat memilih data range: semua email atau email user yang sedang login.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM%20(1).png)

### Filter Data Berdasarkan Alamat Email

Klik tombol konfigurasi di sebelah kanan email message block, pilih **Data range**, atur data range untuk filter email.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

Konfigurasikan kondisi filter, pilih field alamat email yang perlu di-filter, klik **Confirm** untuk save.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_26_PM.png)

Email message block akan menampilkan email yang sesuai dengan kondisi filter.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_29_PM.png)

> Filter berdasarkan alamat email tidak case sensitive

### Filter Data Berdasarkan Suffix Email

Buat field di tabel bisnis untuk menyimpan suffix email (tipe JSON), untuk mempermudah filter email message selanjutnya.

![](https://static-docs.nocobase.com/email-manager/data-source-manager-main-NocoBase-12-02-2025_04_36_PM.png)

Pelihara informasi suffix email.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_38_PM.png)

Klik tombol konfigurasi di sebelah kanan email message block, pilih **Data range**, atur data range untuk filter email.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

Konfigurasikan kondisi filter, pilih field suffix email yang perlu di-filter, klik **Confirm** untuk save.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_41_PM.png)

Tabel email message akan menampilkan email yang sesuai dengan kondisi filter.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_48_PM.png)

## Email Detail Block

Pertama aktifkan fitur **Enable click to open** di field email message block.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_01_PM.png)

Tambahkan block **Email detail** di popup.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_02_PM.png)

Anda dapat melihat detail konten email.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_03_PM.png)

Tombol yang dibutuhkan dapat dikonfigurasi secara kustom di bagian bawah.

> Jika email saat ini berstatus draft, default akan menampilkan form editing draft.

## Email Send Block

Ada dua cara untuk membuat form pengiriman email:

1. Tambahkan tombol **Send email** di bagian atas tabel:  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_04_PM.png)

2. Tambahkan block **Email send**:  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM.png)

Kedua cara dapat membuat form pengiriman email yang lengkap.

![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM%20(1).png)

Setiap field di form email konsisten dengan form biasa, dapat dikonfigurasi **default value** atau **linkage rule**, dll.
