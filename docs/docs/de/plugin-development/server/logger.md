:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Logger

Die Protokollierung in NocoBase basiert auf <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Standardmäßig unterteilt NocoBase die Logs in API-Anfrage-Logs, Systemlaufzeit-Logs und SQL-Ausführungs-Logs. Während API-Anfrage-Logs und SQL-Ausführungs-Logs intern von der Anwendung protokolliert werden, müssen Plugin-Entwickler in der Regel nur die für ihre Plugins relevanten Systemlaufzeit-Logs protokollieren.

Dieses Dokument beschreibt, wie Sie beim Entwickeln von Plugins Logs erstellen und protokollieren.

## Standard-Protokollierungsmethoden

NocoBase stellt Methoden zur Protokollierung von Systemlaufzeit-Logs bereit. Die Logs werden gemäß vordefinierten Feldern ausgegeben und in bestimmten Dateien gespeichert.

```ts
// Standard-Protokollierungsmethode
app.log.info("message");

// Verwendung in Middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Verwendung in Plugins
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Alle oben genannten Methoden folgen der untenstehenden Verwendung:

Der erste Parameter ist die Log-Nachricht, und der zweite Parameter ist ein optionales Metadata-Objekt, das beliebige Schlüssel-Wert-Paare enthalten kann. Dabei werden `module`, `submodule` und `method` als separate Felder extrahiert, während die restlichen Felder im `meta`-Feld abgelegt werden.

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

## Ausgabe in andere Dateien

Wenn Sie die Standard-Protokollierungsmethode des Systems verwenden, aber die Logs nicht in die Standarddatei ausgeben möchten, können Sie mit `createSystemLogger` eine benutzerdefinierte System-Logger-Instanz erstellen.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Gibt an, ob Logs der Stufe 'error' separat in 'xxx_error.log' ausgegeben werden sollen.
});
```

## Benutzerdefinierter Logger

Wenn Sie anstelle der vom System bereitgestellten Methoden die nativen Methoden von Winston verwenden möchten, können Sie Logs mit den folgenden Methoden erstellen.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` erweitert die ursprünglichen `winston.LoggerOptions`.

- `transports` – Verwenden Sie `'console' | 'file' | 'dailyRotateFile'`, um vordefinierte Ausgabemethoden anzuwenden.
- `format` – Verwenden Sie `'logfmt' | 'json' | 'delimiter'`, um vordefinierte Protokollierungsformate anzuwenden.

### `app.createLogger`

In Szenarien mit mehreren Anwendungen möchten wir manchmal benutzerdefinierte Ausgabe-Verzeichnisse und -Dateien, die in ein Verzeichnis mit dem Namen der aktuellen Anwendung ausgegeben werden können.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Ausgabe nach /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Der Anwendungsfall und die Methode sind identisch mit `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Ausgabe nach /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```