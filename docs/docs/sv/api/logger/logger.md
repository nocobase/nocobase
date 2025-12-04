:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Logger

## Skapa Logger

### `createLogger()`

Skapar en anpassad logger.

#### Signatur

- `createLogger(options: LoggerOptions)`

#### Typ

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Detaljer

| Egenskap     | Beskrivning         |
| :----------- | :------------------ |
| `dirname`    | Loggens utdatakatalog |
| `filename`   | Loggfilens namn     |
| `format`     | Loggformat          |
| `transports` | Metod för loggutdata |

### `createSystemLogger()`

Skapar systemets körningsloggar som skrivs ut på ett specificerat sätt. Se [Logger - Systemlogg](/log-and-monitor/logger/index.md#system-log)

#### Signatur

- `createSystemLogger(options: SystemLoggerOptions)`

#### Typ

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Detaljer

| Egenskap        | Beskrivning                                     |
| :-------------- | :---------------------------------------------- |
| `seperateError` | Om `error`-nivåloggar ska skrivas ut separat |

### `requestLogger()`

Middleware för loggning av API-förfrågningar och svar.

```ts
app.use(requestLogger(app.name));
```

#### Signatur

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Typ

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Detaljer

| Egenskap            | Typ                              | Beskrivning                                                      | Standardvärde                                                                                                                                                 |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Hoppar över loggning för vissa förfrågningar baserat på förfrågans kontext. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Vitlista över förfrågningsinformation som ska skrivas ut i loggen.       | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Vitlista över svarsinformation som ska skrivas ut i loggen.      | `['status']`                                                                                                                                            |

### app.createLogger()

#### Definition

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

När `dirname` är en relativ sökväg kommer loggfilerna att skrivas ut till katalogen som är namngiven efter den aktuella applikationen.

### plugin.createLogger()

Användningen är densamma som för `app.createLogger()`.

#### Definition

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Loggkonfiguration

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Hämtar den loggnivå som för närvarande är konfigurerad i systemet.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Sammanfogar katalogvägar baserat på den loggkatalog som för närvarande är konfigurerad i systemet.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Hämtar de loggutmatningsmetoder som för närvarande är konfigurerade i systemet.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Hämtar det loggformat som för närvarande är konfigurerat i systemet.

## Loggutdata

### Transports

Fördefinierade utmatningsmetoder.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Relaterad dokumentation

- [Utvecklingsguide - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)