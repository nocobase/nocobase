---
pkg: "@nocobase/plugin-email-manager"
title: "Email Alias"
description: "Email alias digunakan untuk mengirim email dengan identitas pengirim yang berbeda di bawah akun email yang sama"
keywords: "email alias,identitas pengirim,Send As,Alias,NocoBase"
---

# Email Alias

## Penjelasan Fitur

Email alias digunakan untuk mengirim email dengan identitas pengirim yang berbeda di bawah akun email yang sama.

Saat mengirim, Anda dapat memilih email utama atau alias address yang sudah disinkronkan dari pemilih pengirim. Saat reply, forward, dan recovery draft, sistem akan mempertahankan identitas pengirim asli.

![](https://static-docs.nocobase.com/%E5%8F%91%E9%80%81%E9%82%AE%E4%BB%B6-04-02-2026_06_02_PM.png)

> Outlook tidak mendukung fitur ini.

## Sinkronisasi Alias

Setelah otorisasi akun Gmail berhasil, sistem akan otomatis menyinkronkan alias yang tersedia di bawah email tersebut.

Jika Anda menambah atau menyesuaikan alias di Gmail kemudian, Anda dapat masuk ke setting email, klik "Sync alias" di konfigurasi "Sender name" untuk menarik ulang.

![](https://static-docs.nocobase.com/Email-settings-04-02-2026_06_04_PM.png)

## Memilih Alias Saat Mengirim

Di editor email, klik pemilih pengirim, Anda dapat melihat email utama dan alias yang sudah disinkronkan di bawah akun tersebut.

Jika alias email yang sama terhubung ke beberapa akun bersamaan, pemilih akan menyertakan email utama yang dimiliki, untuk membantu membedakan konteks akun mana yang digunakan secara spesifik.

![](https://static-docs.nocobase.com/%E5%8F%91%E9%80%81%E9%82%AE%E4%BB%B6-04-02-2026_06_02_PM.png)
