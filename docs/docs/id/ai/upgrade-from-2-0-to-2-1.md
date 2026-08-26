---
title: Panduan upgrade NocoBase 2.0 ke 2.1
description: Upgrade aplikasi NocoBase 2.0 ke 2.1, termasuk metode instalasi lama, opsi nb CLI, dan jalur migrasi yang direkomendasikan.
---

# Cara upgrade NocoBase dari 2.0 ke 2.1

Upgrade dari NocoBase 2.0 ke NocoBase 2.1 berjalan mulus untuk aplikasinya. Perubahan yang lebih besar ada pada NocoBase CLI.

Rinciannya:

- Di 2.0 dan versi sebelumnya, perintah CLI biasanya diawali dengan `yarn nocobase`
- Di 2.1 dan versi setelahnya, CLI menggunakan `nb` yang diinstal secara global

Aplikasi lama tidak harus langsung pindah ke `nb`. Jika kamu hanya ingin meng-upgrade aplikasi NocoBase 2.0 yang sudah berjalan stabil ke 2.1, secara default tetap gunakan metode instalasi dan upgrade sebelumnya. Untuk aplikasi baru, kami merekomendasikan CLI `nb` yang baru.

## Tetap menggunakan metode instalasi dan upgrade lama

Jika kamu sudah terbiasa dengan metode instalasi sebelumnya, kamu bisa terus menggunakannya. Instalasi dan upgrade tetap mengikuti dokumentasi lama.

### Instal NocoBase

- [Instalasi Docker](/get-started/installation/docker)
- [Instalasi create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Instalasi dari source Git](/get-started/installation/git)

### Upgrade NocoBase

- [Upgrade instalasi Docker](/get-started/upgrading/docker)
- [Upgrade instalasi create-nocobase-app](/get-started/upgrading/create-nocobase-app)
- [Upgrade instalasi dari source Git](/get-started/upgrading/git)

## Gunakan `nb` CLI untuk aplikasi baru

Untuk aplikasi baru, kami merekomendasikan alur instalasi dan upgrade yang lebih praktis dengan `nb`.

### Instal NocoBase

- [Instal aplikasi NocoBase](./install-nocobase-app.md)

### Upgrade NocoBase

- [Upgrade aplikasi NocoBase](./upgrade-nocobase-app.md)

## Cara migrasi ke `nb` CLI

Jika kamu ingin mengelola aplikasi secara seragam dengan `nb` ke depannya, pendekatan yang lebih aman untuk saat ini adalah membuat aplikasi baru, lalu memigrasikan data aplikasi lama ke sana.

Langkah migrasi:

1. Buat aplikasi CLI baru dengan `nb init`
2. Migrasikan database, `storage`, dan variabel lingkungan yang diperlukan dari aplikasi lama
3. Setelah memastikan aplikasi baru berjalan dengan baik, alihkan lingkungan produksi

Kamu juga bisa menunggu sebentar. Kemampuan `nb` untuk mengambil alih aplikasi lokal lama masih dalam pengembangan.

![2026-06-13-21-29-24](https://static-docs.nocobase.com/2026-06-13-21-29-24.png)
