---
title: "Logger Log (Server)"
description: "Log server NocoBase: app.logger, level log, membuat sub logger, konfigurasi output log."
keywords: "Logger,log,app.logger,level log,log server,NocoBase"
---

# Logger Log

Log NocoBase berbasis pada <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Secara default, NocoBase membagi log menjadi log request API, log runtime sistem, dan log eksekusi SQL. Di antaranya, log request API dan log eksekusi SQL dicetak secara internal oleh aplikasi, developer plugin biasanya hanya perlu memperhatikan log runtime sistem yang terkait dengan plugin.

Berikut diperkenalkan cara membuat dan mencetak log saat mengembangkan plugin.

## Method Cetak Default

NocoBase menyediakan method cetak log runtime sistem, log dicetak sesuai field yang ditentukan, sekaligus output ke file yang ditentukan.

```ts
// Method cetak default
app.log.info("message");

// Penggunaan di middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Penggunaan di plugin
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Method-method di atas semuanya mengikuti penggunaan berikut:

Parameter pertama adalah pesan log, parameter kedua adalah objek metadata opsional, dapat berupa pasangan key-value apa pun. Di antaranya, `module`, `submodule`, `method` akan diekstrak menjadi field terpisah, field lainnya ditempatkan di field `meta`.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## Output ke File Lain

Jika ingin tetap menggunakan method cetak default sistem, tetapi tidak ingin output ke file default, dapat menggunakan `createSystemLogger` untuk membuat instance log sistem kustom.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Apakah output log level error ke xxx_error.log secara terpisah
});
```

## Log Kustom

Jika tidak ingin menggunakan method cetak yang disediakan sistem, dan ingin langsung menggunakan cara native Winston, dapat membuat log melalui method berikut.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` diperluas berdasarkan `winston.LoggerOptions` asli.

- `transports` - Dapat menggunakan `'console' | 'file' | 'dailyRotateFile'` untuk menerapkan cara output yang sudah preset.
- `format` - Dapat menggunakan `'logfmt' | 'json' | 'delimiter'` untuk menerapkan format cetak yang sudah preset.

### `app.createLogger`

Dalam skenario multi-aplikasi, jika Anda ingin output log kustom ke direktori dengan nama aplikasi saat ini, dapat menggunakan method ini.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Output ke /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Skenario penggunaan dan cara penggunaan sama dengan `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Output ke /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```

## Tautan Terkait

- [Context Konteks Request](./context.md) — Mencetak log melalui `ctx.logger` di middleware dan Action
- [Plugin](./plugin.md) — Menggunakan log melalui `this.log` dan `plugin.createLogger` di plugin
- [Telemetry Telemetri](./telemetry.md) — Log dikombinasikan dengan telemetri untuk implementasi observability
- [Middleware](./middleware.md) — Skenario tipikal pencatatan log request di middleware
- [Ikhtisar Pengembangan Server](./index.md) — Posisi sistem log dalam arsitektur server
