---
title: "Logger"
description: "API logging NocoBase: Logger untuk membuat log, level log, konfigurasi output."
keywords: "Logger,API log,level log,output log,NocoBase"
---

# Logger

## Membuat Log

### `createLogger()`

Membuat log kustom.

#### Signature

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

| Properti | Deskripsi |
| ------------ | ------------ |
| `dirname` | Direktori output log |
| `filename` | Nama file log |
| `format` | Format log |
| `transports` | Metode output log |

### `createSystemLogger()`

Membuat log runtime sistem yang dicetak dengan cara yang ditentukan. Lihat [Log - Log Sistem](#)

#### Signature

- `createSystemLogger(options: SystemLoggerOptions)`

#### Tipe

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Detail

| Properti | Deskripsi |
| --------------- | ------------------------------- |
| `seperateError` | Apakah log level `error` ditampilkan terpisah |

### `requestLogger()`

Middleware log request dan response API.

```ts
app.use(requestLogger(app.name));
```

#### Signature

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

| Properti | Tipe | Deskripsi | Default |
| ------------------- | --------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skip` | `(ctx?: any) => Promise<boolean>` | Melewati log permintaan tertentu berdasarkan konteks request | - |
| `requestWhitelist` | `string[]` | Whitelist informasi request yang dicetak ke log | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]` | Whitelist informasi response yang dicetak ke log | `['status']` |

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

Saat `dirname` adalah relative path, output file log akan masuk ke direktori dengan nama aplikasi saat ini.

### plugin.createLogger()

Penggunaan sama dengan `app.createLogger()`

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

Mendapatkan level log yang dikonfigurasi sistem saat ini.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Berdasarkan direktori log yang dikonfigurasi sistem saat ini, menggabungkan path direktori.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Mendapatkan metode output log yang dikonfigurasi sistem saat ini.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Mendapatkan format log yang dikonfigurasi sistem saat ini.

## Output Log

### Transports

Metode output yang sudah disediakan.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Dokumen Terkait

- [Panduan Pengembangan - Log](/plugin-development/server/logger)
- [Log](/log-and-monitor/logger/index.md)
