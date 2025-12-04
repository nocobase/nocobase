:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Miljövariabler

## Hur ställer ni in miljövariabler?

### Installation via Git-källkod eller `create-nocobase-app`

Ställ in miljövariabler i filen `.env` som ligger i projektets rotkatalog. Efter att ni har ändrat miljövariablerna behöver ni avsluta applikationsprocessen och starta om den.

### Installation via Docker

Ändra konfigurationen i `docker-compose.yml` och ställ in miljövariablerna under parametern `environment`. Exempel:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Ni kan också använda `env_file` för att ställa in miljövariabler i filen `.env`. Exempel:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Efter att ni har ändrat miljövariablerna behöver ni bygga om app-containern:

```yml
docker compose up -d app
```

## Globala miljövariabler

### TZ

Används för att ställa in applikationens tidszon. Standard är systemets tidszon.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Tidsrelaterade operationer hanteras enligt denna tidszon. Att ändra TZ kan påverka datumvärden i databasen. För mer information, se "[Översikt över datum och tid](/data-sources/data-modeling/collection-fields/datetime)".
:::

### APP_ENV

Applikationsmiljö. Standardvärdet är `development`. Alternativen inkluderar:

- `production` produktionsmiljö
- `development` utvecklingsmiljö

```bash
APP_ENV=production
```

### APP_KEY

Applikationens hemliga nyckel, som används för att generera användartokens med mera. Ändra den till er egen applikationsnyckel och se till att den inte läcker ut.

:::warning
Om APP_KEY ändras kommer gamla tokens att bli ogiltiga.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Applikationsport. Standardvärdet är `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

NocoBase API-adressprefix. Standardvärdet är `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Flera kärnor (kluster) startläge. Om denna variabel konfigureras, kommer den att skickas vidare till kommandot `pm2 start` som parametern `-i <instances>`. Alternativen är desamma som för pm2:s `-i` parameter (se [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), inklusive:

- `max`: Använd maximalt antal CPU-kärnor
- `-1`: Använd maximalt antal CPU-kärnor minus en
- `<number>`: Ange antal kärnor

Standardvärdet är tomt, vilket innebär att det inte är aktiverat.

:::warning{title="Obs"}
Detta läge kräver att ni använder **plugin**-program relaterade till klusterläge. Annars kan applikationens funktionalitet uppvisa oväntade problem.
:::

För mer information, se: [Klusterläge](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Prefix för **plugin**-paketnamn. Standard är `@nocobase/plugin-,@nocobase/preset-`.

Om ni till exempel lägger till `hello` **plugin**-programmet i projektet `my-nocobase-app`, blir **plugin**-programmets fullständiga paketnamn `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX kan konfigureras som:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Då blir motsvarigheten mellan **plugin**-namn och paketnamn följande:

- `users` **plugin**-programmets paketnamn är `@nocobase/plugin-users`
- `nocobase` **plugin**-programmets paketnamn är `@nocobase/preset-nocobase`
- `hello` **plugin**-programmets paketnamn är `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Databastyp. Alternativen inkluderar:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Databasvärd (krävs vid användning av MySQL- eller PostgreSQL-databaser).

Standardvärdet är `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Databasport (krävs vid användning av MySQL- eller PostgreSQL-databaser).

- Standardport för MySQL och MariaDB är 3306
- Standardport för PostgreSQL är 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Databasnamn (krävs vid användning av MySQL- eller PostgreSQL-databaser).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Databasanvändare (krävs vid användning av MySQL- eller PostgreSQL-databaser).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Databaslösenord (krävs vid användning av MySQL- eller PostgreSQL-databaser).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Prefix för datatabeller.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Om databastabell- och fältnamn ska konverteras till snake case-stil. Standard är `false`. Om ni använder en MySQL- (MariaDB-) databas med `lower_case_table_names=1`, måste `DB_UNDERSCORED` vara inställt på `true`.

:::warning
När `DB_UNDERSCORED=true` kommer de faktiska tabell- och fältnamnen i databasen inte att matcha det som visas i användargränssnittet. Till exempel kommer `orderDetails` att lagras som `order_details` i databasen.
:::

### DB_LOGGING

Databasloggväxel. Standardvärdet är `off`. Alternativen inkluderar:

- `on` på
- `off` av

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Maximalt antal anslutningar i databasens anslutningspool. Standardvärdet är `5`.

### DB_POOL_MIN

Minimalt antal anslutningar i databasens anslutningspool. Standardvärdet är `0`.

### DB_POOL_IDLE

Maximal tid, i millisekunder, som en anslutning kan vara inaktiv innan den släpps. Standardvärdet är `10000` (10 sekunder).

### DB_POOL_ACQUIRE

Maximal tid, i millisekunder, som poolen försöker hämta en anslutning innan ett fel kastas. Standardvärdet är `60000` (60 sekunder).

### DB_POOL_EVICT

Tidsintervallet, i millisekunder, efter vilket anslutningspoolen tar bort inaktiva anslutningar. Standardvärdet är `1000` (1 sekund).

### DB_POOL_MAX_USES

Antal gånger en anslutning kan användas innan den kasseras och ersätts. Standardvärdet är `0` (obegränsat).

### LOGGER_TRANSPORT

Metod för loggutdata, flera värden separeras med `,`. Standard är `console` i utvecklingsmiljö och `console,dailyRotateFile` i produktionsmiljö.
Alternativ:

- `console` - `console.log`
- `file` - Utdata till en fil
- `dailyRotateFile` - Utdata till dagligen roterande filer

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Filsökväg för logglagring. Standard är `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Utdata loggnivå. Standard är `debug` i utvecklingsmiljö och `info` i produktionsmiljö. Alternativ:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Databasens loggnivå är `debug`, kontrolleras av `DB_LOGGING` och påverkas inte av `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Maximalt antal loggfiler att behålla.

- När `LOGGER_TRANSPORT` är `file`: Standardvärdet är `10`.
- När `LOGGER_TRANSPORT` är `dailyRotateFile`: Använd `[n]d` för att representera dagar. Standardvärdet är `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Loggrotation efter storlek.

- När `LOGGER_TRANSPORT` är `file`: Enheten är `byte`. Standardvärdet är `20971520 (20 * 1024 * 1024)`.
- När `LOGGER_TRANSPORT` är `dailyRotateFile`: Ni kan använda `[n]k`, `[n]m`, `[n]g`. Standard är inte konfigurerat.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Loggformat. Standard är `console` i utvecklingsmiljö och `json` i produktionsmiljö. Alternativ:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referens: [Loggformat](/log-and-monitor/logger/index.md#loggformat)

### CACHE_DEFAULT_STORE

Unik identifierare för cachelagringsmetoden, som anger serverns standardcache. Standardvärdet är `memory`. Inbyggda alternativ inkluderar:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Maximalt antal objekt i minnescachen. Standardvärdet är `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Redis-anslutnings-URL, valfritt. Exempel: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Aktivera insamling av telemetridata. Standard är `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Aktiverade mätvärdesinsamlare för övervakning. Standard är `console`. Andra värden bör hänvisa till namnen som registrerats av motsvarande **plugin**-program för insamlare, till exempel `prometheus`. Flera värden separeras med `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Aktiverade spårdatahanterare. Standard är `console`. Andra värden bör hänvisa till namnen som registrerats av motsvarande **plugin**-program för hanterare. Flera värden separeras med `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Experimentella miljövariabler

### APPEND_PRESET_LOCAL_PLUGINS

Används för att lägga till förinställda lokala **plugin**-program som inte är aktiverade. Värdet är **plugin**-programmets paketnamn (parametern `name` i `package.json`), med flera **plugin**-program separerade med kommatecken.

:::info
1. Se till att **plugin**-programmet har laddats ner lokalt och kan hittas i katalogen `node_modules`. För mer information, se [**Plugin**-programmets struktur](/plugin-development/project-structure).
2. Efter att miljövariabeln har lagts till kommer **plugin**-programmet att visas på **plugin**-hanterarens sida först efter en initial installation (`nocobase install`) eller uppgradering (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Används för att lägga till inbyggda **plugin**-program som installeras som standard. Värdet är **plugin**-programmets paketnamn (parametern `name` i `package.json`), med flera **plugin**-program separerade med kommatecken.

:::info
1. Se till att **plugin**-programmet har laddats ner lokalt och kan hittas i katalogen `node_modules`. För mer information, se [**Plugin**-programmets struktur](/plugin-development/project-structure).
2. Efter att miljövariabeln har lagts till kommer **plugin**-programmet att installeras eller uppgraderas automatiskt under den initiala installationen (`nocobase install`) eller uppgraderingen (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Tillfälliga miljövariabler

Vid installation av NocoBase kan ni underlätta installationen genom att ställa in tillfälliga miljövariabler, till exempel:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# 等同于
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# 等同于
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Språk vid installationstillfället. Standardvärdet är `en-US`. Alternativen inkluderar:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

E-postadress för Root-användare.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Lösenord för Root-användare.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Smeknamn för Root-användare.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```