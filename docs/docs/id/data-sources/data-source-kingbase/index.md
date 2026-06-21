---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Data Source - KingbaseES"
description: "Menggunakan KingbaseES sebagai database utama atau database eksternal, mendukung mode pg, konfigurasi environment variable, dan deployment Docker."
keywords: "KingbaseES,KingbaseES,database utama,database eksternal,database lokal Tiongkok,NocoBase"
---
# Data Source - KingbaseES

## Pengantar

Menggunakan database KingbaseES sebagai data source, dapat digunakan baik sebagai database utama maupun sebagai database eksternal.

:::warning
Saat ini hanya mendukung database KingbaseES yang berjalan dalam mode pg.
:::

## Instalasi

### Penggunaan sebagai Database Utama

Alur instalasi mengacu pada dokumentasi instalasi, perbedaan utama terletak pada environment variable.

#### Environment Variable

Modifikasi file .env untuk menambahkan atau mengubah konfigurasi environment variable terkait berikut

```bash
# Sesuaikan parameter DB sesuai dengan situasi aktual
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Instalasi Docker

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # Application key for generating user tokens, etc.
      # Changing APP_KEY invalidates old tokens
      # Use a random string and keep it confidential
      - APP_KEY=your-secret-key
      # Database type
      - DB_DIALECT=kingbase
      # Database host, replace with existing database server IP if needed
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Database name
      - DB_DATABASE=kingbase
      # Database user
      - DB_USER=nocobase
      # Database password
      - DB_PASSWORD=nocobase
      # Timezone
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase service for testing purposes only
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg only
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### Instalasi dengan create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Penggunaan sebagai Database Eksternal

Jalankan perintah instalasi atau upgrade

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Aktifkan plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Panduan Penggunaan

- Database Utama: Lihat data source utama
- Database Eksternal: Lihat [Data Source / Database Eksternal](/data-sources/data-source-manager/external-database) 
