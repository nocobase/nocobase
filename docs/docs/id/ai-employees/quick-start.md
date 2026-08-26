---
pkg: '@nocobase/plugin-ai'
title: 'Mulai Cepat Karyawan AI'
description: 'Selesaikan konfigurasi minimum yang dapat digunakan Karyawan AI dalam 5 menit: pasang Plugin, konfigurasi model LLM, aktifkan karyawan bawaan, mulai kolaborasi, termasuk daftar karyawan preset Cole, Ellis, Dex, Viz, dll.'
keywords: 'Mulai Cepat Karyawan AI,Konfigurasi NocoBase AI,LLM Service,Karyawan Bawaan,Cole,Dex,Viz'
---

# Mulai Cepat

Mari kita selesaikan konfigurasi minimum yang dapat digunakan Karyawan AI dalam 5 menit.

## Pasang Plugin

Karyawan AI adalah Plugin bawaan NocoBase (`@nocobase/plugin-ai`), tanpa instalasi terpisah.

## Konfigurasi Model

Anda dapat mengonfigurasi LLM Service melalui salah satu entry berikut:

1. Entry backend: `Pengaturan Sistem -> Karyawan AI -> LLM service`.
2. Entry shortcut frontend: Saat memilih model di panel dialog AI, klik shortcut "Tambah LLM Service" untuk langsung beralih.

![20260425172540](https://static-docs.nocobase.com/20260425172540.png)

Umumnya Anda perlu:

1. Memilih Provider.
2. Mengisi API Key.
3. Mengonfigurasi enabled models, default menggunakan model rekomendasi sudah cukup.

## Aktifkan Karyawan Bawaan

Karyawan AI bawaan secara default sudah semua diaktifkan, biasanya tidak perlu diaktifkan satu per satu secara manual.

Jika Anda perlu menyesuaikan cakupan ketersediaan (aktifkan/nonaktifkan karyawan tertentu), Anda dapat memodifikasi switch `Enabled` di halaman daftar `Pengaturan Sistem -> Karyawan AI`.

![](https://static-docs.nocobase.com/202604230813855.png)

## Mulai Kolaborasi

Klik entry Karyawan AI di pojok kanan bawah untuk membuka jendela dialog

![](https://static-docs.nocobase.com/202604230814677.png)

Karyawan AI default adalah pemimpin tim Atlas, Anda dapat langsung memasukkan pertanyaan untuk memulai dialog, saat dibutuhkan ia akan memanggil karyawan yang sesuai berdasarkan pertanyaan Anda untuk berkolaborasi menyelesaikan tugas. Anda juga dapat secara manual beralih ke karyawan dan model yang sesuai sesuai kebutuhan skenario tertentu.

![](https://static-docs.nocobase.com/202604230816190.png)

Anda juga dapat:

- Menambahkan Block
- Menambahkan attachment
- Mengaktifkan pencarian web

## Tugas Cepat

Anda dapat preset tugas umum di posisi saat ini untuk setiap Karyawan AI, mengonfigurasi terlebih dahulu informasi seperti latar belakang tugas, pesan Pengguna, konteks Block, dll, sehingga dengan satu klik dapat mulai bekerja, praktis dan cepat.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Daftar Karyawan Bawaan

NocoBase menyediakan beberapa Karyawan AI yang ditujukan untuk skenario.

Anda hanya perlu:

1. Mengonfigurasi LLM Service.
2. Menyesuaikan status aktif karyawan sesuai kebutuhan (default sudah diaktifkan).
3. Memilih model dalam sesi dan mulai berkolaborasi.

| Nama Karyawan | Positioning Role | Kemampuan Inti |
| :------------ | :--------------- | :------------- |
| **Atlas** | Pemimpin Tim | Karyawan AI umum default, mengenali maksud Pengguna, secara otomatis menugaskan Karyawan AI yang sesuai untuk menangani masalah |
| **Dex** | Spesialis Pengelolaan Data | Terjemahan Field, format, ekstraksi informasi |
| **Viz** | Analis Insight | Insight data, analisis tren, interpretasi indikator kunci |
| **Lexi** | Asisten Terjemahan | Terjemahan multi-bahasa, bantuan komunikasi |
| **Vera** | Analis Riset | Pencarian web, ringkasan informasi, riset mendalam |
| **Ellis** | Spesialis Email | Penulisan email, pembuatan ringkasan, saran balasan |
| **Orin** | Spesialis Pemodelan Data | Membantu merancang struktur tabel data, saran Field |
| **Nathan** | Engineer Frontend | Membantu menulis snippet kode frontend, penyesuaian style |
| **Dara** | Spesialis Visualisasi Data | Mengonfigurasi grafik |

**Catatan**

Sebagian Karyawan AI bawaan memiliki skenario kerja eksklusif:

- Orin: Halaman pemodelan data.
- Dara: Block konfigurasi grafik.
- Nathan: Code editor seperti JS Block.
