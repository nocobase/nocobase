---
title: "Variabel Lingkungan Global"
description: "Variabel lingkungan NocoBase: penjelasan untuk TZ, APP_KEY, DB, dan item konfigurasi lainnya."
keywords: "variabel lingkungan,APP_KEY,TZ,konfigurasi,NocoBase"
---

# Variabel Lingkungan Global

## TZ

Digunakan untuk mengatur zona waktu aplikasi, defaultnya adalah zona waktu sistem operasi.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operasi yang berkaitan dengan waktu akan diproses berdasarkan zona waktu ini. Mengubah TZ dapat memengaruhi nilai tanggal di database. Untuk detail, lihat "[Ikhtisar Tanggal & Waktu](#)"
:::

## APP_ENV

Lingkungan aplikasi, nilai default `development`, opsi yang tersedia:

- `production` Lingkungan produksi
- `development` Lingkungan pengembangan

```bash
APP_ENV=production
```

## APP_KEY

Kunci aplikasi, digunakan untuk menghasilkan token pengguna dan lain-lain. Ubah ke kunci aplikasi Anda sendiri dan pastikan tidak terbocorkan ke pihak luar.

:::warning
Jika APP_KEY diubah, token lama juga akan menjadi tidak valid.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Port aplikasi, nilai default `13000`

```bash
APP_PORT=13000
```

## API_BASE_PATH

Prefix alamat API NocoBase, nilai default `/api/`

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Mode startup multi-core (cluster). Jika variabel ini dikonfigurasi, nilainya akan diteruskan ke perintah `pm2 start` sebagai parameter `-i <instances>`. Opsinya konsisten dengan parameter `-i` pm2 (lihat [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), termasuk:

- `max`: Menggunakan jumlah core CPU maksimum
- `-1`: Menggunakan jumlah core CPU maksimum -1
- `<number>`: Menentukan jumlah core

Nilai default kosong, artinya tidak diaktifkan.

:::warning{title="Perhatian"}
Mode ini perlu digunakan bersama dengan plugin terkait mode cluster, jika tidak fungsi aplikasi mungkin akan bermasalah.
:::

Untuk informasi lebih lanjut: [Mode Cluster](#).

## PLUGIN_PACKAGE_PREFIX

Prefix nama paket plugin, defaultnya: `@nocobase/plugin-,@nocobase/preset-`.

Sebagai contoh, menambahkan plugin `hello` ke proyek `my-nocobase-app`, nama paket lengkap plugin adalah `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX dapat dikonfigurasi sebagai:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Maka korespondensi antara nama plugin dan nama paket adalah sebagai berikut:

- Nama paket plugin `users` adalah `@nocobase/plugin-users`
- Nama paket plugin `nocobase` adalah `@nocobase/preset-nocobase`
- Nama paket plugin `hello` adalah `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Tipe database, opsi yang tersedia:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Host database (perlu dikonfigurasi saat menggunakan database MySQL atau PostgreSQL)

Nilai default `localhost`

```bash
DB_HOST=localhost
```

## DB_PORT

Port database (perlu dikonfigurasi saat menggunakan database MySQL atau PostgreSQL)

- Port default MySQL, MariaDB adalah 3306
- Port default PostgreSQL adalah 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Nama database (perlu dikonfigurasi saat menggunakan database MySQL atau PostgreSQL)

```bash
DB_DATABASE=nocobase
```

## DB_USER

Pengguna database (perlu dikonfigurasi saat menggunakan database MySQL atau PostgreSQL)

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Password database (perlu dikonfigurasi saat menggunakan database MySQL atau PostgreSQL)

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Prefix tabel database

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Apakah nama tabel database dan nama field dikonversi ke gaya snake case, defaultnya `false`. Jika menggunakan database MySQL (MariaDB), dan `lower_case_table_names=1`, maka DB_UNDERSCORED harus `true`

:::warning
Saat `DB_UNDERSCORED=true`, nama tabel dan nama field aktual di database tidak konsisten dengan yang terlihat di antarmuka, contohnya `orderDetails` di database adalah `order_details`
:::

## DB_LOGGING

Saklar log database, nilai default `off`, opsi yang tersedia:

- `on` Aktif
- `off` Nonaktif

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Metode output log, beberapa nilai dipisahkan dengan `,`. Lingkungan pengembangan defaultnya `console`, lingkungan produksi defaultnya `console,dailyRotateFile`.
Opsi yang tersedia:

- `console` - `console.log`
- `file` - `file`
- `dailyRotateFile` - `file rotasi harian`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Path penyimpanan log berbasis file, defaultnya `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Level output log, lingkungan pengembangan defaultnya `debug`, lingkungan produksi defaultnya `info`. Opsi yang tersedia:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Level output log database adalah `debug`, dikontrol oleh `DB_LOGGING` apakah akan menampilkan output, tidak dipengaruhi oleh `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Jumlah file log maksimum yang dipertahankan.

- Saat `LOGGER_TRANSPORT` adalah `file`, nilai default `10`.
- Saat `LOGGER_TRANSPORT` adalah `dailyRotateFile`, gunakan `[n]d` untuk merepresentasikan jumlah hari. Nilai default `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotasi log berdasarkan ukuran.

- Saat `LOGGER_TRANSPORT` adalah `file`, satuannya adalah `byte`, nilai default `20971520 (20 * 1024 * 1024)`.
- Saat `LOGGER_TRANSPORT` adalah `dailyRotateFile`, dapat menggunakan `[n]k`, `[n]m`, `[n]g`. Defaultnya tidak dikonfigurasi.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Format pencetakan log, lingkungan pengembangan defaultnya `console`, lingkungan produksi defaultnya `json`. Opsi yang tersedia:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referensi: [Format Log](#)

## CACHE_DEFAULT_STORE

Identifier unik metode cache yang digunakan, menentukan metode cache default sisi server, nilai default `memory`, opsi bawaan:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Jumlah maksimum item cache memori, nilai default `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Koneksi Redis, opsional. Contoh: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Mengaktifkan pengumpulan data telemetri, defaultnya `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Metric reader yang diaktifkan, defaultnya `console`. Nilai lain perlu mengacu pada nama yang didaftarkan oleh plugin metric reader yang sesuai, seperti `prometheus`. Beberapa nilai dipisahkan dengan `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Trace processor yang diaktifkan, defaultnya `console`. Nilai lain perlu mengacu pada nama yang didaftarkan oleh plugin processor yang sesuai. Beberapa nilai dipisahkan dengan `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```
