---
pkg: '@nocobase/plugin-logger'
title: "Log Sisi Server NocoBase"
description: "Log sisi server NocoBase: log request, log sistem, log SQL, format console/json/logfmt/delimiter, struktur direktori storage/logs, packaging dan download log."
keywords: "log sisi server,log request,log sistem,log SQL,format log,logfmt,packaging log,NocoBase"
---
# Log

## Pengenalan

Log adalah cara penting yang membantu kita untuk menemukan masalah sistem. Log sisi server NocoBase terutama mencakup log request API dan log running sistem, mendukung konfigurasi level log, rolling strategy, ukuran, format printing, dan lainnya. Dokumen ini terutama memperkenalkan konten terkait log sisi server NocoBase, serta cara menggunakan fitur packaging dan download log sisi server yang disediakan Plugin logger.

## Konfigurasi Log

Anda dapat mengkonfigurasi parameter terkait log seperti level log, output method, format printing, dan lainnya melalui [variabel lingkungan](/get-started/installation/env.md#logger_transport).

## Format Log

NocoBase mendukung konfigurasi 4 format log yang berbeda.

### `console`

Format default untuk lingkungan development; pesan ditampilkan dengan warna highlight.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Format default untuk lingkungan production.

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

Dipisahkan dengan delimiter `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Direktori Log

Struktur direktori utama file log NocoBase adalah:

- `storage/logs` - Direktori output log
  - `main` - Nama main app
    - `request_YYYY-MM-DD.log` - Log request
    - `system_YYYY-MM-DD.log` - Log sistem
    - `system_error_YYYY-MM-DD.log` - Log error sistem
    - `sql_YYYY-MM-DD.log` - Log eksekusi SQL
    - ...
  - `sub-app` - Nama sub-app
    - `request_YYYY-MM-DD.log`
    - ...

## File Log

### Log Request

`request_YYYY-MM-DD.log`, log request dan respons API.

| Field         | Penjelasan                         |
| ------------- | ---------------------------------- |
| `level`       | Level log                          |
| `timestamp`   | Waktu printing log `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` atau `response`          |
| `userId`      | Hanya ada di `response`            |
| `method`      | Metode HTTP request                |
| `path`        | Path request                       |
| `req` / `res` | Konten request/respons             |
| `action`      | Resource dan parameter request     |
| `status`      | Status code respons                |
| `cost`        | Durasi request                     |
| `app`         | Nama aplikasi saat ini             |
| `reqId`       | ID request                         |

:::info{title=Tips}
`reqId` akan dibawa ke frontend melalui response header `X-Request-Id`.
:::

### Log Sistem

`system_YYYY-MM-DD.log`, log running sistem aplikasi, middleware, Plugin, dan lainnya. Log dengan level `error` akan dicetak terpisah ke `system_error_YYYY-MM-DD.log`

| Field       | Penjelasan                         |
| ----------- | ---------------------------------- |
| `level`     | Level log                          |
| `timestamp` | Waktu printing log `YYYY-MM-DD hh:mm:ss` |
| `message`   | Pesan log                          |
| `module`    | Modul                              |
| `submodule` | Sub-modul                          |
| `method`    | Metode yang dipanggil              |
| `meta`      | Informasi terkait lainnya, format JSON |
| `app`       | Nama aplikasi saat ini             |
| `reqId`     | ID request                         |

### Log Eksekusi SQL

`sql_YYYY-MM-DD.log`, log eksekusi SQL database. Statement `INSERT INTO` hanya menyimpan 2000 karakter pertama.

| Field       | Penjelasan                         |
| ----------- | ---------------------------------- |
| `level`     | Level log                          |
| `timestamp` | Waktu printing log `YYYY-MM-DD hh:mm:ss` |
| `sql`       | Statement SQL                      |
| `app`       | Nama aplikasi saat ini             |
| `reqId`     | ID request                         |

## Packaging dan Download Log

<PluginInfo name="logger"></PluginInfo>

1. Masuk ke halaman manajemen log.
2. Pilih file log yang ingin di-download.
3. Klik tombol Download.

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Dokumen Terkait

- [Pengembangan Plugin - Sisi Server - Logger](/plugin-development/server/logger)
- [Referensi API - @nocobase/logger](/api/logger/logger)
