:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Globale Umgebungsvariablen

## TZ

Legt die Zeitzone der Anwendung fest. Standardmäßig wird die Zeitzone des Betriebssystems verwendet.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Zeitbezogene Operationen werden gemäß dieser Zeitzone verarbeitet. Eine Änderung von `TZ` kann die Datumsangaben in der Datenbank beeinflussen. Weitere Details finden Sie unter „[Datum & Uhrzeit – Übersicht](#)“.
:::

## APP_ENV

Die Anwendungsumgebung. Der Standardwert ist `development`. Verfügbare Optionen sind:

- `production` – Produktionsumgebung
- `development` – Entwicklungsumgebung

```bash
APP_ENV=production
```

## APP_KEY

Der geheime Schlüssel der Anwendung, der unter anderem zur Generierung von Benutzer-Tokens verwendet wird. Ändern Sie diesen auf Ihren eigenen Anwendungsschlüssel und stellen Sie sicher, dass er nicht nach außen gelangt.

:::warning
Wenn der `APP_KEY` geändert wird, verlieren alte Tokens ihre Gültigkeit.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Der Port der Anwendung. Der Standardwert ist `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Das Präfix für die NocoBase API-Adresse. Der Standardwert ist `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Der Startmodus für Mehrkern- (Cluster-) Umgebungen. Wenn diese Variable konfiguriert ist, wird sie als Parameter `-i <instances>` an den Befehl `pm2 start` übergeben. Die Optionen stimmen mit dem `pm2 -i`-Parameter überein (siehe [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), einschließlich:

- `max`: Verwendet die maximale Anzahl der CPU-Kerne
- `-1`: Verwendet die maximale Anzahl der CPU-Kerne minus 1
- `<number>`: Gibt die Anzahl der Kerne an

Der Standardwert ist leer, was bedeutet, dass dieser Modus nicht aktiviert ist.

:::warning{title="Hinweis"}
Dieser Modus muss in Verbindung mit entsprechenden Cluster-Modus-Plugins verwendet werden, da es sonst zu Funktionsstörungen der Anwendung kommen kann.
:::

Weitere Informationen finden Sie unter: [Cluster-Modus](#).

## PLUGIN_PACKAGE_PREFIX

Das Präfix für den Paketnamen des **Plugins**. Standardmäßig ist dies: `@nocobase/plugin-,@nocobase/preset-`.

Wenn Sie beispielsweise das `hello` **Plugin** zu Ihrem `my-nocobase-app`-Projekt hinzufügen, lautet der vollständige **Plugin**-Paketname `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` kann wie folgt konfiguriert werden:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Die Zuordnung zwischen **Plugin**-Namen und Paketnamen ist dann wie folgt:

- Das Paket für das `users` **Plugin** ist `@nocobase/plugin-users`
- Das Paket für das `nocobase` **Plugin** ist `@nocobase/preset-nocobase`
- Das Paket für das `hello` **Plugin** ist `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Der Datenbanktyp. Verfügbare Optionen sind:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Der Datenbank-Host (erforderlich bei Verwendung einer MySQL- oder PostgreSQL-Datenbank).

Der Standardwert ist `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Der Datenbank-Port (erforderlich bei Verwendung einer MySQL- oder PostgreSQL-Datenbank).

- MySQL, MariaDB: Standard-Port `3306`
- PostgreSQL: Standard-Port `5432`

```bash
DB_PORT=3306
```

## DB_DATABASE

Der Datenbankname (erforderlich bei Verwendung einer MySQL- oder PostgreSQL-Datenbank).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Der Datenbank-Benutzer (erforderlich bei Verwendung einer MySQL- oder PostgreSQL-Datenbank).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Das Datenbank-Passwort (erforderlich bei Verwendung einer MySQL- oder PostgreSQL-Datenbank).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Das Präfix für Datenbanktabellen.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Legt fest, ob Datenbanktabellen- und Feldnamen in den Snake-Case-Stil konvertiert werden sollen. Der Standardwert ist `false`. Wenn Sie eine MySQL- (MariaDB-) Datenbank verwenden und `lower_case_table_names=1` gesetzt ist, muss `DB_UNDERSCORED` auf `true` gesetzt werden.

:::warning
Wenn `DB_UNDERSCORED=true` ist, stimmen die tatsächlichen Tabellen- und Feldnamen in der Datenbank nicht mit denen überein, die in der Benutzeroberfläche angezeigt werden. Zum Beispiel wird `orderDetails` in der Datenbank zu `order_details`.
:::

## DB_LOGGING

Der Schalter für die Datenbankprotokollierung. Der Standardwert ist `off`. Verfügbare Optionen sind:

- `on` – Aktiviert
- `off` – Deaktiviert

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Die Art der Protokollausgabe. Mehrere Werte werden durch Kommas (`,`) getrennt. Der Standardwert in der Entwicklungsumgebung ist `console`, in der Produktionsumgebung `console,dailyRotateFile`. Optionen:

- `console` – `console.log`
- `file` – Datei
- `dailyRotateFile` – Täglich rotierende Datei

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Der Speicherpfad für dateibasierte Protokolle. Standardmäßig ist dies `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Die Protokollierungsstufe für die Ausgabe. Der Standardwert in der Entwicklungsumgebung ist `debug`, in der Produktionsumgebung `info`. Optionen:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Die Protokollierungsstufe für die Datenbankausgabe ist `debug`. Ob diese ausgegeben wird, wird von `DB_LOGGING` gesteuert und nicht von `LOGGER_LEVEL` beeinflusst.

## LOGGER_MAX_FILES

Die maximale Anzahl der aufzubewahrenden Protokolldateien.

- Wenn `LOGGER_TRANSPORT` auf `file` gesetzt ist, beträgt der Standardwert `10`.
- Wenn `LOGGER_TRANSPORT` auf `dailyRotateFile` gesetzt ist, verwenden Sie `[n]d` für die Anzahl der Tage. Der Standardwert ist `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotiert Protokolle nach Größe.

- Wenn `LOGGER_TRANSPORT` auf `file` gesetzt ist, ist die Einheit `Byte` und der Standardwert `20971520 (20 * 1024 * 1024)`.
- Wenn `LOGGER_TRANSPORT` auf `dailyRotateFile` gesetzt ist, können Sie `[n]k`, `[n]m`, `[n]g` verwenden. Standardmäßig nicht konfiguriert.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Das Format für die Protokollausgabe. Der Standardwert in der Entwicklungsumgebung ist `console`, in der Produktionsumgebung `json`. Optionen:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Siehe: [Protokollformat](#)

## CACHE_DEFAULT_STORE

Der eindeutige Bezeichner für den zu verwendenden Cache-Speicher. Er legt den standardmäßigen serverseitigen Cache-Speicher fest. Der Standardwert ist `memory`. Integrierte Optionen sind:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Die maximale Anzahl von Elementen im Speicher-Cache. Der Standardwert ist `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Die Redis-Verbindung, optional. Beispiel: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Aktiviert die Erfassung von Telemetriedaten. Standardmäßig ist dies `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Die aktivierten Metrik-Reader für die Überwachung. Standardmäßig ist dies `console`. Andere Werte müssen sich auf die registrierten Namen der entsprechenden Reader-**Plugins** beziehen, z. B. `prometheus`. Mehrere Werte werden durch Kommas (`,`) getrennt.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Die aktivierten Trace-Datenprozessoren. Standardmäßig ist dies `console`. Andere Werte müssen sich auf die registrierten Namen der entsprechenden Prozessor-**Plugins** beziehen. Mehrere Werte werden durch Kommas (`,`) getrennt.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```