:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Logger

## Vytvoření Loggeru

### `createLogger()`

Vytvoří vlastní logger.

#### Signatura

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

#### Podrobnosti

| Vlastnost    | Popis                       |
| :----------- | :-------------------------- |
| `dirname`    | Výstupní adresář pro logy   |
| `filename`   | Název souboru logu          |
| `format`     | Formát logu                 |
| `transports` | Metoda výstupu logu         |

### `createSystemLogger()`

Vytváří systémové logy běhu, které jsou tištěny předepsaným způsobem. Viz [Logger - Systémový log](/log-and-monitor/logger/index.md#system-log)

#### Signatura

- `createSystemLogger(options: SystemLoggerOptions)`

#### Typ

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // tiskne chyby odděleně, výchozí hodnota je true
}
```

#### Podrobnosti

| Vlastnost       | Popis                                           |
| :-------------- | :---------------------------------------------- |
| `seperateError` | Zda se mají logy úrovně `error` vypisovat samostatně |

### `requestLogger()`

Middleware pro logování požadavků a odpovědí API.

```ts
app.use(requestLogger(app.name));
```

#### Signatura

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Typ

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Podrobnosti

| Vlastnost           | Typ                               | Popis                                                            | Výchozí hodnota                                                                                                                                                 |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Přeskočí logování pro určité požadavky na základě kontextu požadavku. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Whitelist informací o požadavku, které se mají tisknout do logu. | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Whitelist informací o odpovědi, které se mají tisknout do logu.  | `['status']`                                                                                                                                            |

### app.createLogger()

#### Definice

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

Pokud je `dirname` relativní cestou, soubory logů se uloží do adresáře pojmenovaného podle aktuální aplikace.

### plugin.createLogger()

Použití je stejné jako u `app.createLogger()`.

#### Definice

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Konfigurace logování

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Získá úroveň logování aktuálně nakonfigurovanou v systému.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Spojí cesty k adresářům na základě adresáře pro logy aktuálně nakonfigurovaného v systému.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Získá metody výstupu logů aktuálně nakonfigurované v systému.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Získá formát logů aktuálně nakonfigurovaný v systému.

## Výstup logů

### Transports

Předdefinované metody výstupu.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Související dokumentace

- [Průvodce vývojem - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/)