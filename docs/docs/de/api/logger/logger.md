:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Logger

## Logger erstellen

### `createLogger()`

Erstellt einen benutzerdefinierten Logger.

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

#### Details

| Eigenschaft  | Beschreibung            |
| :----------- | :---------------------- |
| `dirname`    | Log-Ausgabeverzeichnis  |
| `filename`   | Log-Dateiname           |
| `format`     | Log-Format              |
| `transports` | Log-Ausgabemethode      |

### `createSystemLogger()`

Erstellt Logs für den Systembetrieb, die auf eine bestimmte Weise ausgegeben werden. Siehe [Logger - System-Log](/log-and-monitor/logger/index.md#system-log)

#### Signatur

- `createSystemLogger(options: SystemLoggerOptions)`

#### Typ

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // Fehler separat ausgeben, Standardwert ist true
}
```

#### Details

| Eigenschaft     | Beschreibung                                                      |
| :-------------- | :---------------------------------------------------------------- |
| `seperateError` | Gibt an, ob Logs der Stufe `error` separat ausgegeben werden sollen. |

### `requestLogger()`

Middleware für die Protokollierung von API-Anfragen und -Antworten.

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

#### Details

| Eigenschaft         | Typ                               | Beschreibung                                                              | Standardwert                                                                                                                                            |
| :------------------ | :-------------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Überspringt die Protokollierung für bestimmte Anfragen basierend auf dem Anfragekontext. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Whitelist der Anfrageinformationen, die im Log ausgegeben werden sollen.  | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Whitelist der Antwortinformationen, die im Log ausgegeben werden sollen.  | `['status']`                                                                                                                                            |

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

Wenn `dirname` ein relativer Pfad ist, werden die Log-Dateien in das Verzeichnis ausgegeben, das nach der aktuellen Anwendung benannt ist.

### plugin.createLogger()

Die Verwendung ist identisch mit `app.createLogger()`.

#### Definition

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Log-Konfiguration

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Ruft die aktuell im System konfigurierte Log-Stufe ab.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Fügt Verzeichnispfade basierend auf dem aktuell im System konfigurierten Log-Verzeichnis zusammen.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Ruft die aktuell im System konfigurierten Log-Ausgabemethoden ab.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Ruft das aktuell im System konfigurierte Log-Format ab.

## Log-Ausgabe

### Transports

Vordefinierte Ausgabemethoden.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Verwandte Dokumentation

- [Entwicklungsleitfaden - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)