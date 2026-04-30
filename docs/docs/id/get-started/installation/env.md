---
title: "Konfigurasi Environment Variable NocoBase"
description: "Environment variable NocoBase: TZ timezone, APP_KEY, DB database, CACHE, FILE_STORAGE dan konfigurasi lainnya, cara setting Docker dan create-nocobase-app."
keywords: "environment variable,APP_KEY,TZ,konfigurasi DB,CACHE,FILE_STORAGE,Docker environment variable,NocoBase"
---

# Environment Variable

## Bagaimana cara mengatur environment variable?

### Instalasi Git source code atau create-nocobase-app

Atur environment variable pada file `.env` di direktori root proyek. Setelah memodifikasi environment variable, Anda perlu menghentikan proses aplikasi dan memulainya kembali.

### Instalasi Docker

Modifikasi konfigurasi `docker-compose.yml`, lalu atur environment variable di parameter `enviroment`. Contoh:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Anda juga dapat menggunakan `env_file`, yaitu mengatur environment variable di file `.env`. Contoh:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Setelah memodifikasi environment variable, Anda perlu membangun ulang container app.

```yml
docker compose up -d app
```

## Environment Variable Global

### TZ

Digunakan untuk mengatur timezone aplikasi, default-nya adalah timezone sistem operasi.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operasi yang berkaitan dengan waktu akan diproses berdasarkan timezone ini. Mengubah TZ dapat memengaruhi nilai tanggal di database. Untuk detailnya lihat "[Ikhtisar Tanggal & Waktu](/data-sources/data-modeling/collection-fields/datetime)"
:::

### APP_ENV

Environment aplikasi, nilai default-nya `development`. Opsi yang tersedia:

- `production` Environment produksi
- `development` Environment development

```bash
APP_ENV=production
```

### APP_KEY

Kunci rahasia aplikasi, digunakan untuk menghasilkan token user dan lain-lain. Ubah menjadi kunci rahasia milik Anda sendiri dan pastikan tidak bocor ke pihak luar.

:::warning
Jika APP_KEY diubah, token lama juga akan menjadi tidak valid
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Port aplikasi, nilai default `13000`

```bash
APP_PORT=13000
```

### API_BASE_PATH

Prefiks URL API NocoBase, nilai default `/api/`

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Mode startup multi-core (cluster). Jika variable ini dikonfigurasi, nilainya akan diteruskan ke perintah `pm2 start` sebagai parameter `-i <instances>`. Opsi yang tersedia sama dengan parameter `-i` pada pm2 (lihat [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), termasuk:

- `max`: Menggunakan jumlah core CPU maksimum
- `-1`: Menggunakan jumlah core CPU maksimum dikurangi 1
- `<number>`: Menentukan jumlah core

Nilai default kosong, yang berarti tidak diaktifkan.

:::warning{title="Perhatian"}
Mode ini perlu digunakan bersama dengan plugin terkait cluster mode, jika tidak fungsi aplikasi mungkin mengalami anomali.
:::

Untuk informasi lebih lanjut, lihat: [Cluster Mode](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Prefiks nama paket plugin, default-nya: `@nocobase/plugin-,@nocobase/preset-`.

Contohnya, menambahkan plugin `hello` ke proyek `my-nocobase-app`, maka nama paket lengkap plugin tersebut adalah `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX dapat dikonfigurasi sebagai:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Maka korespondensi antara nama plugin dan nama paket adalah sebagai berikut:

- Nama paket plugin `users` adalah `@nocobase/plugin-users`
- Nama paket plugin `nocobase` adalah `@nocobase/preset-nocobase`
- Nama paket plugin `hello` adalah `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Tipe database, opsi yang tersedia:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Host database (perlu dikonfigurasi saat menggunakan database MySQL atau PostgreSQL)

Nilai default `localhost`

```bash
DB_HOST=localhost
```

### DB_PORT

Port database (perlu dikonfigurasi saat menggunakan database MySQL atau PostgreSQL)

- Port default MySQL, MariaDB adalah 3306
- Port default PostgreSQL adalah 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Nama database (perlu dikonfigurasi saat menggunakan database MySQL atau PostgreSQL)

```bash
DB_DATABASE=nocobase
```

### DB_USER

User database (perlu dikonfigurasi saat menggunakan database MySQL atau PostgreSQL)

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Password database (perlu dikonfigurasi saat menggunakan database MySQL atau PostgreSQL)

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Prefiks tabel database

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Apakah nama tabel dan nama field di database dikonversi ke gaya snake case, default-nya `false`. Jika menggunakan database MySQL (MariaDB) dan `lower_case_table_names=1`, maka DB_UNDERSCORED harus `true`

:::warning
Ketika `DB_UNDERSCORED=true`, nama tabel dan nama field aktual di database tidak konsisten dengan yang terlihat di antarmuka, misalnya `orderDetails` di database menjadi `order_details`
:::

### DB_LOGGING

Switch log database, nilai default `off`. Opsi yang tersedia:

- `on` Aktif
- `off` Nonaktif

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Jumlah koneksi maksimum pada connection pool database, nilai default `5`.

### DB_POOL_MIN

Jumlah koneksi minimum pada connection pool database, nilai default `0`.

### DB_POOL_IDLE

Waktu idle connection pool database, nilai default `10000` (10 detik).

### DB_POOL_ACQUIRE

Waktu tunggu maksimum untuk mendapatkan koneksi dari connection pool database, nilai default `60000` (60 detik).

### DB_POOL_EVICT

Waktu hidup maksimum koneksi pada connection pool database, nilai default `1000` (1 detik).

### DB_POOL_MAX_USES

Berapa kali sebuah koneksi dapat digunakan sebelum dibuang dan diganti, nilai default `0` (tidak terbatas).

### LOGGER_TRANSPORT

Cara output log, beberapa cara dipisahkan dengan `,`. Nilai default environment development adalah `console`, environment produksi default-nya `console,dailyRotateFile`.
Opsi yang tersedia:

- `console` - `console.log`
- `file` - `file`
- `dailyRotateFile` - `file rolling harian`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Path penyimpanan log berbasis file, default-nya `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Level output log, environment development default-nya `debug`, environment produksi default-nya `info`. Opsi yang tersedia:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Level output log database adalah `debug`, dikontrol oleh `DB_LOGGING` apakah dioutput, tidak dipengaruhi oleh `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Jumlah maksimum file log yang dipertahankan.

- Ketika `LOGGER_TRANSPORT` adalah `file`, nilai default-nya `10`.
- Ketika `LOGGER_TRANSPORT` adalah `dailyRotateFile`, gunakan `[n]d` untuk mewakili jumlah hari. Nilai default-nya `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Rolling log berdasarkan ukuran.

- Ketika `LOGGER_TRANSPORT` adalah `file`, satuannya `byte`, nilai default-nya `20971520 (20 * 1024 * 1024)`.
- Ketika `LOGGER_TRANSPORT` adalah `dailyRotateFile`, dapat menggunakan `[n]k`, `[n]m`, `[n]g`. Default-nya tidak dikonfigurasi.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Format pencetakan log, environment development default-nya `console`, environment produksi default-nya `json`. Opsi yang tersedia:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referensi: [Format Log](/log-and-monitor/logger/index.md#日志格式)

### CACHE_DEFAULT_STORE

Identifier unik untuk metode caching, menentukan metode caching default sisi server. Nilai default `memory`. Opsi bawaan:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Jumlah maksimum item cache memory, nilai default `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Koneksi Redis, opsional. Contoh: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Mengaktifkan pengumpulan data telemetri, default-nya `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Metric reader monitoring yang diaktifkan, default-nya `console`. Nilai lain perlu merujuk pada nama yang didaftarkan oleh plugin metric reader yang sesuai, misalnya `prometheus`. Beberapa nilai dipisahkan dengan `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Trace processor yang diaktifkan, default-nya `console`. Nilai lain perlu merujuk pada nama yang didaftarkan oleh plugin processor yang sesuai. Beberapa nilai dipisahkan dengan `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

### WORKER_MODE

Digunakan untuk mengonfigurasi mode kerja node yang berbeda saat melakukan service splitting di mode cluster. Untuk detailnya lihat "[Service Splitting: Cara Membagi Service](/cluster-mode/services-splitting#如何拆分服务)".

### SERVER_REQUEST_WHITELIST

Whitelist target untuk request HTTP yang dikirim sisi server ke luar, untuk mencegah serangan SSRF (Server-Side Request Forgery). Dipisahkan dengan koma, mendukung IP eksak, range CIDR, domain eksak, dan subdomain wildcard (satu level).

```bash
SERVER_REQUEST_WHITELIST=1.2.3.4,10.0.0.0/8,api.example.com,*.trusted.com
```

**Cakupan**: Node "HTTP Request" pada workflow, "Custom Request" pada tombol Action kustom. Path relatif (memanggil API NocoBase sendiri) tidak terpengaruh oleh batasan ini.

**Saat tidak dikonfigurasi**: Semua request `http`/`https` diizinkan (mempertahankan perilaku sebelumnya). **Setelah dikonfigurasi**: Hanya request yang cocok dengan whitelist yang diizinkan, request yang tidak cocok akan menghasilkan error.

Format yang didukung:

| Format | Contoh | Aturan Pencocokan |
| --- | --- | --- |
| IPv4 eksak | `1.2.3.4` | Hanya cocok dengan IP tersebut |
| IPv4 CIDR | `10.0.0.0/8` | Cocok dengan semua IP dalam network tersebut |
| Domain eksak | `api.example.com` | Hanya cocok dengan domain tersebut |
| Subdomain wildcard | `*.example.com` | Cocok dengan subdomain satu level, misalnya `foo.example.com`, tidak cocok dengan `example.com` atau `a.b.example.com` |

## Environment Variable Eksperimental

### APPEND_PRESET_LOCAL_PLUGINS

Digunakan untuk menambahkan plugin preset yang belum diaktifkan, nilainya adalah nama paket plugin (parameter name dari package.json). Beberapa plugin dipisahkan dengan koma.

:::info

1. Pastikan plugin sudah diunduh ke lokal dan dapat ditemukan di direktori `node_modules`. Untuk informasi lebih lanjut lihat [Cara Pengorganisasian Plugin](/plugin-development/project-structure).
2. Setelah menambahkan environment variable, plugin akan tampil di halaman plugin manager setelah instalasi awal `nocobase install` atau upgrade `nocobase upgrade`.
   :::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Digunakan untuk menambahkan plugin built-in yang diinstal secara default, nilainya adalah nama paket plugin (parameter name dari package.json). Beberapa plugin dipisahkan dengan koma.

:::info

1. Pastikan plugin sudah diunduh ke lokal dan dapat ditemukan di direktori `node_modules`. Untuk informasi lebih lanjut lihat [Cara Pengorganisasian Plugin](/plugin-development/project-structure).
2. Setelah menambahkan environment variable, plugin akan diinstal atau di-upgrade secara otomatis saat instalasi awal `nocobase install` atau upgrade `nocobase upgrade`.
   :::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Environment Variable Sementara

Saat menginstal NocoBase, Anda dapat membantu instalasi dengan mengatur environment variable sementara, seperti:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Setara dengan
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Setara dengan
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Bahasa saat instalasi, nilai default `en-US`. Opsi yang tersedia:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

Email user Root

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Password user Root

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Nickname user Root

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```

## Environment Variable yang Disediakan oleh Plugin Lain

### WORKFLOW_SCRIPT_MODULES

Daftar modul yang dapat digunakan oleh node JavaScript pada workflow. Untuk detailnya lihat "[Node JavaScript: Menggunakan Modul Eksternal](/workflow/nodes/javascript#使用外部模块)".

### WORKFLOW_LOOP_LIMIT

Batas maksimum iterasi node loop pada workflow. Untuk detailnya lihat "[Node Loop](/workflow/nodes/loop#WORKFLOW_LOOP_LIMIT)".
