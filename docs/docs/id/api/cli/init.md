---
title: 'nb init'
description: 'Referensi perintah nb init: instalasi baru, mengambil alih aplikasi lokal yang sudah ada, atau terhubung ke aplikasi jarak jauh dan menyimpannya sebagai CLI env.'
keywords: 'nb init,NocoBase CLI,inisialisasi,env,Docker,npm,Git,koneksi jarak jauh'
---

# nb init

Menginisialisasi workspace saat ini agar coding agent dapat terhubung ke dan menggunakan NocoBase.

`nb init` dapat memasang aplikasi NocoBase lokal yang baru, atau menyimpan informasi koneksi dari aplikasi yang sudah ada.

Selain itu, `nb init` juga akan menyinkronkan NocoBase AI coding skills secara default. Anda hanya perlu menambahkan `--skip-skills` jika Anda sudah mengelola skills sendiri, atau saat menjalankannya di CI maupun lingkungan offline.

## Penggunaan

```bash
nb init [flags]
```

## Mode interaktif

`nb init` mendukung tiga mode interaktif:

- `nb init`：menyelesaikan panduan langkah demi langkah di terminal
- `nb init --ui`：membuka formulir browser lokal dan menyelesaikan setup dengan wizard visual
- `nb init --yes --env app1`：melewati prompt dan langsung memakai flags; parameter yang tidak diberikan secara eksplisit akan diproses dengan nilai default

Mode `--yes` cocok untuk skrip, CI/CD, atau skenario non-interaktif lainnya. Dalam mode ini, `--env <envName>` wajib diisi. Secara umum, mode ini akan memasang aplikasi lokal baru secara default; jika Anda tidak menentukan `--source`, maka `docker` akan digunakan sebagai sumber instalasi default.

## Melanjutkan inisialisasi yang terputus

Untuk alur instalasi, env config akan disimpan terlebih dahulu, lalu proses unduhan, database, dan instalasi aplikasi dijalankan. Jika gagal di tengah jalan, Anda bisa melanjutkannya:

```bash
nb init --env app1 --resume
```

`--resume` hanya berlaku untuk alur inisialisasi yang env config-nya sudah pernah disimpan, dan `--env` harus diberikan secara eksplisit.

## Siapkan env terlebih dahulu, lalu instal app nanti

`--prepare-only` ditujukan untuk alur yang perlu menyiapkan env terlebih dahulu, lalu mengaktifkan lisensi, dan baru setelah itu menginstal serta menjalankan app.

Jika Anda ingin lebih dulu menyimpan konfigurasi env dan menyiapkan database, tetapi menunda download dependensi, instalasi app, dan startup pertama, Anda dapat menggunakan:

```bash
nb init --env app1 --prepare-only
nb init --env app1 --prepare-only --ui
nb init --env app1 --prepare-only --yes
```

Mode ini tersedia untuk alur instalasi lokal, termasuk wizard `--ui`. Mode ini tidak tersedia untuk alur koneksi remote. CLI akan menyimpan env saat ini dalam status prepared, sehingga nanti Anda dapat melanjutkan dengan alur seperti berikut:

```bash
nb license activate --env app1
nb app start --env app1
```

Setelah itu, `nb app start` akan menyelesaikan instalasi pertama dan mengubah env dari status prepared ke status normal installed.

## Penjelasan direktori instalasi

Anda dapat melihat path lengkap dengan `nb env info app1 --field app.appPath`.

Secara default, CLI akan mengatur file lokal di bawah `app-path` mengikuti konvensi berikut:

```text
<app-path>/
├── .nb/      # Metadata CLI untuk env ini, seperti hooks.mjs
├── source/   # Direktori default untuk source code aplikasi atau hasil unduhan
├── storage/  # Direktori data runtime
└── .env      # File variabel lingkungan aplikasi opsional
```

Secara umum:

- `.nb/` menyimpan metadata yang dikelola CLI. Script yang diteruskan dengan `--hook-script` akan disalin ke `<app-path>/.nb/hooks.mjs`, sehingga `nb app upgrade` dan restore source lokal berikutnya dapat menggunakannya kembali
- `source/` terutama mengacu pada direktori aplikasi lokal untuk env npm / Git. Untuk Docker env, CLI juga mempertahankan turunan path default ini, tetapi biasanya Anda tidak perlu memperhatikannya secara manual. Perhatikan saat upgrade: direktori `source/` akan dihapus lalu diunduh ulang, jadi jangan simpan file yang perlu dipertahankan di sini
- `storage/` digunakan untuk menyimpan data runtime, seperti data database bawaan, plugin, log, dan sebagainya
- `.env` adalah file variabel lingkungan aplikasi yang opsional. Anda hanya perlu menambahkannya ke `<app-path>/.env` saat ingin menyesuaikan variabel lingkungan; jika file ini ada, sumber instalasi Docker, npm, dan Git akan membacanya secara default

Ini menunjukkan konvensi direktori default milik CLI. Untuk sumber instalasi, plugin, dan tahap runtime yang berbeda, isi direktori yang benar-benar dihasilkan mungkin tidak sepenuhnya sama.

## Catatan

:::warning Perhatian

- `--ui` tidak dapat digunakan bersama `--yes`
- `--ui` juga tidak dapat digunakan bersama `--resume`
- `--ui-host` dan `--ui-port` hanya dapat digunakan bersama `--ui`
- `--skip-auth` tidak dapat digunakan bersama `--access-token` atau `--token`

:::

## Navigasi cepat berdasarkan Steps

Steps yang terlihat akan berbeda tergantung jalur setup. Misalnya, saat menghubungkan aplikasi yang sudah ada, biasanya hanya `Getting started` dan `Remote connection` yang digunakan.

Jika Anda mengikuti wizard UI lokal langkah demi langkah, Anda bisa memakai tabel berikut untuk navigasi cepat:

| Step                      | Parameter utama yang perlu diperhatikan                                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Getting started`         | `--env`、`--yes`、`--ui`、`--locale`、`--verbose`、`--skip-skills`、`--resume`、`--prepare-only`                                                                                                                 |
| `App environment`         | `--lang`、`--app-path`、`--app-port`、`--force`                                                                                                                                                                   |
| `App source and version`  | `--source`、`--version`、`--skip-download`、`--git-url`、`--docker-registry`、`--docker-platform`、`--npm-registry`、`--replace`、`--dev-dependencies`、`--output-dir`、`--docker-save`、`--build`、`--build-dts`、`--hook-script` |
| `Configure the database`  | `--builtin-db`、`--db-dialect`、`--builtin-db-image`、`--db-host`、`--db-port`、`--db-database`、`--db-user`、`--db-password`、`--db-schema`、`--db-table-prefix`、`--db-underscored`                             |
| `Create an admin account` | `--root-username`、`--root-email`、`--root-password`、`--root-nickname`                                                                                                                                           |
| `Remote connection`       | `--api-base-url`、`--auth-type`、`--access-token`、`--username`、`--password`、`--skip-auth`                                                                                                                      |

## Parameter

Parameternya cukup banyak, jadi akan lebih jelas jika dilihat berdasarkan skenario penggunaan.

“Nilai default” di bawah ini berarti nilai atau perilaku yang biasanya digunakan `nb init` ketika parameter tersebut diabaikan.

### Dasar dan interaktif

| Parameter       | Tipe    | Nilai default                                                                      | Keterangan                                                                                                               |
| --------------- | ------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--yes`, `-y`   | boolean | `false`                                                                            | Lewati prompt, gunakan flags dan nilai default                                                                           |
| `--env`, `-e`   | string  | Tidak ada                                                                          | Nama env yang disimpan untuk inisialisasi ini; wajib di mode `--yes` dan `--resume`                                      |
| `--ui`          | boolean | `false`                                                                            | Membuka wizard browser lokal; tidak dapat digunakan bersama `--yes` dan `--resume`                                       |
| `--verbose`     | boolean | `false`                                                                            | Tampilkan output perintah yang detail                                                                                    |
| `--skip-skills` | boolean | `false`                                                                            | Lewati sinkronisasi NocoBase AI coding skills                                                                            |
| `--ui-host`     | string  | `127.0.0.1`                                                                        | Alamat bind layanan lokal `--ui`                                                                                         |
| `--ui-port`     | integer | `0`                                                                                | Port layanan lokal `--ui`; `0` berarti dialokasikan otomatis                                                             |
| `--locale`      | string  | Mengikuti `NB_LOCALE`, konfigurasi CLI, atau locale sistem; fallback akhir `en-US` | Bahasa prompt CLI dan UI setup lokal: `en-US` atau `zh-CN`                                                               |
| `--resume`      | boolean | `false`                                                                            | Melanjutkan inisialisasi sebelumnya yang belum selesai dengan menggunakan ulang workspace env config yang sudah disimpan |
| `--prepare-only` | boolean | `false`                                                                           | Simpan dan siapkan env instalasi lokal, termasuk alur `--ui`, tanpa menginstal atau menjalankan app terlebih dahulu |

### Menghubungkan aplikasi yang sudah ada

| Parameter              | Tipe    | Nilai default | Keterangan                                                                                                                                          |
| ---------------------- | ------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u` | string  | Tidak ada     | Alamat root API, wajib menyertakan prefix `/api`                                                                                                    |
| `--auth-type`, `-a`    | string  | `oauth`       | Metode autentikasi: `basic`、`token` atau `oauth`. Umumnya cukup gunakan `oauth` default; pada beberapa skenario CI/CD, `basic` juga bisa digunakan |
| `--access-token`, `-t` | string  | Tidak ada     | API key atau access token untuk autentikasi `token`                                                                                                 |
| `--username`           | string  | Tidak ada     | Username untuk autentikasi `basic`                                                                                                                  |
| `--password`           | string  | Tidak ada     | Password untuk autentikasi `basic`                                                                                                                  |
| `--skip-auth`          | boolean | `false`       | Simpan env dan metode autentikasi terlebih dahulu, lalu selesaikan login nanti lewat `nb env auth`                                                  |

### Parameter dasar instalasi lokal

| Parameter         | Tipe    | Nilai default                        | Keterangan                                                                                       |
| ----------------- | ------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `--lang`, `-l`    | string  | `en-US`                              | Bahasa antarmuka aplikasi baru yang diinstal                                                     |
| `--force`, `-f`   | boolean | `false`                              | Konfigurasikan ulang env yang sudah ada, dan ganti resource runtime yang konflik bila diperlukan |
| `--app-path`      | string  | `./<envName>/`                       | Direktori aplikasi lokal npm/Git                                                                 |
| `--app-port`      | string  | `13000`                              | Port HTTP aplikasi lokal; mode `--yes` akan otomatis memilih port yang tersedia                  |
| `--root-username` | string  | `nocobase`（mode `--yes`）           | Username administrator awal                                                                      |
| `--root-email`    | string  | `admin@nocobase.com`（mode `--yes`） | Email administrator awal                                                                         |
| `--root-password` | string  | `admin123`（mode `--yes`）           | Password administrator awal                                                                      |
| `--root-nickname` | string  | `Super Admin`（mode `--yes`）        | Nama tampilan administrator awal                                                                 |

### Parameter database

| Parameter                                  | Tipe    | Nilai default                                                          | Keterangan                                                         |
| ------------------------------------------ | ------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `--builtin-db` / `--no-builtin-db`         | boolean | `true`                                                                 | Apakah membuat dan menghubungkan database bawaan yang dikelola CLI |
| `--db-dialect`                             | string  | `postgres`                                                             | Tipe database: `postgres`、`mysql`、`mariadb`、`kingbase`          |
| `--builtin-db-image`                       | string  | Mengikuti `--db-dialect` dan locale                                    | Image container database bawaan                                    |
| `--db-host`                                | string  | `postgres` untuk database bawaan; `127.0.0.1` untuk database eksternal | Alamat host database                                               |
| `--db-port`                                | string  | `postgres=5432`、`mysql=3306`、`mariadb=3306`、`kingbase=54321`        | Port database                                                      |
| `--db-database`                            | string  | `nocobase`; untuk KingbaseES adalah `kingbase`                         | Nama database                                                      |
| `--db-user`                                | string  | `nocobase`                                                             | Username database                                                  |
| `--db-password`                            | string  | `nocobase`                                                             | Password database                                                  |
| `--db-schema`                              | string  | Tidak ada                                                              | Schema database; hanya digunakan oleh PostgreSQL                   |
| `--db-table-prefix`                        | string  | Tidak ada                                                              | Prefix tabel database                                              |
| `--db-underscored` / `--no-db-underscored` | boolean | `false`                                                                | Apakah nama tabel dan field database menggunakan gaya underscore   |

### Parameter unduhan dan source code

| Parameter                                            | Tipe    | Nilai default                                                                                            | Keterangan                                                                                   |
| ---------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--skip-download`                                    | boolean | `false`                                                                                                  | Lewati unduhan dan gunakan direktori aplikasi lokal atau image Docker yang sudah ada         |
| `--source`, `-s`                                     | string  | `docker`                                                                                                 | Cara mendapatkan NocoBase: `docker`、`npm` atau `git`                                        |
| `--version`, `-v`                                    | string  | `beta`                                                                                                   | Parameter versi: versi paket npm, tag image Docker, atau Git ref                             |
| `--replace`, `-r`                                    | boolean | `false`                                                                                                  | Ganti jika direktori target sudah ada                                                        |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | `false`                                                                                                  | Apakah memasang devDependencies saat instalasi npm/Git                                       |
| `--output-dir`, `-o`                                 | string  | Untuk npm/Git diturunkan dari `--app-path`; untuk Docker + `--docker-save` adalah `./nocobase-<version>` | Direktori target unduhan, atau direktori penyimpanan tarball saat `--docker-save` diaktifkan |
| `--git-url`                                          | string  | `https://github.com/nocobase/nocobase.git`                                                               | Alamat repositori Git                                                                        |
| `--docker-registry`                                  | string  | `nocobase/nocobase`; di locale `zh-CN` menjadi `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase`     | Nama registry image Docker, tanpa tag                                                        |
| `--docker-platform`                                  | string  | `auto`                                                                                                   | Platform image Docker: `auto`、`linux/amd64`、`linux/arm64`                                  |
| `--docker-save` / `--no-docker-save`                 | boolean | `false`                                                                                                  | Apakah image Docker juga disimpan sebagai tarball setelah di-pull                            |
| `--npm-registry`                                     | string  | Kosong                                                                                                   | Registry yang dipakai untuk unduhan npm/Git dan instalasi dependensi                         |
| `--build` / `--no-build`                             | boolean | `true`                                                                                                   | Apakah melakukan build setelah dependensi npm/Git diinstal                                   |
| `--build-dts`                                        | boolean | `false`                                                                                                  | Apakah menghasilkan file deklarasi TypeScript saat build npm/Git                             |
| `--hook-script`                                      | string  | Tidak ada                                                                                                | Menyalin modul hook yang ditentukan ke `<app-path>/.nb/hooks.mjs` dan menyimpannya di env config; mendukung lifecycle hook `beforeDependencyInstall`, `beforeAppInstall`, dan `afterAppStart` |

## Contoh

Berikut beberapa penggunaan yang paling umum.

### Menyelesaikan panduan langkah demi langkah di terminal

```bash
nb init
```

### Membuka wizard browser lokal

```bash
nb init --ui
nb init --ui --ui-port 3000
```

### Siapkan dulu, lalu aktifkan lisensi dan jalankan nanti

```bash
nb init --env app1 --prepare-only
nb license activate --env app1
nb app start --env app1
```

### Instalasi non-interaktif untuk aplikasi lokal baru

Jika Anda tidak menentukan `--source`, biasanya Docker akan dipakai sebagai sumber instalasi.

```bash
nb init --env app1 --yes
nb init --env app1 --yes --source docker --version latest
nb init --env app1 --yes --source docker --version beta
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
nb init --env app1 --yes --source npm --version latest
nb init --env app1 --yes --source npm --version beta
nb init --env app1 --yes --source npm --version alpha
nb init --env app1 --yes --source npm --version beta --app-port 13080
nb init --env app1 --yes --source git --version latest
nb init --env app1 --yes --source git --version beta
nb init --env app1 --yes --source git --version alpha
nb init --env app1 --yes --source git --version feat/plugin-workflow-timeout
nb init --env app1 --yes --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

### Memperluas alur instalasi dengan script hook

Jika Anda perlu menyiapkan konten tambahan selama instalasi, teruskan modul ESM lokal dengan `--hook-script`:

```bash
nb init --env app1 --yes --source git --hook-script ./hooks.mjs
```

CLI menyalin file ini ke `<app-path>/.nb/hooks.mjs` dan menyimpan `hookScript: ".nb/hooks.mjs"` di env config. `nb app start`, `nb app restart`, dan `nb app upgrade` berikutnya akan menggunakannya kembali dari lokasi tersebut.

File hook harus melakukan default export sebuah objek. Implementasikan hanya metode yang Anda butuhkan:

```js
export default {
  beforeDependencyInstall: async (context) => {
    // Runs after git clone / npm scaffold and before yarn install.
  },
  beforeAppInstall: async (context) => {
    // Runs before the app-level install or upgrade command.
  },
  afterAppStart: async (context) => {
    // Runs after the app actually starts and passes the health check.
  },
};
```

- `beforeDependencyInstall` hanya berlaku untuk source npm/Git dan berjalan tepat sebelum `yarn install` yang sebenarnya; Docker source tidak menjalankannya
- `beforeAppInstall` berjalan sebelum perintah install atau upgrade level app, dan berlaku untuk source npm/Git/Docker
- `afterAppStart` berjalan setelah app benar-benar start dan lolos `__health_check`; `nb app start`, `nb app restart`, dan `nb app upgrade` dapat memicunya

`--prepare-only` hanya menyimpan env config dan menyalin file hook. Hook tidak dijalankan. Saat Anda kemudian menjalankan `nb app start` untuk pertama kali, CLI menjalankan hook instalasi pertama dengan `context.phase` bernilai `init` dan `context.command` bernilai `app:start`.

`context` berisi informasi lifecycle seperti `phase`, `command`, `source`, `version`, `appPath`, `sourcePath`, `storagePath`, `hookScript`, dan `envConfig`. Jika hook melempar error, perintah CLI saat ini akan gagal. Karena `afterAppStart` dapat berjalan berulang saat start, restart, dan upgrade, buat logikanya idempotent.

### Instal cepat dan langsung memakai autentikasi basic

Jika Anda ingin memasang aplikasi lokal dengan cepat dalam mode non-interaktif, lalu langsung menyimpan autentikasi `basic` setelah instalasi selesai, Anda bisa menuliskannya seperti ini. Dengan begitu, Anda tidak perlu lagi membuka browser untuk menyelesaikan OAuth.

Jika memakai akun administrator default pada mode `--yes`, bentuk terpendeknya seperti ini.

Jika tidak ditentukan, akun administrator default adalah `nocobase`, dan password default adalah `admin123`:

```bash
nb init --env app1 --yes --auth-type basic
```

Jika Anda juga ingin menyesuaikan akun administrator, Anda bisa menuliskannya seperti ini:

```bash
nb init --env app1 --yes \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

### Menghubungkan aplikasi yang sudah ada

Secara default cukup gunakan OAuth. Jika pada beberapa skenario CI/CD Anda tidak praktis membuka browser, Anda juga bisa langsung menyimpan autentikasi `basic`; jika Anda sudah memiliki API token, Anda juga bisa langsung menyimpan autentikasi `token`.

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type token \
  --access-token <token>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type oauth \
  --skip-auth
```

### Menyesuaikan penamaan database

Jika Anda perlu menentukan schema PostgreSQL, prefix tabel, atau penamaan dengan underscore, Anda bisa memberikan parameter seperti ini:

```bash
nb init --env app1 --yes \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

### Melanjutkan inisialisasi sebelumnya yang terputus

```bash
nb init --env app1 --resume
```

### Menampilkan log detail saat troubleshooting

```bash
nb init --env app1 --yes --source docker --version latest --verbose
```

## Perintah terkait

- [`nb env add`](./env/add.md)
- [`nb env auth`](./env/auth.md)
- [`nb source download`](./source/download.md)
