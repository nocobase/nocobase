---
title: "Node Workflow - Akhiri Alur"
description: "Node Akhiri Alur: segera mengakhiri workflow, keluar dengan status sukses/gagal yang dikonfigurasi, mirip return."
keywords: "Workflow,akhiri alur,End,terminasi alur,NocoBase"
---

# Akhiri Alur

Node ini saat dieksekusi akan segera mengakhiri eksekusi workflow yang sedang berjalan dan berakhir dengan status yang dikonfigurasi pada Node tersebut. Biasanya digunakan untuk kontrol alur dengan logika tertentu, di mana setelah memenuhi kondisi logika tertentu, alur akan keluar dari workflow saat ini dan tidak melanjutkan pemrosesan alur berikutnya. Dapat dianalogikan dengan instruksi `return` dalam bahasa pemrograman, yang digunakan untuk keluar dari fungsi yang sedang dieksekusi.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Akhiri Alur":

![Akhiri Alur_Tambah](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Konfigurasi Node

![Akhiri Alur_Konfigurasi Node](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Status Akhir

Status akhir akan mempengaruhi status akhir dari rencana eksekusi workflow ini, dapat dikonfigurasi sebagai "sukses" atau "gagal". Saat alur mencapai Node ini, alur akan segera keluar dengan status yang dikonfigurasi.

:::info{title=Tips}
Saat digunakan dalam alur tipe "Event Pra-Aksi", akan menyebabkan request aksi yang memicu di-intercept. Untuk detailnya silakan merujuk ke [Petunjuk Penggunaan "Event Pra-Aksi"](../triggers/pre-action).

Selain menyebabkan request aksi yang memicu di-intercept, konfigurasi status akhir juga akan mempengaruhi status pesan response yang diumpan balik dalam tipe alur ini.
:::
