:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Logger

Pencatatan NocoBase dibangun berdasarkan <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Secara default, NocoBase membagi log menjadi log permintaan API, log waktu proses sistem, dan log eksekusi SQL. Log permintaan API dan log eksekusi SQL dicetak secara internal oleh aplikasi, sementara pengembang plugin biasanya hanya perlu mencetak log waktu proses sistem yang terkait dengan plugin.

Dokumen ini menjelaskan cara membuat dan mencetak log saat mengembangkan plugin.

## Metode Pencetakan Default

NocoBase menyediakan metode pencetakan log waktu proses sistem. Log dicetak sesuai dengan bidang yang ditentukan dan dikeluarkan ke berkas yang juga ditentukan.

```ts
// Metode pencetakan default
app.log.info("message");

// Digunakan dalam middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Digunakan dalam plugin
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Semua metode di atas mengikuti penggunaan berikut:

Parameter pertama adalah pesan log, dan parameter kedua adalah objek metadata opsional, yang dapat berupa pasangan kunci-nilai apa pun. Di dalamnya, `module`, `submodule`, dan `method` akan diekstrak sebagai bidang terpisah, dan bidang lainnya akan ditempatkan dalam bidang `meta`.

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

## Keluaran ke Berkas Lain

Jika Anda ingin menggunakan metode pencetakan default sistem tetapi tidak ingin mengeluarkannya ke berkas default, Anda dapat membuat instans logger sistem kustom menggunakan `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Apakah log level error akan dikeluarkan secara terpisah ke 'xxx_error.log'
});
```

## Logger Kustom

Jika Anda tidak ingin menggunakan metode pencetakan yang disediakan sistem dan ingin menggunakan metode asli Winston, Anda dapat membuat log menggunakan metode berikut.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` memperluas `winston.LoggerOptions` yang asli.

-   `transports` - Gunakan `'console' | 'file' | 'dailyRotateFile'` untuk menerapkan metode keluaran yang telah ditentukan sebelumnya.
-   `format` - Gunakan `'logfmt' | 'json' | 'delimiter'` untuk menerapkan format pencetakan yang telah ditentukan sebelumnya.

### `app.createLogger`

Dalam skenario multi-aplikasi, terkadang kita ingin direktori dan berkas keluaran kustom, yang dapat dikeluarkan ke direktori dengan nama aplikasi saat ini.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Keluaran ke /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Kasus penggunaan dan metodenya sama dengan `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Keluaran ke /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```