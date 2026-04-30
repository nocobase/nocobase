---
title: "Globale Umgebungsvariablen"
description: "NocoBase Umgebungsvariablen: Erläuterung der Konfigurationsoptionen wie TZ, APP_KEY, DB usw."
keywords: "Umgebungsvariablen,APP_KEY,TZ,Konfiguration,NocoBase"
---

# Globale Umgebungsvariablen

## TZ

Wird verwendet, um die Zeitzone der Anwendung festzulegen. Standardmäßig wird die Zeitzone des Betriebssystems verwendet.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Zeitbezogene Operationen werden gemäß dieser Zeitzone verarbeitet. Eine Änderung von TZ kann sich auf Datumswerte in der Datenbank auswirken. Weitere Informationen finden Sie unter „[Übersicht über Datum & Uhrzeit](#)".
:::

## APP_ENV

Anwendungsumgebung, Standardwert `development`. Mögliche Werte:

- `production` Produktionsumgebung
- `development` Entwicklungsumgebung

```bash
APP_ENV=production
```

## APP_KEY

Der Schlüssel der Anwendung, der zum Generieren von Benutzer-Tokens und Ähnlichem verwendet wird. Ändern Sie ihn auf Ihren eigenen Anwendungsschlüssel und stellen Sie sicher, dass er nicht nach außen gelangt.

:::warning
Wenn der APP_KEY geändert wird, werden auch alte Tokens ungültig.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Anwendungsport, Standardwert `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Präfix der NocoBase-API-Adresse, Standardwert `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Mehrkern- (Cluster-) Startmodus. Wenn diese Variable konfiguriert ist, wird sie an den Befehl `pm2 start` als Parameter `-i <instances>` weitergegeben. Die Optionen entsprechen dem PM2-Parameter `-i` (siehe [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)) und umfassen:

- `max`: Maximale Anzahl an CPU-Kernen verwenden
- `-1`: Maximale Anzahl an CPU-Kernen minus 1 verwenden
- `<number>`: Bestimmte Kernanzahl angeben

Der Standardwert ist leer, was bedeutet, dass der Modus nicht aktiviert ist.

:::warning{title="Hinweis"}
Dieser Modus erfordert die Verwendung der entsprechenden Cluster-Modus-Plugins, andernfalls können Funktionsstörungen der Anwendung auftreten.
:::

Weitere Informationen: [Cluster-Modus](#).

## PLUGIN_PACKAGE_PREFIX

Präfix für Plugin-Paketnamen, Standardwert: `@nocobase/plugin-,@nocobase/preset-`.

Wenn Sie beispielsweise das Plugin `hello` zum Projekt `my-nocobase-app` hinzufügen, lautet der vollständige Paketname `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX kann konfiguriert werden als:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Die Zuordnung von Plugin-Namen zu Paketnamen lautet dann:

- Das Plugin `users` hat den Paketnamen `@nocobase/plugin-users`
- Das Plugin `nocobase` hat den Paketnamen `@nocobase/preset-nocobase`
- Das Plugin `hello` hat den Paketnamen `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Datenbanktyp, mögliche Werte:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Datenbank-Host (erforderlich bei Verwendung einer MySQL- oder PostgreSQL-Datenbank).

Standardwert: `localhost`

```bash
DB_HOST=localhost
```

## DB_PORT

Datenbank-Port (erforderlich bei Verwendung einer MySQL- oder PostgreSQL-Datenbank).

- MySQL, MariaDB Standardport 3306
- PostgreSQL Standardport 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Datenbankname (erforderlich bei Verwendung einer MySQL- oder PostgreSQL-Datenbank).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Datenbank-Benutzer (erforderlich bei Verwendung einer MySQL- oder PostgreSQL-Datenbank).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Datenbank-Passwort (erforderlich bei Verwendung einer MySQL- oder PostgreSQL-Datenbank).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Tabellen-Präfix.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Gibt an, ob Tabellen- und Feldnamen in der Datenbank in den snake_case-Stil konvertiert werden. Standardwert: `false`. Wenn Sie eine MySQL- (MariaDB-) Datenbank mit `lower_case_table_names=1` verwenden, muss DB_UNDERSCORED auf `true` gesetzt sein.

:::warning
Wenn `DB_UNDERSCORED=true` ist, stimmen die tatsächlichen Tabellen- und Feldnamen in der Datenbank nicht mit den in der UI angezeigten überein. Beispielsweise heißt `orderDetails` in der Datenbank `order_details`.
:::

## DB_LOGGING

Schalter für Datenbank-Logs, Standardwert `off`. Mögliche Werte:

- `on` aktiviert
- `off` deaktiviert

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Logging-Ausgabemethoden, mehrere durch `,` getrennt. Standardwert in der Entwicklungsumgebung: `console`. Standardwert in der Produktionsumgebung: `console,dailyRotateFile`.
Mögliche Werte:

- `console` - `console.log`
- `file` - `Datei`
- `dailyRotateFile` - `tagesbasierte rotierende Datei`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Pfad für dateibasierte Log-Speicherung, Standardwert: `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Log-Level der Ausgabe. Standardwert in der Entwicklungsumgebung: `debug`. Standardwert in der Produktionsumgebung: `info`. Mögliche Werte:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Das Log-Level der Datenbankausgabe ist `debug`, gesteuert durch `DB_LOGGING` (Ausgabe ja/nein), unabhängig von `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Maximale Anzahl der zu behaltenden Logdateien.

- Bei `LOGGER_TRANSPORT=file` ist der Standardwert `10`.
- Bei `LOGGER_TRANSPORT=dailyRotateFile` wird `[n]d` zur Angabe der Tage verwendet. Standardwert: `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Log-Rotation nach Größe.

- Bei `LOGGER_TRANSPORT=file`: Einheit `byte`, Standardwert `20971520 (20 * 1024 * 1024)`.
- Bei `LOGGER_TRANSPORT=dailyRotateFile`: kann `[n]k`, `[n]m`, `[n]g` verwenden. Standardmäßig nicht konfiguriert.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Format der Log-Ausgabe. Standard in der Entwicklungsumgebung: `console`. Standard in der Produktionsumgebung: `json`. Mögliche Werte:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Siehe: [Log-Format](#)

## CACHE_DEFAULT_STORE

Eindeutige Kennung für die Cache-Methode, gibt die serverseitige Standard-Cache-Methode an. Standardwert: `memory`. Eingebaute Optionen:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Maximale Anzahl an Memory-Cache-Einträgen, Standardwert `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Redis-Verbindung, optional. Beispiel: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Aktiviert die Telemetriedatenerfassung, Standardwert `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Aktivierte Metric-Reader, Standardwert `console`. Andere Werte beziehen sich auf den Namen, unter dem der entsprechende Reader-Plugin registriert ist, z. B. `prometheus`. Mehrere durch `,` getrennt.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Aktivierte Trace-Processor, Standardwert `console`. Andere Werte beziehen sich auf den Namen, unter dem der entsprechende Processor-Plugin registriert ist. Mehrere durch `,` getrennt.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```
