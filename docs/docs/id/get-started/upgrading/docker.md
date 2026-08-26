---
title: "Panduan Upgrade Instalasi Docker"
description: "Upgrade NocoBase untuk instalasi Docker: update versi image, docker compose up, image Aliyun, versi hanya bisa naik tidak bisa turun."
keywords: "Upgrade Docker,Versi Image,docker compose up,Image Aliyun,nocobase/nocobase,NocoBase"
---

# Upgrade Instalasi Docker

:::warning Persiapan Sebelum Upgrade

- Pastikan untuk membackup database terlebih dahulu

:::

## 1. Pindah ke Direktori docker-compose.yml

Misalnya

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Update Versi Image

:::tip Penjelasan Versi

- Versi alias seperti `latest` `latest-full` `beta` `beta-full` `alpha` `alpha-full`, umumnya tidak perlu dimodifikasi
- Versi numerik seperti `1.7.14` `1.7.14-full` perlu dimodifikasi ke versi target
- Versi hanya mendukung upgrade, tidak mendukung downgrade!!!
- Untuk lingkungan produksi disarankan menggunakan versi numerik tetap untuk menghindari upgrade otomatis yang tidak disengaja. [Lihat semua versi](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Disarankan menggunakan image Aliyun (lebih stabil di jaringan domestik)
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:1.7.14-full
    # Bisa juga menggunakan versi alias (mungkin upgrade otomatis, gunakan dengan hati-hati untuk produksi)
    # image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    # image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:beta-full
    # Docker Hub (mungkin lambat/gagal di jaringan domestik)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Restart Container

```bash
# Tarik image terbaru
docker compose pull app

# Bangun ulang container
docker compose up -d app

# Lihat status proses app
docker compose logs -f app
```

## 4. Upgrade Plugin Pihak Ketiga

Lihat [Instalasi dan Upgrade Plugin](../install-upgrade-plugins.mdx)

## 5. Penjelasan Rollback

NocoBase tidak mendukung downgrade. Jika perlu rollback, kembalikan backup database sebelum upgrade dan ubah versi image kembali ke versi sebelumnya.

## 6. Pertanyaan yang Sering Diajukan (FAQ)

**Q: Tarik image lambat atau gagal**

Gunakan akselerasi mirror, atau gunakan image Aliyun `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:<tag>`

**Q: Versi tidak berubah**

Pastikan `image` sudah dimodifikasi ke versi baru, dan `docker compose pull app` serta `up -d app` berhasil dijalankan

**Q: Download atau update Plugin komersial gagal**

Untuk Plugin komersial, verifikasi kode lisensi di sistem, kemudian restart container Docker. Lihat detail di [Panduan Aktivasi Lisensi Komersial NocoBase](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).
