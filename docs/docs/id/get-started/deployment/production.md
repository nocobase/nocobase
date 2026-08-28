---
title: "Deployment Lingkungan Produksi NocoBase"
description: "Alur deployment produksi NocoBase: direkomendasikan Docker atau create-nocobase-app, proxy sumber daya statis (Nginx/Caddy/CDN), perintah operasi docker compose/pm2."
keywords: "Deployment Lingkungan Produksi,Deployment Produksi,Deployment Docker,Proxy Sumber Daya Statis,Nginx,Caddy,Perintah Operasi,NocoBase"
---

# Deployment Lingkungan Produksi

Saat men-deploy NocoBase di lingkungan produksi, karena perbedaan cara build pada sistem dan lingkungan yang berbeda, instalasi dependencies bisa menjadi rumit. Untuk mendapatkan pengalaman fitur yang lengkap, kami merekomendasikan menggunakan **Docker** untuk deployment. Jika lingkungan sistem tidak dapat menggunakan Docker, Anda juga dapat menggunakan **create-nocobase-app** untuk deployment.

:::warning Perhatian

Tidak disarankan untuk langsung men-deploy source code di lingkungan produksi. Source code memiliki banyak dependencies, ukuran yang besar, dan kompilasi penuh memerlukan CPU dan memori yang tinggi. Jika benar-benar perlu menggunakan source code untuk deployment, disarankan untuk membangun image Docker kustom terlebih dahulu, kemudian melakukan deployment.

:::

:::warning Perhatian

Jika men-deploy beberapa layanan NocoBase yang berdiri sendiri, gunakan `hostname` yang berbeda untuk setiap layanan, misalnya subdomain yang berbeda. Jangan hanya membedakan layanan berdasarkan port seperti `https://example.com:13000` dan `https://example.com:14000`.

NocoBase menggunakan cookie untuk mempertahankan status login dan [izin akses file](../../file-manager/stable-url.md). Browser tidak mengisolasi cookie berdasarkan port, sehingga layanan pada port berbeda di bawah `hostname` yang sama dapat berbagi cookie dengan nama yang sama. Hal ini dapat menimpa status login atau menyebabkan kegagalan otorisasi pada pratinjau dan unduhan file.

Sub-app dalam deployment NocoBase yang sama tidak termasuk dalam pembatasan ini. Cookie login dibedakan berdasarkan nama aplikasi, sehingga aplikasi utama dan sub-app dengan nama berbeda dapat berbagi `hostname` yang sama.

Namun, layanan independen tetap harus diisolasi. Jika layanan NocoBase lain berjalan pada port berbeda di bawah `hostname` yang sama dan memiliki aplikasi utama atau sub-app dengan nama yang sama, cookie tetap dapat mengalami konflik.

Gunakan alamat seperti `app1.example.com` dan `app2.example.com`, lalu arahkan ke layanan NocoBase yang berbeda melalui Nginx atau Caddy.

:::

## Frontend terpisah / Akses API lintas origin

Sebaiknya halaman dan API tetap berada pada origin yang sama: gunakan reverse proxy di domain yang sama untuk meneruskan `${APP_PUBLIC_PATH}api/` dan `${APP_PUBLIC_PATH}files/` ke layanan NocoBase, lalu biarkan `API_BASE_URL` kosong.

Jika halaman memang harus mengakses API secara lintas origin (`API_BASE_URL` menunjuk ke origin lain), tambahkan origin halaman ke `CORS_ORIGIN_WHITELIST`. Jika tidak, browser akan mengabaikan `Set-Cookie` pada respons API, cookie login tidak akan tersimpan, dan pratinjau maupun unduhan melalui stable file URL akan gagal otorisasi.

Perhatikan juga bahwa cookie disimpan per `hostname`: jika halaman dan API menggunakan domain yang benar-benar berbeda, permintaan ke `/files/` dari domain halaman tidak akan membawa cookie login yang tersimpan di domain API. Deployment seperti ini sebaiknya diubah ke reverse proxy same-origin. Lihat [Variabel lingkungan](../installation/env.md#api_base_url).

## Alur Deployment

Deployment lingkungan produksi dapat merujuk ke langkah-langkah instalasi dan upgrade yang sudah ada.

### Instalasi Baru

- [Instalasi Docker](../installation/docker.mdx)
- [Instalasi create-nocobase-app](../installation/create-nocobase-app.mdx)

### Upgrade Aplikasi

- [Upgrade Instalasi Docker](../installation/docker.mdx)
- [Upgrade Instalasi create-nocobase-app](../installation/create-nocobase-app.mdx)

### Instalasi dan Upgrade Plugin Pihak Ketiga

- [Instalasi dan Upgrade Plugin](../install-upgrade-plugins.mdx)

## Proxy Sumber Daya Statis

Di lingkungan produksi, disarankan untuk menyerahkan pengelolaan sumber daya statis ke server proxy, misalnya:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Perintah Operasi yang Sering Digunakan

Berdasarkan metode instalasi yang berbeda, Anda dapat menggunakan perintah berikut untuk mengelola proses NocoBase:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)
