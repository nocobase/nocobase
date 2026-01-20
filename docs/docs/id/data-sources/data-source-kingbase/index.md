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
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # Kunci aplikasi, digunakan untuk menghasilkan token pengguna, dll.
      # Jika APP_KEY diubah, token lama juga akan menjadi tidak valid.
      # Dapat berupa string acak apa pun, dan pastikan tidak bocor ke publik.
      - APP_KEY=your-secret-key
      # Tipe basis data
      - DB_DIALECT=kingbase
      # Host basis data, dapat diganti dengan IP server basis data yang sudah ada.
      - DB_HOST=kingbase
      # Nama basis data
      - DB_DATABASE=kingbase
      # Pengguna basis data
      - DB_USER=nocobase
      # Kata sandi basis data
      - DB_PASSWORD=nocobase
      # Zona waktu
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Layanan Kingbase hanya untuk tujuan pengujian
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
      ENABLE_CI: no # Harus diatur ke no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Hanya pg
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