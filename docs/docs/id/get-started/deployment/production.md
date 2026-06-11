---
title: "Deployment Lingkungan Produksi NocoBase"
description: "Alur deployment produksi NocoBase: direkomendasikan Docker atau create-nocobase-app, proxy sumber daya statis (Nginx/Caddy/CDN), perintah operasi docker compose/pm2."
keywords: "Deployment Lingkungan Produksi,Deployment Produksi,Deployment Docker,Proxy Sumber Daya Statis,Nginx,Caddy,Perintah Operasi,NocoBase"
---

# Deployment Lingkungan Produksi

Saat men-deploy NocoBase di lingkungan produksi, karena perbedaan cara build pada sistem dan lingkungan yang berbeda, instalasi dependencies bisa menjadi rumit. Untuk mendapatkan pengalaman fitur yang lengkap, kami merekomendasikan menggunakan **Docker** untuk deployment. Jika lingkungan sistem tidak dapat menggunakan Docker, Anda juga dapat menggunakan **create-nocobase-app** untuk deployment.

:::warning

Tidak disarankan untuk langsung men-deploy source code di lingkungan produksi. Source code memiliki banyak dependencies, ukuran yang besar, dan kompilasi penuh memerlukan CPU dan memori yang tinggi. Jika benar-benar perlu menggunakan source code untuk deployment, disarankan untuk membangun image Docker kustom terlebih dahulu, kemudian melakukan deployment.

:::

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
