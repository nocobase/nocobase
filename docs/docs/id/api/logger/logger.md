:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Logger

## Membuat Logger

### `createLogger()`

Membuat logger kustom.

#### Tanda Tangan

- `createLogger(options: LoggerOptions)`

#### Tipe

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Detail

| Properti     | Deskripsi              |
| :----------- | :--------------------- |
| `dirname`    | Direktori keluaran log |
| `filename`   | Nama berkas log        |
| `format`     | Format log             |
| `transports` | Metode keluaran log    |

### `createSystemLogger()`

Membuat log runtime sistem yang dicetak dengan metode yang ditentukan. Lihat [Logger - Log Sistem](/log-and-monitor/logger/index.md#system-log)

#### Tanda Tangan

- `createSystemLogger(options: SystemLoggerOptions)`

#### Tipe

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Detail

| Properti        | Deskripsi                                              |
| :-------------- | :----------------------------------------------------- |
| `seperateError` | Apakah akan mengeluarkan log level `error` secara terpisah |

### `requestLogger()`

Middleware untuk pencatatan log permintaan dan respons API.

```ts
app.use(requestLogger(app.name));
```

#### Tanda Tangan

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Tipe

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Detail

| Properti            | Tipe                              | Deskripsi                                                              | Nilai Default                                                                                                                                                 |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Melewatkan pencatatan log untuk permintaan tertentu berdasarkan konteks permintaan. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Daftar putih informasi permintaan yang akan dicetak dalam log.       | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Daftar putih informasi respons yang akan dicetak dalam log.      | `['status']`                                                                                                                                            |

### app.createLogger()

#### Definisi

```ts
class Application {
  createLogger(options: LoggerOptions) {
    const { dirname } = options;
    return createLogger({
      ...options,
      dirname: getLoggerFilePath(this.name || 'main', dirname || ''),
    });
  }
}
```

Ketika `dirname` adalah jalur relatif, berkas log akan dikeluarkan ke direktori dengan nama aplikasi saat ini.

### plugin.createLogger()

Penggunaannya sama dengan `app.createLogger()`.

#### Definisi

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Konfigurasi Log

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Mendapatkan level log yang saat ini dikonfigurasi dalam sistem.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Menggabungkan jalur direktori berdasarkan direktori log yang saat ini dikonfigurasi dalam sistem.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Mendapatkan metode keluaran log yang saat ini dikonfigurasi dalam sistem.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Mendapatkan format log yang saat ini dikonfigurasi dalam sistem.

## Keluaran Log

### Transports

Metode keluaran yang telah ditentukan.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Dokumentasi Terkait

- [Panduan Pengembangan - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/)