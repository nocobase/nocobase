---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Sumber Data - KingbaseES

## Pendahuluan

KingbaseES dapat digunakan sebagai sumber data, baik sebagai basis data utama maupun basis data eksternal.

:::warning
Saat ini, hanya basis data KingbaseES yang berjalan dalam mode pg yang didukung.
:::

## Instalasi

### Menggunakan sebagai Basis Data Utama

Prosedur instalasi merujuk pada dokumentasi instalasi. Perbedaannya terutama terletak pada variabel lingkungan.

#### Variabel Lingkungan

Edit file .env untuk menambahkan atau memodifikasi konfigurasi variabel lingkungan berikut:

```bash
# Sesuaikan parameter DB sesuai kebutuhan
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

#### Instalasi Menggunakan create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Menggunakan sebagai Basis Data Eksternal

Jalankan perintah instalasi atau peningkatan

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Aktifkan plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Panduan Pengguna

- Basis Data Utama: Lihat [sumber data utama](/data-sources/data-source-main/)
- Basis Data Eksternal: Lihat [Sumber Data / Basis Data Eksternal](/data-sources/data-source-manager/external-database)