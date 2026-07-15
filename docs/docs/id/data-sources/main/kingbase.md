---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Sumber data utama - KingbaseES"
description: "Memahami versi yang didukung, instalasi plugin, variabel lingkungan, deployment Docker, petunjuk penggunaan, dan pemetaan field saat KingbaseES digunakan sebagai database utama NocoBase."
keywords: "Sumber data utama,人大金仓,KingbaseES,database utama,mode kompatibel PostgreSQL,pemetaan field,NocoBase"
---

# KingbaseES

## Pengenalan

KingbaseES dapat digunakan sebagai database utama NocoBase untuk menyimpan data tabel sistem NocoBase dan data bisnis dari sumber data utama. Database utama dikonfigurasi saat NocoBase di-deploy dan tidak dapat dihapus setelah aplikasi berjalan.

Jika ingin menghubungkan database KingbaseES yang sudah ada sebagai database eksternal, lihat [KingbaseES eksternal](../external/kingbase.md).

| Item konfigurasi | Deskripsi |
| --- | --- |
| Versi yang didukung | >= V9. |
| Versi komersial | Didukung oleh edisi Professional dan Enterprise. |
| Jenis database | Mode kompatibel PostgreSQL. |

:::warning Perhatian

Saat ini hanya database KingbaseES yang berjalan dalam mode kompatibel PostgreSQL yang didukung.

:::

## Instalasi

### Digunakan sebagai database utama

Untuk proses instalasi, lihat [Menginstal aplikasi NocoBase](/ai/install-nocobase-app). Perbedaan utamanya terletak pada variabel lingkungan database.

#### Variabel lingkungan

Ubah file `.env`, lalu tambahkan atau ubah variabel lingkungan terkait database berikut:

```bash
# 根据实际情况调整 DB 相关参数
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
      # 用于生成用户 token 等内容的应用密钥。
      # 修改 APP_KEY 会导致旧 token 失效，请使用随机字符串并妥善保存。
      - APP_KEY=your-secret-key
      # 数据库类型
      - DB_DIALECT=kingbase
      # 数据库地址，如果使用已有数据库服务，可以替换为对应 IP。
      - DB_HOST=kingbase
      - DB_PORT=54321
      # 数据库名称
      - DB_DATABASE=kingbase
      # 数据库用户
      - DB_USER=nocobase
      # 数据库密码
      - DB_PASSWORD=nocobase
      # 时区
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase 测试服务，仅用于本地体验。
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
      DB_MODE: pg  # 仅支持 pg 模式
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### Instalasi menggunakan create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Digunakan sebagai database eksternal

Jika ingin menghubungkan KingbaseES sebagai database eksternal, lihat [KingbaseES eksternal](../external/kingbase.md) untuk informasi tentang akses konfigurasi, parameter koneksi, dan aturan sinkronisasi.

## Petunjuk penggunaan

Sumber data utama KingbaseES kompatibel dengan mode PostgreSQL. Untuk pengelolaan sehari-hari, lihat [Sumber data utama PostgreSQL](./postgresql.md).

1. Saat melakukan deployment NocoBase, pilih atau isi parameter koneksi yang sesuai dengan KingbaseES pada konfigurasi koneksi database.
2. Setelah NocoBase dijalankan, buka sumber data 「Main」 di 「Manajemen sumber data」 untuk mengelola tabel dan field dalam database utama.
3. Jika perlu menghubungkan tabel yang sudah ada di database, gunakan 「Sinkronisasi dari database」 pada halaman pengelolaan database utama.
4. Saat mengonfigurasi field tabel, lihat direktori [Tabel](../data-modeling/collection.md) dan [Field](../data-modeling/collection-fields/index.md) untuk memilih jenis field dan komponen field.

## Pemetaan jenis field

Saat membuat field melalui halaman NocoBase di database utama, NocoBase akan membuat field KingbaseES yang sesuai berdasarkan konfigurasi field. Saat menghubungkan tabel yang sudah ada melalui 「Sinkronisasi dari database」, NocoBase akan mengenali jenis field KingbaseES berdasarkan logika kompatibilitas PostgreSQL, lalu secara otomatis memetakannya ke Field type dan Field interface yang sesuai. Anda dapat menyesuaikan cara tampil di antarmuka dalam konfigurasi field.

Pemetaan umum adalah sebagai berikut:

| Jenis field KingbaseES | NocoBase Field type | Field interface yang tersedia |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer、Sort、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `REAL`、`DOUBLE PRECISION` | `float` | Number、Percent。 |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency。 |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `UUID` | `uuid` | UUID。 |
| `JSON`、`JSONB` | `json`、`array` | JSON。 |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME WITHOUT TIME ZONE` | `time` | Time。 |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON。 |
| `ARRAY` | `array` | Multiple select、Checkbox group、JSON。 |

:::warning Perhatian

Jenis field KingbaseES yang tidak didukung akan ditampilkan secara terpisah dalam konfigurasi field. Field tersebut harus diadaptasi melalui pengembangan terlebih dahulu agar dapat digunakan sebagai field biasa di NocoBase.

:::

Untuk konfigurasi umum lainnya, lihat [Pengenalan sumber data utama](./index.md).
