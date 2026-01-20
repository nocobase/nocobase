:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Logger

## Logger aanmaken

### `createLogger()`

Maakt een aangepaste logger aan.

#### Signatuur

- `createLogger(options: LoggerOptions)`

#### Type

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Details

| Eigenschap   | Beschrijving             |
| ------------ | ------------------------ |
| `dirname`    | Logboek uitvoermap       |
| `filename`   | Logboek bestandsnaam     |
| `format`     | Logboekformaat           |
| `transports` | Logboek uitvoermethode   |

### `createSystemLogger()`

Maakt systeemlogboeken aan die op een specifieke manier worden afgedrukt. Raadpleeg [Logger - Systeemlogboek](/log-and-monitor/logger/index.md#system-log)

#### Signatuur

- `createSystemLogger(options: SystemLoggerOptions)`

#### Type

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Details

| Eigenschap        | Beschrijving                                     |
| --------------- | ------------------------------------------------ |
| `seperateError` | Of `error`-niveau logboeken afzonderlijk worden uitgevoerd |

### `requestLogger()`

Middleware voor het loggen van API-verzoeken en -antwoorden.

```ts
app.use(requestLogger(app.name));
```

#### Signatuur

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Type

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Details

| Eigenschap          | Type                              | Beschrijving                                                      | Standaardwaarde                                                                                                                                                 |
| ------------------- | --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Slaat het loggen van bepaalde verzoeken over op basis van de verzoekcontext. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Whitelist van verzoekinformatie die in het logboek moet worden afgedrukt.       | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Whitelist van antwoordinformatie die in het logboek moet worden afgedrukt.      | `['status']`                                                                                                                                            |

### app.createLogger()

#### Definitie

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

Als `dirname` een relatief pad is, worden de logbestanden uitgevoerd naar de map met de naam van de huidige applicatie.

### plugin.createLogger()

Het gebruik is hetzelfde als `app.createLogger()`.

#### Definitie

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Logboekconfiguratie

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Haalt het logniveau op dat momenteel in het systeem is geconfigureerd.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Voegt mappaden samen op basis van de logboekmap die momenteel in het systeem is geconfigureerd.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Haalt de logboek uitvoermethoden op die momenteel in het systeem zijn geconfigureerd.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Haalt het logboekformaat op dat momenteel in het systeem is geconfigureerd.

## Logboekuitvoer

### Transports

Voorgedefinieerde uitvoermethoden.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Gerelateerde documentatie

- [Ontwikkelingsgids - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)