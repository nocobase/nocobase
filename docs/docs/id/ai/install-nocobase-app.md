---
title: Instal aplikasi NocoBase
description: Pasang NocoBase CLI dan buat aplikasi NocoBase baru dengan cepat menggunakan `nb init --ui`, agar AI Agent bisa langsung mulai bekerja.
---

# Instal aplikasi NocoBase

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

![2026-06-11-20-14-32](https://static-docs.nocobase.com/2026-06-11-20-14-32.png)

Tergantung jalur setup yang Anda pilih, langkah yang muncul bisa sedikit berbeda. Jika Anda mengikuti jalur default `Install a new app`, biasanya Anda akan melihat enam langkah berikut:

1. `Getting started` - tetapkan identifier `--env` dan pilih `Install a new app`
2. `App environment` - atur informasi dasar aplikasi, lokasi penyimpanan, dan port runtime
3. `App source and version` - pilih cara mendapatkan aplikasi serta source dan version yang akan digunakan
4. `Configure the database` - pilih database bawaan atau database kustom
5. `Create an admin account` - siapkan akun administrator pertama
6. `Connection & authentication` - masukkan URL akses aplikasi dan pilih metode autentikasi

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
nb env info
nb app logs
```

Untuk instalasi lokal dengan konfigurasi default, biasanya Anda bisa langsung membuka `http://localhost:13000` di browser. Setelah login, buka sesi AI Agent baru atau restart sesi yang sedang berjalan, lalu AI bisa mulai bekerja dengan aplikasi NocoBase ini.

Konfigurasi CLI secara default disimpan di `~/.nocobase/`, sehingga AI Agents biasanya bisa mengaksesnya dari direktori kerja mana pun.

Jika aplikasi ini nantinya akan dibuka untuk pengguna sungguhan, kami tidak menyarankan penggunaan jangka panjang dengan `IP + port` secara langsung. Langkah berikutnya biasanya adalah menambahkan reverse proxy dan mengaktifkan HTTPS.

## Langkah berikutnya

- Jika Anda sudah memiliki aplikasi NocoBase yang berjalan, lihat [Panduan Integrasi AI Agent](./quick-start.mdx)
- Jika Anda ingin mengelola startup, shutdown, log, dan upgrade aplikasi, lihat [Kelola aplikasi](../nocobase-cli/operations/manage-app.md)
- Jika Anda ingin melanjutkan deployment produksi, lihat [Instal aplikasi dengan CLI](../nocobase-cli/installation/cli.md) dan [Ringkasan deployment produksi](../nocobase-cli/production/index.md)
- Jika Anda ingin AI mulai membangun aplikasi, lihat [AI Builder](../ai-builder/index.md)

## Tautan terkait

- [Perbandingan Metode Instalasi dan Versi](../get-started/quickstart.md) — Bandingkan dulu metode instalasi dan kanal versi, lalu putuskan cara instalasinya
- [Panduan Integrasi AI Agent](./quick-start.mdx) — Hubungkan aplikasi NocoBase yang sudah ada dan biarkan AI Agent mulai bekerja
- [Referensi perintah `nb init`](../api/cli/init.md) — Inisialisasi aplikasi baru, ambil alih aplikasi lokal yang sudah ada, atau hubungkan aplikasi remote
- [Referensi perintah `nb env info`](../api/cli/env/info.md) — Lihat detail koneksi dan konfigurasi runtime dari env saat ini
- [NocoBase CLI](../api/cli/index.md) — Referensi lengkap untuk semua perintah `nb`
- [Kelola aplikasi](../nocobase-cli/operations/manage-app.md) — Mulai, hentikan, restart, lihat log, dan upgrade aplikasi
- [Beberapa manajemen lingkungan](../nocobase-cli/operations/multi-environment.md) — Operasi umum saat Anda memelihara beberapa env sekaligus
