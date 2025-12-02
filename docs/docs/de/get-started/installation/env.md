:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Umgebungsvariablen

## Wie richte ich Umgebungsvariablen ein?

### Installation über Git-Quellcode oder `create-nocobase-app`

Legen Sie Umgebungsvariablen in der `.env`-Datei im Stammverzeichnis Ihres Projekts fest. Nachdem Sie die Umgebungsvariablen geändert haben, müssen Sie den Anwendungsprozess beenden und die Anwendung neu starten.

### Installation über Docker

Bearbeiten Sie die `docker-compose.yml`-Konfiguration und legen Sie die Umgebungsvariablen im Parameter `environment` fest. Beispiel:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Sie können auch `env_file` verwenden, um Umgebungsvariablen in einer `.env`-Datei zu definieren. Beispiel:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Nachdem Sie die Umgebungsvariablen geändert haben, müssen Sie den App-Container neu erstellen:

```bash
docker compose up -d app
```

## Globale Umgebungsvariablen

### TZ

Dient zum Festlegen der Zeitzone der Anwendung. Standardmäßig wird die Zeitzone des Betriebssystems verwendet.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Zeitbezogene Operationen werden gemäß dieser Zeitzone verarbeitet. Eine Änderung von TZ kann Datumswerte in der Datenbank beeinflussen. Weitere Details finden Sie unter „[Datum & Uhrzeit Übersicht](/data-sources/data-modeling/collection-fields/datetime)“.
:::

### APP_ENV

Die Anwendungsumgebung. Der Standardwert ist `development`. Verfügbare Optionen sind:

- `production` Produktionsumgebung
- `development` Entwicklungsumgebung

```bash
APP_ENV=production
```

### APP_KEY

Der geheime Schlüssel der Anwendung, der unter anderem zur Generierung von Benutzer-Tokens verwendet wird. Ändern Sie ihn zu Ihrem eigenen Anwendungsschlüssel und stellen Sie sicher, dass er nicht nach außen gelangt.

:::warning
Wenn der `APP_KEY` geändert wird, werden alte Tokens ungültig.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Der Port der Anwendung. Der Standardwert ist `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Das Präfix der NocoBase API-Adresse. Der Standardwert ist `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Der Multi-Core- (Cluster-) Startmodus der Anwendung. Wenn diese Variable konfiguriert ist, wird sie als Parameter `-i <instances>` an den `pm2 start`-Befehl übergeben. Die Optionen stimmen mit dem `pm2 -i`-Parameter überein (siehe [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)) und umfassen:

- `max`: Verwendet die maximale Anzahl an CPU-Kernen
- `-1`: Verwendet die maximale Anzahl an CPU-Kernen minus eins
- `<number>`: Gibt die Anzahl der Kerne an

Der Standardwert ist leer, was bedeutet, dass der Modus nicht aktiviert ist.

:::warning{title="Achtung"}
Dieser Modus erfordert die Verwendung von **Plugins**, die mit dem Cluster-Modus zusammenhängen. Andernfalls kann es zu unerwarteten Problemen mit der Funktionalität der Anwendung kommen.
:::

Weitere Informationen finden Sie unter: [Cluster-Modus](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Das Präfix für den Paketnamen des **Plugins**. Der Standardwert ist `@nocobase/plugin-,@nocobase/preset-`.

Wenn Sie beispielsweise das `hello` **Plugin** zu Ihrem `my-nocobase-app`-Projekt hinzufügen, lautet der vollständige Paketname des **Plugins** `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` kann wie folgt konfiguriert werden:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Die Zuordnung zwischen **Plugin**-Namen und Paketnamen ist dann wie folgt:

- Der Paketname des `users` **Plugins** ist `@nocobase/plugin-users`
- Der Paketname des `nocobase` **Plugins** ist `@nocobase/preset-nocobase`
- Der Paketname des `hello` **Plugins** ist `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Der Datenbanktyp. Verfügbare Optionen sind:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Der Datenbank-Host (erforderlich bei Verwendung von MySQL- oder PostgreSQL-Datenbanken).

Der Standardwert ist `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Der Datenbank-Port (erforderlich bei Verwendung von MySQL- oder PostgreSQL-Datenbanken).

- Der Standard-Port für MySQL und MariaDB ist 3306
- Der Standard-Port für PostgreSQL ist 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Der Datenbankname (erforderlich bei Verwendung von MySQL- oder PostgreSQL-Datenbanken).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Der Datenbank-Benutzer (erforderlich bei Verwendung von MySQL- oder PostgreSQL-Datenbanken).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Das Datenbank-Passwort (erforderlich bei Verwendung von MySQL- oder PostgreSQL-Datenbanken).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Das Präfix für Datenbanktabellen.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Gibt an, ob Datenbanktabellen- und Feldnamen in den Snake-Case-Stil konvertiert werden sollen. Der Standardwert ist `false`. Wenn Sie eine MySQL- (MariaDB-) Datenbank verwenden und `lower_case_table_names=1` gesetzt ist, muss `DB_UNDERSCORED` auf `true` gesetzt werden.

:::warning
Wenn `DB_UNDERSCORED=true` ist, stimmen die tatsächlichen Tabellen- und Feldnamen in der Datenbank nicht mit denen überein, die in der Benutzeroberfläche angezeigt werden. Zum Beispiel wird `orderDetails` in der Datenbank als `order_details` gespeichert.
:::

### DB_LOGGING

Der Schalter für die Datenbankprotokollierung. Der Standardwert ist `off`. Verfügbare Optionen sind:

- `on` Aktiviert
- `off` Deaktiviert

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Die maximale Anzahl von Verbindungen im Datenbank-Verbindungspool. Der Standardwert ist `5`.

### DB_POOL_MIN

Die minimale Anzahl von Verbindungen im Datenbank-Verbindungspool. Der Standardwert ist `0`.

### DB_POOL_IDLE

Die maximale Leerlaufzeit, in Millisekunden, die eine Verbindung im Datenbank-Verbindungspool haben kann, bevor sie freigegeben wird. Der Standardwert ist `10000` (10 Sekunden).

### DB_POOL_ACQUIRE

Die maximale Wartezeit, in Millisekunden, die der Pool versucht, eine Verbindung herzustellen, bevor ein Fehler ausgelöst wird. Der Standardwert ist `60000` (60 Sekunden).

### DB_POOL_EVICT

Das Zeitintervall, in Millisekunden, nach dem der Verbindungspool inaktive Verbindungen entfernt. Der Standardwert ist `1000` (1 Sekunde).

### DB_POOL_MAX_USES

Die Anzahl der Verwendungen einer Verbindung, bevor sie verworfen und ersetzt wird. Der Standardwert ist `0` (unbegrenzt).

### LOGGER_TRANSPORT

Die Methode zur Protokollausgabe. Mehrere Werte werden durch Kommas getrennt. Der Standardwert in der Entwicklungsumgebung ist `console`, in der Produktionsumgebung `console,dailyRotateFile`. Optionen:

- `console` - `console.log`
- `file` - Ausgabe in eine Datei
- `dailyRotateFile` - Ausgabe in täglich rotierende Dateien

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Der Speicherpfad für dateibasierte Protokolle. Der Standardwert ist `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Die Protokoll-Ausgabestufe. Der Standardwert in der Entwicklungsumgebung ist `debug`, in der Produktionsumgebung `info`. Optionen:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Die Protokollausgabestufe der Datenbank ist `debug`. Ob diese ausgegeben wird, wird von `DB_LOGGING` gesteuert und ist unabhängig von `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Die maximale Anzahl der aufzubewahrenden Protokolldateien.

- Wenn `LOGGER_TRANSPORT` auf `file` gesetzt ist, beträgt der Standardwert `10`.
- Wenn `LOGGER_TRANSPORT` auf `dailyRotateFile` gesetzt ist, wird `[n]d` für die Anzahl der Tage verwendet. Der Standardwert ist `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Protokollrotation nach Größe.

- Wenn `LOGGER_TRANSPORT` auf `file` gesetzt ist, ist die Einheit `Byte`. Der Standardwert ist `20971520 (20 * 1024 * 1024)`.
- Wenn `LOGGER_TRANSPORT` auf `dailyRotateFile` gesetzt ist, können Sie `[n]k`, `[n]m`, `[n]g` verwenden. Standardmäßig nicht konfiguriert.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Das Format der Protokollausgabe. Der Standardwert in der Entwicklungsumgebung ist `console`, in der Produktionsumgebung `json`. Optionen:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referenz: [Protokollformat](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Der eindeutige Bezeichner für die Caching-Methode, der den Standard-Cache des Servers angibt. Der Standardwert ist `memory`. Integrierte Optionen sind:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Die maximale Anzahl von Elementen im Speicher-Cache. Der Standardwert ist `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Die Redis-Verbindungs-URL, optional. Beispiel: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Aktiviert die Erfassung von Telemetriedaten. Der Standardwert ist `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Die aktivierten Metrik-Kollektoren für die Überwachung. Der Standardwert ist `console`. Andere Werte sollten sich auf die Namen beziehen, die von den entsprechenden **Plugin**-Kollektoren registriert wurden, z. B. `prometheus`. Mehrere Werte werden durch Kommas getrennt.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Die aktivierten Trace-Datenprozessoren. Der Standardwert ist `console`. Andere Werte sollten sich auf die Namen beziehen, die von den entsprechenden **Plugin**-Prozessoren registriert wurden. Mehrere Werte werden durch Kommas getrennt.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Experimentelle Umgebungsvariablen

### APPEND_PRESET_LOCAL_PLUGINS

Dient zum Anhängen vordefinierter, nicht aktivierter **Plugins**. Der Wert ist der Paketname (der `name`-Parameter in `package.json`), wobei mehrere **Plugins** durch Kommas getrennt werden.

:::info
1. Stellen Sie sicher, dass das **Plugin** lokal heruntergeladen wurde und im Verzeichnis `node_modules` gefunden werden kann. Weitere Details finden Sie unter [**Plugin**-Organisation](/plugin-development/project-structure).
2. Nachdem Sie die Umgebungsvariable hinzugefügt haben, wird das **Plugin** auf der **Plugin**-Manager-Seite erst nach einer Erstinstallation (`nocobase install`) oder einem Upgrade (`nocobase upgrade`) angezeigt.
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Dient zum Anhängen integrierter **Plugins**, die standardmäßig installiert werden. Der Wert ist der Paketname (der `name`-Parameter in `package.json`), wobei mehrere **Plugins** durch Kommas getrennt werden.

:::info
1. Stellen Sie sicher, dass das **Plugin** lokal heruntergeladen wurde und im Verzeichnis `node_modules` gefunden werden kann. Weitere Details finden Sie unter [**Plugin**-Organisation](/plugin-development/project-structure).
2. Nachdem Sie die Umgebungsvariable hinzugefügt haben, wird das **Plugin** bei der Erstinstallation (`nocobase install`) oder einem Upgrade (`nocobase upgrade`) automatisch installiert oder aktualisiert.
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Temporäre Umgebungsvariablen

Die Installation von NocoBase kann durch das Setzen temporärer Umgebungsvariablen unterstützt werden, zum Beispiel:

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Entspricht
yarn nocobase install \
  --lang=en-US \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Entspricht
yarn nocobase install -l en-US -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Die Sprache während der Installation. Der Standardwert ist `en-US`. Verfügbare Optionen sind:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  nocobase install
```

### INIT_ROOT_EMAIL

Die E-Mail-Adresse des Root-Benutzers.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Das Passwort des Root-Benutzers.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Der Spitzname des Root-Benutzers.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```