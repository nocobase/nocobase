---
title: "Deployment produksi"
description: "Deploy NocoBase ke produksi dengan dua langkah akhir: aktifkan autostart aplikasi dan konfigurasikan reverse proxy."
keywords: "NocoBase,deployment produksi,nb app autostart,nb env proxy,Nginx,Caddy"
---

# Deployment produksi

Jika aplikasi NocoBase Anda sudah berjalan dengan benar di server, biasanya hanya ada dua langkah lagi untuk masuk ke produksi:

1. Pastikan aplikasi dapat start otomatis setelah mesin direstart
2. Letakkan reverse proxy di depan aplikasi agar akses eksternal tetap stabil

Di NocoBase CLI, perintah utamanya adalah:

- `nb app autostart`
- `nb env proxy`

Halaman ini menjelaskan alur besarnya terlebih dahulu. Untuk detail Nginx atau Caddy, lanjutkan ke subhalaman masing-masing.

## Langkah 1: aktifkan autostart aplikasi

Di lingkungan produksi, prioritas pertama bukan domain, tetapi memastikan layanan bisa pulih secara andal setelah reboot, recreasi container, atau pekerjaan maintenance.

Di CLI, `nb app autostart` adalah grup perintah. Yang paling sering dipakai adalah:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Aktifkan autostart untuk env saat ini:

```bash
nb app autostart enable
```

Jika ingin menargetkan env lain secara eksplisit:

```bash
nb app autostart enable --env app1 --yes
```

Lalu cek env mana saja yang sudah ditandai untuk autostart:

```bash
nb app autostart list
```

Setelah sistem boot, jalankan perintah berikut untuk menyalakan semua env yang telah diaktifkan autostart:

```bash
nb app autostart run
```

Jika ingin melihat output startup di level bawah untuk troubleshooting:

```bash
nb app autostart run --verbose
```

:::tip Apa yang sebenarnya dilakukan perintah ini

`nb app autostart enable` menandai env yang dikelola CLI agar boleh dijalankan otomatis.  
`nb app autostart run` adalah perintah yang benar-benar menjalankan semua env yang sudah ditandai untuk autostart.

Artinya, di lingkungan produksi nyata Anda biasanya tetap perlu menghubungkan `nb app autostart run` ke alur startup sistem Anda sendiri, misalnya lewat `systemd`, startup script platform container, atau mekanisme boot host lain yang sudah Anda gunakan.

:::

### Cakupan

`nb app autostart` hanya berlaku untuk env yang memiliki runtime yang dikelola CLI pada mesin saat ini:

- `local`
- `docker`

Jika env hanya berupa koneksi API jarak jauh, atau aplikasi tidak dikelola secara lokal oleh CLI pada mesin ini, perintah ini bukan alat yang tepat untuk autostart.

## Langkah 2: konfigurasi reverse proxy

Setelah aplikasi bisa pulih otomatis, langkah berikutnya adalah menangani entry point eksternal. Di produksi, reverse proxy biasanya bertugas untuk:

- mengikat domain atau port publik
- meneruskan trafik HTTP dan WebSocket ke NocoBase
- menangani HTTPS, sertifikat, cache, atau kontrol akses

Di NocoBase CLI, titik masuk yang direkomendasikan adalah:

- `nb env proxy nginx`
- `nb env proxy caddy`

### Pendekatan default

Jika aplikasi Anda sudah tersimpan sebagai env CLI dan merupakan env `local` atau `docker`, biasanya cukup biarkan CLI membuat konfigurasi proxynya:

```bash
nb env proxy nginx --env app1 --host app.example.com
nb env proxy caddy --env app1 --host app.example.com
```

Jika env saat ini sudah merupakan env target, Anda bisa menghilangkan `--env`:

```bash
nb env proxy nginx --host app.example.com
```

CLI membantu menangani detail yang mudah terlewat saat menulis konfigurasi manual, misalnya:

- forwarding WebSocket
- path entry dan asset statis untuk deployment subpath
- halaman fallback SPA
- file konfigurasi bersama milik provider

### Kapan memilih Nginx atau Caddy

Biasanya Anda bisa menentukannya seperti ini:

| Skenario | Rekomendasi |
| --- | --- |
| Anda sudah memakai Nginx untuk site, cache, sertifikat, atau kontrol akses | [Nginx](./reverse-proxy/nginx.md) |
| Anda sudah punya domain dan ingin HTTPS aktif lebih cepat dengan perawatan TLS yang lebih sedikit | [Caddy](./reverse-proxy/caddy.md) |
| Anda ingin memahami gambaran umum grup perintah ini terlebih dahulu | [Production Reverse Proxy](./reverse-proxy/index.md) |

Jika Anda mengubah konfigurasi env yang memengaruhi hasil proxy, seperti `app-port` atau `app-public-path`, ingat untuk menjalankan ulang subperintah proxy yang sesuai.

## Jalur rollout yang disarankan

Jika Anda ingin jalur produksi yang paling sederhana, urutan ini biasanya bekerja dengan baik:

1. Pastikan aplikasi sudah bisa start dengan benar langsung di server
2. Jalankan `nb app autostart enable`
3. Masukkan `nb app autostart run` ke proses startup sistem Anda
4. Pilih Nginx atau Caddy lalu jalankan subperintah `nb env proxy` yang sesuai
5. Verifikasi akses eksternal melalui domain akhir atau alamat publik

## Tautan cepat

| Saya ingin... | Baca ini |
| --- | --- |
| Mulai dari penjelasan umum reverse proxy | [Production Reverse Proxy](./reverse-proxy/index.md) |
| Tetap memakai Nginx untuk lapisan entry | [Nginx](./reverse-proxy/nginx.md) |
| Memakai Caddy untuk setup HTTPS yang lebih cepat | [Caddy](./reverse-proxy/caddy.md) |
| Mengelola start, stop, log, dan upgrade | [Manage Apps](../operations/manage-app.md) |
| Membaca referensi CLI `nb env proxy` | [`nb env proxy`](../../api/cli/env/proxy/index.md) |

## Perintah terkait

```bash
# Aktifkan autostart untuk satu env
nb app autostart enable --env app1 --yes

# Lihat status autostart
nb app autostart list

# Jalankan semua env dengan autostart aktif
nb app autostart run

# Buat konfigurasi reverse proxy Nginx
nb env proxy nginx --env app1 --host app.example.com

# Buat konfigurasi reverse proxy Caddy
nb env proxy caddy --env app1 --host app.example.com
```
