---
title: Instal aplikasi NocoBase
description: Pasang NocoBase CLI dan buat aplikasi NocoBase baru dengan cepat menggunakan `nb init --ui`, agar AI Agent bisa langsung mulai bekerja.
---

# Instal aplikasi NocoBase

Jika Anda belum memiliki aplikasi NocoBase, cara tercepat adalah memasang `@nocobase/cli` terlebih dahulu, lalu menjalankan `nb init --ui` sekali. Dalam kebanyakan kasus, konfigurasi default pada wizard sudah cukup.

## Prasyarat

- Node.js >= 22
- Yarn 1.x
- Jika Anda berencana memasang dengan Docker, pastikan Docker sudah berjalan terlebih dahulu

## Langkah 1: Pasang CLI

Pasang NocoBase CLI secara global terlebih dahulu:

```bash
npm install -g @nocobase/cli
nb --version
```

Jika Anda sering bekerja dengan beberapa terminal sekaligus atau ingin beroperasi paralel dengan AI Agents, kami juga menyarankan menjalankan `nb session setup` sekali. Dengan begitu, setiap sesi akan menyimpan `current env` miliknya sendiri, sehingga lebih kecil kemungkinan saling memengaruhi.

## Langkah 2: Inisialisasi aplikasi

Rekomendasi defaultnya adalah langsung membuka wizard visual:

```bash
nb init --ui
```

Di dalam wizard, selesaikan langkah-langkah berikut secara berurutan:

1. Atur nama aplikasi - nama ini juga akan menjadi nama env di CLI
2. Pilih "Instalasi Baru"
3. Pilih metode instalasi - Docker, npm, atau Git
4. Atur port, database, dan akun administrator
5. Tunggu hingga proses unduh, instalasi, dan startup selesai

Jika Anda lebih nyaman bekerja lewat terminal, Anda juga bisa langsung menjalankan:

```bash
nb init
```

Jika Anda perlu melakukan inisialisasi dalam script atau CI, gunakan mode non-interaktif:

```bash
nb init --yes --env app1
```

:::tip Instalasi di server remote

Jika Anda menjalankan `nb init --ui` di server, kami menyarankan untuk mengubah default host ke IP server tersebut terlebih dahulu. Dengan begitu, Anda bisa membuka wizard dari browser lokal.

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

:::

## Langkah 3: Pastikan aplikasi siap digunakan

Setelah instalasi selesai, biasanya ada baiknya memastikan tiga hal ini terlebih dahulu:

- Env sudah berhasil disimpan
- Aplikasi sudah berjalan normal
- Anda bisa login menggunakan akun administrator

Perintah yang umum dipakai:

```bash
nb env list
nb env status
nb app logs
```

Untuk instalasi lokal dengan konfigurasi default, biasanya Anda bisa langsung membuka `http://localhost:13000` di browser. Setelah login, buka sesi AI Agent baru atau restart sesi yang sedang berjalan, lalu AI bisa mulai bekerja dengan aplikasi NocoBase ini.

Konfigurasi CLI secara default disimpan di `~/.nocobase/`, sehingga AI Agents biasanya bisa mengaksesnya dari direktori kerja mana pun.

Jika aplikasi ini nantinya akan dibuka untuk pengguna sungguhan, kami tidak menyarankan penggunaan jangka panjang dengan `IP + port` secara langsung. Langkah berikutnya biasanya adalah menambahkan reverse proxy dan mengaktifkan HTTPS.

## Langkah berikutnya

- Jika Anda sudah memiliki instance NocoBase yang sedang berjalan, langsung lihat [Panduan Integrasi AI Agent](./quick-start.mdx)
- Jika Anda ingin melanjutkan ke deployment production, langsung lihat [Instal menggunakan CLI](../nocobase-cli/installation/cli.md) dan [Ringkasan deployment production](../nocobase-cli/production/index.md)
- Jika Anda ingin AI mulai membangun aplikasi setelah ini, langsung lihat [AI Builder](../ai-builder/index.md)
