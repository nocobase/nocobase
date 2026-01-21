:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Globala Miljövariabler

## TZ

Används för att ställa in applikationens tidszon, standardvärdet är operativsystemets tidszon.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Tidsrelaterade operationer kommer att behandlas enligt denna tidszon. Att ändra TZ kan påverka datumvärdena i databasen. För mer information, se '[Översikt över datum och tid](#)'
:::

## APP_ENV

Applikationsmiljö, standardvärdet är `development`. Alternativen inkluderar:

- `production` Produktionsmiljö
- `development` Utvecklingsmiljö

```bash
APP_ENV=production
```

## APP_KEY

Applikationens hemliga nyckel, som används för att generera användartoken med mera. Ändra den till er egen applikationsnyckel och se till att den inte läcker ut.

:::warning
Om APP_KEY ändras kommer gamla token att bli ogiltiga.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Applikationsport, standardvärdet är `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

NocoBase API-adressprefix, standardvärdet är `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Startläge för flerkärnig (kluster) drift. Om denna variabel konfigureras, skickas den vidare till kommandot `pm2 start` som parametern `-i <instances>`. Alternativen överensstämmer med pm2:s `-i` parameter (se [PM2: Klusterläge](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), inklusive:

- `max`: använder maximalt antal CPU-kärnor
- `-1`: använder maximalt antal CPU-kärnor minus 1
- `<number>`: specificerar antalet kärnor

Standardvärdet är tomt, vilket innebär att det inte är aktiverat.

:::warning{title="Obs"}
Detta läge måste användas tillsammans med plugin för klusterläge, annars kan applikationens funktionalitet bli felaktig.
:::

För mer information, se: [Klusterläge](#).

## PLUGIN_PACKAGE_PREFIX

Prefix för plugin-paketnamn, standardvärdet är: `@nocobase/plugin-,@nocobase/preset-`.

Om ni till exempel lägger till `hello`-pluginet till projektet `my-nocobase-app`, blir pluginets fullständiga paketnamn `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX kan konfigureras som:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Då är mappningen mellan plugin-namn och paketnamn följande:

- Paketnamnet för `users`-pluginet är `@nocobase/plugin-users`
- Paketnamnet för `nocobase`-pluginet är `@nocobase/preset-nocobase`
- Paketnamnet för `hello`-pluginet är `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Databastyp, alternativen inkluderar:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Databasvärd (måste konfigureras vid användning av MySQL- eller PostgreSQL-databas).

Standardvärdet är `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Databasport (måste konfigureras vid användning av MySQL- eller PostgreSQL-databas).

- MySQL, MariaDB standardport 3306
- PostgreSQL standardport 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Databasnamn (måste konfigureras vid användning av MySQL- eller PostgreSQL-databas).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Databasanvändare (måste konfigureras vid användning av MySQL- eller PostgreSQL-databas).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Databaslösenord (måste konfigureras vid användning av MySQL- eller PostgreSQL-databas).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Tabellprefix för databasen.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Om databasens tabellnamn och fältnamn ska konverteras till snake_case-stil, standardvärdet är `false`. Om ni använder en MySQL (MariaDB) databas och `lower_case_table_names=1`, måste DB_UNDERSCORED vara `true`.

:::warning
När `DB_UNDERSCORED=true` kommer de faktiska tabell- och fältnamnen i databasen inte att överensstämma med vad som visas i gränssnittet. Till exempel kommer `orderDetails` i databasen att vara `order_details`.
:::

## DB_LOGGING

Växla för databasloggning, standardvärdet är `off`. Alternativen inkluderar:

- `on` Aktiverad
- `off` Inaktiverad

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Loggutgångssätt, flera värden separeras med `,`. Standardvärdet i utvecklingsmiljö är `console`, och i produktionsmiljö är `console,dailyRotateFile`. Alternativ:

- `console` - `console.log`
- `file` - `Fil`
- `dailyRotateFile` - `Daglig roterande fil`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Filbaserad sökväg för logglagring, standardvärdet är `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Loggnivå för utdata. Standardvärdet i utvecklingsmiljö är `debug`, och i produktionsmiljö är `info`. Alternativ:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Databasens loggnivå för utdata är `debug`, och om den ska visas styrs av `DB_LOGGING`, inte av `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Maximalt antal loggfiler att behålla.

- När `LOGGER_TRANSPORT` är `file`, är standardvärdet `10`.
- När `LOGGER_TRANSPORT` är `dailyRotateFile`, används `[n]d` för att representera dagar. Standardvärdet är `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Roterar loggar efter storlek.

- När `LOGGER_TRANSPORT` är `file`, är enheten `byte`, och standardvärdet är `20971520 (20 * 1024 * 1024)`.
- När `LOGGER_TRANSPORT` är `dailyRotateFile`, kan ni använda `[n]k`, `[n]m`, `[n]g`. Inte konfigurerat som standard.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Loggutskriftsformat. Standardvärdet i utvecklingsmiljö är `console`, och i produktionsmiljö är `json`. Alternativ:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Se: [Loggformat](#)

## CACHE_DEFAULT_STORE

Den unika identifieraren för den cachelagringsmetod som ska användas, specificerar serverns standardcachelagringsmetod. Standardvärdet är `memory`, inbyggda alternativ:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Maximalt antal objekt i minnescachen, standardvärdet är `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Redis-anslutning, valfritt. Exempel: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Aktiverar insamling av telemetridata, standardvärdet är `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Aktiverade mätvärdesläsare för övervakning, standardvärdet är `console`. Andra värden ska hänvisa till de registrerade namnen på motsvarande plugin för läsare, som `prometheus`. Flera värden separeras med `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Aktiverade spårningsdatabehandlare, standardvärdet är `console`. Andra värden ska hänvisa till de registrerade namnen på motsvarande plugin för behandlare. Flera värden separeras med `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```