---
title: "Logger Log (Client)"
description: "Log client NocoBase: app.logger, level log, debug front-end, output console browser."
keywords: "Logger,log,app.logger,log client,debug front-end,NocoBase"
---

# Logger Log

NocoBase menyediakan sistem log berkinerja tinggi yang berbasis pada [pino](https://github.com/pinojs/pino). Di tempat mana pun yang memiliki `context`, dapat mengakses instance log melalui `ctx.logger`, untuk mencatat log kunci runtime plugin atau sistem.

## Penggunaan Dasar

```ts
// Mencatat error fatal (misalnya: inisialisasi gagal)
ctx.logger.fatal('Inisialisasi aplikasi gagal', { error });

// Mencatat error umum (misalnya: error request API)
ctx.logger.error('Loading data gagal', { status, message });

// Mencatat informasi peringatan (misalnya: risiko performa atau anomali operasi pengguna)
ctx.logger.warn('Form saat ini berisi perubahan yang belum disimpan');

// Mencatat informasi runtime umum (misalnya: Component selesai dimuat)
ctx.logger.info('Component profil pengguna selesai dimuat');

// Mencatat informasi debug (misalnya: perubahan status)
ctx.logger.debug('Status pengguna saat ini', { user });

// Mencatat informasi tracing detail (misalnya: alur rendering)
ctx.logger.trace('Component selesai dirender', { component: 'UserProfile' });
```

Method-method ini sesuai dengan level log yang berbeda (dari tinggi ke rendah):

| Level | Method | Penjelasan |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Error fatal, biasanya menyebabkan program keluar |
| `error` | `ctx.logger.error()` | Log error, menunjukkan request atau operasi gagal |
| `warn` | `ctx.logger.warn()` | Informasi peringatan, menunjukkan risiko potensial atau situasi tidak terduga |
| `info` | `ctx.logger.info()` | Informasi runtime reguler |
| `debug` | `ctx.logger.debug()` | Informasi debug, untuk environment development |
| `trace` | `ctx.logger.trace()` | Informasi tracing detail, biasanya untuk diagnosis mendalam |

## Format Log

Setiap output log adalah format JSON terstruktur, secara default berisi field berikut:

| Field | Tipe | Penjelasan |
|------|------|------|
| `level` | number | Level log |
| `time` | number | Timestamp (milidetik) |
| `pid` | number | Process ID |
| `hostname` | string | Hostname |
| `msg` | string | Pesan log |
| Lainnya | object | Informasi konteks kustom |

Contoh output:

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## Binding Konteks

`ctx.logger` akan otomatis menyuntikkan informasi konteks, seperti plugin, modul, atau sumber request saat ini, sehingga log dapat melacak sumber dengan lebih akurat.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Contoh output (dengan konteks):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Log Kustom

Anda dapat membuat instance logger kustom di plugin, mewarisi atau memperluas konfigurasi default:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Sub logger akan mewarisi konfigurasi logger utama dan otomatis menambahkan konteks.

## Pembagian Level Log

Level log Pino mengikuti definisi numerik dari tinggi ke rendah, semakin kecil nilai numerik semakin rendah prioritasnya.  
Berikut adalah tabel pembagian level log lengkap:

| Nama Level | Nilai | Nama Method | Penjelasan |
|-----------|--------|----------|------|
| `fatal` | 60 | `logger.fatal()` | Error fatal, biasanya menyebabkan program tidak dapat berjalan terus |
| `error` | 50 | `logger.error()` | Error umum, menunjukkan request gagal atau anomali operasi |
| `warn` | 40 | `logger.warn()` | Informasi peringatan, menunjukkan risiko potensial atau situasi tidak terduga |
| `info` | 30 | `logger.info()` | Informasi biasa, mencatat status sistem atau operasi normal |
| `debug` | 20 | `logger.debug()` | Informasi debug, untuk analisis masalah pada tahap development |
| `trace` | 10 | `logger.trace()` | Informasi tracing detail, untuk diagnosis mendalam |
| `silent` | -Infinity | (tanpa method yang sesuai) | Mematikan semua output log |

Pino hanya akan output log yang lebih besar atau sama dengan konfigurasi `level` saat ini. Contoh, ketika level log adalah `info`, log `debug` dan `trace` akan diabaikan.

## Best Practice dalam Pengembangan Plugin

1. **Menggunakan Log Konteks**  
   Gunakan `ctx.logger` di plugin, model, atau konteks aplikasi, dapat otomatis membawa informasi sumber.

2. **Membedakan Level Log**  
   - Gunakan `error` untuk mencatat anomali bisnis  
   - Gunakan `info` untuk mencatat perubahan status  
   - Gunakan `debug` untuk mencatat informasi debug development  

3. **Hindari Log Berlebihan**  
   Terutama pada level `debug` dan `trace`, disarankan hanya diaktifkan di environment development.

4. **Menggunakan Data Terstruktur**  
   Memasukkan parameter objek daripada menggabungkan string, membantu analisis dan filter log.

Melalui cara di atas, developer dapat lebih efisien melacak proses eksekusi plugin, menyelesaikan masalah, dan menjaga sistem log tetap terstruktur dan dapat diperluas.
