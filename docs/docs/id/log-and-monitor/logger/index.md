---
pkg: "@nocobase/plugin-logger"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



pkg: '@nocobase/plugin-logger'
---

# Log

## Pendahuluan

Log merupakan sarana penting untuk membantu kita mengidentifikasi masalah sistem. Log server NocoBase terutama mencakup log permintaan antarmuka dan log operasi sistem, yang mendukung konfigurasi tingkat log, strategi rolling, ukuran, format pencetakan, dan lainnya. Dokumen ini terutama memperkenalkan konten terkait log server NocoBase, serta cara menggunakan fitur pengemasan dan pengunduhan log server yang disediakan oleh plugin log.

## Konfigurasi Log

Parameter terkait log seperti tingkat log, metode output, dan format pencetakan dapat dikonfigurasi melalui [variabel lingkungan](/get-started/installation/env.md#logger_transport).

## Format Log

NocoBase mendukung konfigurasi empat format log yang berbeda.

### `console`

Format default di lingkungan pengembangan, pesan ditampilkan dengan warna sorotan.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Format default di lingkungan produksi.

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

Dipisahkan oleh pembatas `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Direktori Log

Struktur direktori utama file log NocoBase adalah:

- `storage/logs` - Direktori output log
  - `main` - Nama aplikasi utama
    - `request_YYYY-MM-DD.log` - Log permintaan
    - `system_YYYY-MM-DD.log` - Log sistem
    - `system_error_YYYY-MM-DD.log` - Log kesalahan sistem
    - `sql_YYYY-MM-DD.log` - Log eksekusi SQL
    - ...
  - `sub-app` - Nama sub-aplikasi
    - `request_YYYY-MM-DD.log`
    - ...

## File Log

### Log Permintaan

`request_YYYY-MM-DD.log`, log permintaan dan respons antarmuka.

| Kolom         | Deskripsi                                  |
| ------------- | ------------------------------------------ |
| `level`       | Tingkat log                                |
| `timestamp`   | Waktu pencetakan log `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` atau `response`                  |
| `userId`      | Hanya ada di `response`                    |
| `method`      | Metode permintaan                          |
| `path`        | Jalur permintaan                           |
| `req` / `res` | Konten permintaan/respons                  |
| `action`      | Sumber daya dan parameter yang diminta     |
| `status`      | Kode status respons                        |
| `cost`        | Durasi permintaan                          |
| `app`         | Nama aplikasi saat ini                     |
| `reqId`       | ID Permintaan                              |

:::info{title=Catatan}
`reqId` akan dibawa ke frontend melalui header respons `X-Request-Id`.
:::

### Log Sistem

`system_YYYY-MM-DD.log`, log operasi sistem aplikasi, middleware, plugin, dan lainnya. Log tingkat `error` akan dicetak secara terpisah ke `system_error_YYYY-MM-DD.log`.

| Kolom       | Deskripsi                                  |
| ----------- | ------------------------------------------ |
| `level`     | Tingkat log                                |
| `timestamp` | Waktu pencetakan log `YYYY-MM-DD hh:mm:ss` |
| `message`   | Pesan log                                  |
| `module`    | Modul                                      |
| `submodule` | Submodul                                   |
| `method`    | Metode yang dipanggil                      |
| `meta`      | Informasi terkait lainnya, format JSON     |
| `app`       | Nama aplikasi saat ini                     |
| `reqId`     | ID Permintaan                              |

### Log Eksekusi SQL

`sql_YYYY-MM-DD.log`, log eksekusi SQL database. Pernyataan `INSERT INTO` hanya mempertahankan 2000 karakter pertama.

| Kolom       | Deskripsi                                  |
| ----------- | ------------------------------------------ |
| `level`     | Tingkat log                                |
| `timestamp` | Waktu pencetakan log `YYYY-MM-DD hh:mm:ss` |
| `sql`       | Pernyataan SQL                             |
| `app`       | Nama aplikasi saat ini                     |
| `reqId`     | ID Permintaan                              |

## Pengemasan dan Pengunduhan Log

1. Masuk ke halaman manajemen log.
2. Pilih file log yang ingin Anda unduh.
3. Klik tombol Unduh (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Dokumen Terkait

- [Pengembangan Plugin - Server - Log](/plugin-development/server/logger)
- [Referensi API - @nocobase/logger](/api/logger/logger)