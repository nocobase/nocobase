---
title: "Node Workflow - Tunda"
description: "Node tunda: menambahkan tunda dalam alur, dapat dikombinasikan dengan cabang paralel untuk implementasi penanganan timeout, lanjutkan atau hentikan setelah tunda."
keywords: "Workflow,tunda,Delay,penanganan timeout,cabang paralel,NocoBase"
---

# Tunda

## Pengantar

Node tunda dapat menambahkan tunda dalam alur. Setelah tunda berakhir, sesuai konfigurasi dapat melanjutkan eksekusi Node setelah tunda atau menghentikan alur lebih awal.

Biasanya digunakan bersama Node cabang paralel, dapat menambahkan Node tunda di salah satu cabang, untuk mencapai tujuan penanganan terkait setelah timeout. Misalnya pada cabang paralel salah satu cabang mengandung penanganan manual, cabang lain mengandung Node tunda. Saat penanganan manual timeout, jika diatur sebagai gagal saat timeout, berarti penanganan manual harus diselesaikan dalam waktu yang ditentukan. Jika diatur sebagai lanjutkan saat timeout, berarti setelah waktu tersebut tiba penanganan manual dapat diabaikan.

## Instalasi

Plugin bawaan, tidak perlu diinstal.

## Membuat Node

Pada antarmuka konfigurasi Workflow, klik tombol plus ("+") di alur, tambahkan Node "Tunda":

![Buat Node tunda](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Konfigurasi Node

![Node tunda_konfigurasi Node](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Waktu Tunda

Waktu tunda dapat diisi dengan satu angka, dan memilih unit waktu. Unit waktu yang didukung: detik, menit, jam, hari, dan minggu.

### Status Saat Tiba

Status saat tiba dapat memilih "Lulus dan Lanjutkan" dan "Gagal dan Keluar". Yang pertama berarti setelah tunda berakhir, alur akan melanjutkan eksekusi Node setelah tunda. Yang kedua berarti setelah tunda berakhir, alur akan dihentikan lebih awal dengan status gagal.

## Contoh

Mari ambil contoh skenario yang perlu menjawab dalam batas waktu setelah tiket diinisiasi. Kita perlu menambahkan Node manual di salah satu dari dua cabang paralel, cabang lainnya menambahkan Node tunda. Jika penanganan manual tidak menjawab dalam 10 menit, perbarui status tiket menjadi timeout belum diproses.

![Node tunda_contoh_organisasi alur](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)
