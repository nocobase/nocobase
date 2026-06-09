---
title: "Deployment produksi"
description: "Selesaikan deployment produksi NocoBase dengan cepat: konfigurasikan auto-start aplikasi terlebih dahulu, lalu reverse proxy."
keywords: "NocoBase,deployment produksi,nb app autostart,nb proxy nginx,nb proxy caddy,Nginx,Caddy"
---

# Deployment produksi

Jika aplikasi NocoBase kamu sudah bisa berjalan normal di server, rollout ke produksi biasanya hanya membutuhkan dua hal tambahan:

1. memastikan aplikasi dapat pulih otomatis setelah mesin di-restart
2. menambahkan entrypoint reverse proxy agar aplikasi dapat diakses dari luar secara stabil

Di NocoBase CLI, grup perintah utama untuk itu adalah:

- `nb app autostart`
- `nb proxy`

Halaman ini menjelaskan alur besarnya terlebih dahulu. Untuk detail Nginx atau Caddy, lanjutkan ke halaman khusus masing-masing provider.

## Langkah 1: konfigurasi auto-start aplikasi

Di produksi, prioritas utamanya bukan domain name, melainkan memastikan servis itu sendiri bisa pulih dengan andal. Jika tidak, setelah mesin direstart, container dibuat ulang, atau ada operasi pemeliharaan, aplikasi bisa saja tidak kembali hidup otomatis.

Subcommand `nb app autostart` yang paling umum digunakan adalah:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Aktifkan auto-start untuk env saat ini:

```bash
nb app autostart enable
```

Jika targetnya bukan env saat ini, sebutkan secara eksplisit:

```bash
nb app autostart enable --env app1 --yes
```

Periksa env mana saja yang ditandai untuk auto-start:

```bash
nb app autostart list
```

Setelah sistem menyala, jalankan semua env yang sudah diaktifkan:

```bash
nb app autostart run
```

Jika kamu ingin melihat output startup yang detail saat debugging:

```bash
nb app autostart run --verbose
```

:::tip Apa yang sebenarnya dilakukan langkah ini

`nb app autostart enable` menandai env yang dikelola CLI agar diizinkan untuk start otomatis. `nb app autostart run` benar-benar menjalankan semua env yang telah diaktifkan auto-start-nya.

Di produksi, biasanya kamu tetap perlu menghubungkan `nb app autostart run` ke alur startup sistemmu sendiri, misalnya lewat `systemd`, startup script platform container, atau mekanisme auto-start level host lain yang sudah kamu pakai.

:::

### Cakupan

`nb app autostart` hanya bekerja untuk env yang runtime-nya dikelola CLI:

- `local`
- `docker`

Jika env hanya berupa koneksi API jarak jauh, atau aplikasi tidak dikelola secara lokal oleh CLI di mesin saat ini, grup perintah ini bukan cara yang tepat untuk auto-start.

## Langkah 2: konfigurasi reverse proxy

Setelah aplikasi bisa pulih otomatis, barulah tangani entrypoint eksternal. Di produksi, reverse proxy biasanya bertanggung jawab atas:

- binding domain name atau port entry
- meneruskan request HTTP dan WebSocket ke NocoBase
- menangani HTTPS, sertifikat, cache, atau kontrol akses

Entrypoint CLI yang direkomendasikan adalah:

- `nb proxy nginx`
- `nb proxy caddy`

### Alur default

Jika aplikasi sudah disimpan sebagai env CLI dan env itu bertipe `local` atau `docker`, cara yang paling umum adalah membiarkan CLI langsung menghasilkan konfigurasinya:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com

nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
```

Lalu jalankan provider yang dipilih:

```bash
nb proxy nginx start
nb proxy caddy start
```

CLI juga membantu menangani detail yang mudah terlewat pada konfigurasi manual, seperti:

- forwarding WebSocket
- URL entry dan aset di bawah subpath
- halaman fallback SPA
- file konfigurasi bersama di level provider

### Kapan memilih Nginx atau Caddy

| Skenario | Rekomendasi |
| --- | --- |
| Kamu sudah menggunakan Nginx untuk mengelola situs, cache, sertifikat, atau kontrol akses | [Nginx](./reverse-proxy/nginx.md) |
| Kamu sudah punya domain dan ingin HTTPS aktif dengan cepat sambil mengelola lebih sedikit detail TLS | [Caddy](./reverse-proxy/caddy.md) |
| Kamu ingin melihat pengantar umumnya terlebih dahulu | [Reverse Proxy di produksi](./reverse-proxy/index.md) |

Jika nanti kamu mengubah pengaturan env seperti `app-port` atau `app-public-path` yang memengaruhi perilaku proxy, jalankan ulang subcommand proxy yang sesuai.

## Jalur rollout default

Untuk rollout produksi paling sederhana, urutan ini biasanya sudah cukup:

1. pastikan aplikasi memang sudah bisa start normal di server itu sendiri
2. jalankan `nb app autostart enable`
3. hubungkan `nb app autostart run` ke alur startup sistem
4. pilih Nginx atau Caddy lalu jalankan subcommand `nb proxy` yang sesuai
5. verifikasi akses eksternal melalui domain name atau alamat entry

## Indeks cepat

| Saya ingin... | Lihat di sini |
| --- | --- |
| Membaca pengantar umum reverse proxy terlebih dahulu | [Reverse Proxy di produksi](./reverse-proxy/index.md) |
| Tetap menggunakan Nginx di entry layer | [Nginx](./reverse-proxy/nginx.md) |
| Menggunakan Caddy agar HTTPS lebih cepat aktif | [Caddy](./reverse-proxy/caddy.md) |
| Melihat operasi start, stop, log, dan upgrade aplikasi | [Kelola aplikasi](../operations/manage-app.md) |
| Membaca referensi CLI `nb proxy nginx` | [`nb proxy nginx`](../../api/cli/proxy/nginx/index.md) |
| Membaca referensi CLI `nb proxy caddy` | [`nb proxy caddy`](../../api/cli/proxy/caddy/index.md) |

## Perintah terkait

```bash
# Aktifkan auto-start untuk satu env
nb app autostart enable --env app1 --yes

# Periksa status auto-start
nb app autostart list

# Jalankan semua env yang sudah diaktifkan
nb app autostart run

# Pilih runtime Nginx dan hasilkan konfigurasi
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com
nb proxy nginx start

# Pilih runtime Caddy dan hasilkan konfigurasi
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
nb proxy caddy start
```
