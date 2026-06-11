---
title: "Input Pemindaian"
description: "Pengaturan bidang: aktifkan input pemindaian untuk bidang formulir teks, dan dukung penulisan nilai bidang melalui kode QR atau barcode."
keywords: "input pemindaian,kode QR,barcode,pengaturan bidang,pembangun antarmuka,NocoBase"
---

# Input Pemindaian

## Pendahuluan

Input pemindaian digunakan untuk bidang teks dalam formulir yang dapat diedit. Setelah diaktifkan, tombol pindai akan muncul di sisi kanan bidang input. Pengguna dapat memindai kode QR atau barcode, atau memilih gambar dari album untuk dikenali, lalu menulis hasil pengenalan ke bidang saat ini.

Biasanya ini cocok untuk memasukkan nomor perangkat, kode aset, nomor pesanan, nomor resi, dan nilai lain yang kurang cocok untuk diketik secara manual.

## Bidang yang Didukung

Input pemindaian terutama digunakan untuk bidang berbasis teks, seperti:

- Teks satu baris
- Nomor ponsel
- Email
- URL
- UUID
- Nano ID

Jika bidang bersifat hanya-baca, dalam mode baca, atau tidak mendukung input yang dapat diedit, konfigurasi input pemindaian tidak akan ditampilkan.

## Konfigurasi

Pilih bidang yang sesuai di blok formulir, buka menu konfigurasi bidang, lalu cari `Pengaturan Input Pemindaian`.

Opsi meliputi:

- `Aktifkan input pemindaian`: setelah diaktifkan, tombol pindai akan ditampilkan di sisi kanan kotak input
- `Nonaktifkan input manual`: setelah diaktifkan, pengguna hanya dapat menulis nilai bidang melalui pemindaian dan tidak dapat mengedit kotak input secara manual

Setelah `Aktifkan input pemindaian` dimatikan, `Nonaktifkan input manual` juga menjadi tidak berlaku.

## Penggunaan

Setelah pengguna mengklik tombol pindai di sisi kanan bidang, mereka dapat menggunakan kamera untuk mengenali kode QR atau barcode. Pemindaian di browser memerlukan izin akses kamera. Dalam lingkungan seluler yang mendukung kemampuan pemindaian bawaan, kemampuan pemindaian bawaan perangkat akan digunakan terlebih dahulu.

Jika tidak nyaman menggunakan kamera secara langsung, pengguna juga dapat mengklik `Album` untuk memilih gambar yang akan dikenali.
