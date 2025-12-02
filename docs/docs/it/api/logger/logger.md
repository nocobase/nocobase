:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Logger

## Creazione del Logger

### `createLogger()`

Crea un logger personalizzato.

#### Firma

- `createLogger(options: LoggerOptions)`

#### Tipo

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Dettagli

| Proprietà    | Descrizione                  |
| :----------- | :--------------------------- |
| `dirname`    | Directory di output dei log  |
| `filename`   | Nome del file di log         |
| `format`     | Formato del log              |
| `transports` | Metodo di output dei log     |

### `createSystemLogger()`

Crea i log di runtime del sistema, stampati con un metodo specificato. Per maggiori dettagli, consulti [Logger - Log di sistema](/log-and-monitor/logger/index.md#system-log).

#### Firma

- `createSystemLogger(options: SystemLoggerOptions)`

#### Tipo

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Dettagli

| Proprietà       | Descrizione                                     |
| :-------------- | :---------------------------------------------- |
| `seperateError` | Indica se separare l'output dei log di livello `error`. |

### `requestLogger()`

Middleware per la registrazione delle richieste e risposte API.

```ts
app.use(requestLogger(app.name));
```

#### Firma

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Tipo

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Dettagli

| Proprietà           | Tipo                              | Descrizione                                                      | Valore predefinito                                                                                                                                              |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Ignora la registrazione per determinate richieste basandosi sul contesto della richiesta. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Whitelist delle informazioni della richiesta da stampare nel log.       | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Whitelist delle informazioni della risposta da stampare nel log.      | `['status']`                                                                                                                                            |

### app.createLogger()

#### Definizione

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

Quando `dirname` è un percorso relativo, i file di log verranno salvati nella directory con il nome dell'applicazione corrente.

### plugin.createLogger()

L'utilizzo è lo stesso di `app.createLogger()`.

#### Definizione

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Configurazione dei Log

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Recupera il livello di log attualmente configurato nel sistema.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Concatena i percorsi delle directory basandosi sulla directory dei log attualmente configurata nel sistema.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Recupera i metodi di output dei log attualmente configurati nel sistema.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Recupera il formato dei log attualmente configurato nel sistema.

## Output dei Log

### Transports

Metodi di output predefiniti.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Documentazione Correlata

- [Guida allo Sviluppo - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)