:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rejestrator

## Tworzenie rejestratora

### `createLogger()`

Tworzy niestandardowy rejestrator.

#### Sygnatura

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

#### Szczegóły

| Właściwość   | Opis                      |
| :----------- | :------------------------ |
| `dirname`    | Katalog wyjściowy logów   |
| `filename`   | Nazwa pliku logu          |
| `format`     | Format logu               |
| `transports` | Sposób zapisu logów       |

### `createSystemLogger()`

Tworzy logi systemowe, które są zapisywane w określony sposób. Proszę zapoznać się z [Rejestrator - Logi systemowe](/log-and-monitor/logger/index.md#system-log).

#### Sygnatura

- `createSystemLogger(options: SystemLoggerOptions)`

#### Typ

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Szczegóły

| Właściwość      | Opis                                    |
| :-------------- | :-------------------------------------- |
| `seperateError` | Czy logi poziomu `error` mają być zapisywane oddzielnie |

### `requestLogger()`

Middleware do logowania żądań i odpowiedzi API.

```ts
app.use(requestLogger(app.name));
```

#### Sygnatura

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Typ

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Szczegóły

| Właściwość          | Typ                               | Opis                                                             | Wartość domyślna                                                                                                                                        |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Pomija logowanie niektórych żądań na podstawie kontekstu żądania. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Biała lista informacji o żądaniu, które mają być zapisane w logu. | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Biała lista informacji o odpowiedzi, które mają być zapisane w logu. | `['status']`                                                                                                                                            |

### app.createLogger()

#### Definicja

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

Gdy `dirname` jest ścieżką względną, pliki logów zostaną zapisane w katalogu o nazwie bieżącej aplikacji.

### plugin.createLogger()

Sposób użycia jest taki sam jak w `app.createLogger()`.

#### Definicja

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Konfiguracja logów

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Pobiera aktualnie skonfigurowany w systemie poziom logowania.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Łączy ścieżki katalogów, bazując na aktualnie skonfigurowanym w systemie katalogu logów.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Pobiera aktualnie skonfigurowane w systemie metody zapisu logów.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Pobiera aktualnie skonfigurowany w systemie format logów.

## Zapis logów

### Transports

Wstępnie zdefiniowane metody zapisu.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Powiązana dokumentacja

- [Przewodnik dla deweloperów - Rejestrator](/plugin-development/server/logger)
- [Rejestrator](/log-and-monitor/logger/)