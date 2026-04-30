---
title: "Panduan Upgrade Instalasi Source Code Git"
description: "Upgrade NocoBase untuk instalasi source code Git: git pull, yarn install, yarn nocobase upgrade, hapus cache dan reinstall dependencies."
keywords: "Source Code Git,Upgrade,git pull,yarn nocobase upgrade,yarn install,NocoBase"
---

# Upgrade Instalasi Source Code Git

:::warning Persiapan Sebelum Upgrade

- Pastikan untuk membackup database terlebih dahulu
- Hentikan NocoBase yang sedang berjalan (`Ctrl + C`)

:::

## 1. Pindah ke Direktori Proyek NocoBase

```bash
cd my-nocobase-app
```

## 2. Tarik Kode Terbaru

```bash
git pull
```

## 3. Hapus Cache dan Dependencies Lama (Opsional)

Jika alur upgrade normal gagal, Anda dapat mencoba menghapus cache dan dependencies, kemudian mendownload ulang

```bash
# Hapus cache nocobase
yarn nocobase clean
# Hapus dependencies
yarn rimraf -rf node_modules # Setara dengan rm -rf node_modules
```

## 4. Update Dependencies

📢 Karena pengaruh kondisi jaringan, konfigurasi sistem, dan faktor lainnya, langkah ini mungkin membutuhkan waktu beberapa belas menit.

```bash
yarn install
```

## 5. Jalankan Perintah Upgrade

```bash
yarn nocobase upgrade
```

## 6. Jalankan NocoBase

```bash
yarn dev
```

:::tip Tips Lingkungan Produksi

NocoBase yang diinstal dari source code tidak disarankan untuk langsung di-deploy ke lingkungan produksi (untuk lingkungan produksi, lihat [Deployment Lingkungan Produksi](../deployment/production.md)).

:::

## 7. Upgrade Plugin Pihak Ketiga

Lihat [Instalasi dan Upgrade Plugin](../install-upgrade-plugins.mdx)
