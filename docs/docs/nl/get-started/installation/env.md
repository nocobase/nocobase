:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Omgevingsvariabelen

## Hoe stelt u omgevingsvariabelen in?

### Installatiemethode via Git-broncode of `create-nocobase-app`

Stel omgevingsvariabelen in het `.env`-bestand in de hoofdmap van het project in. Nadat u de omgevingsvariabelen hebt gewijzigd, moet u het applicatieproces beëindigen en opnieuw starten.

### Installatiemethode via Docker

Wijzig de `docker-compose.yml`-configuratie en stel de omgevingsvariabelen in via de `environment`-parameter. Voorbeeld:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

U kunt ook `env_file` gebruiken om omgevingsvariabelen in het `.env`-bestand in te stellen. Voorbeeld:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Nadat u de omgevingsvariabelen hebt gewijzigd, moet u de app-container opnieuw opbouwen.

```yml
docker compose up -d app
```

## Globale omgevingsvariabelen

### TZ

Wordt gebruikt om de tijdzone van de applicatie in te stellen. De standaardwaarde is de tijdzone van het besturingssysteem.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Tijdgerelateerde bewerkingen worden verwerkt op basis van deze tijdzone. Het wijzigen van TZ kan de datumwaarden in de database beïnvloeden. Raadpleeg voor meer details de [Overzicht Datum & Tijd](/data-sources/data-modeling/collection-fields/datetime).
:::

### APP_ENV

Applicatieomgeving, standaardwaarde `development`. Opties zijn onder andere:

- `production` productieomgeving
- `development` ontwikkelomgeving

```bash
APP_ENV=production
```

### APP_KEY

De geheime sleutel van de applicatie, gebruikt voor het genereren van gebruikerstokens, enz. Wijzig deze naar uw eigen applicatiesleutel en zorg ervoor dat deze niet uitlekt.

:::warning
Als de APP_KEY wordt gewijzigd, worden oude tokens ongeldig.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Applicatiepoort, standaardwaarde `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

NocoBase API-adresvoorvoegsel, standaardwaarde `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

De multi-core (cluster) opstartmodus. Als deze variabele is geconfigureerd, wordt deze doorgegeven aan het `pm2 start`-commando als de parameter `-i <instances>`. De opties komen overeen met de pm2 `-i`-parameter (zie [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), inclusief:

- `max`: Gebruik het maximale aantal CPU-kernen
- `-1`: Gebruik het maximale aantal CPU-kernen min één
- `<number>`: Specificeer het aantal kernen

De standaardwaarde is leeg, wat betekent dat de modus niet is ingeschakeld.

:::warning{title="Let op"}
Deze modus vereist het gebruik van plugins die gerelateerd zijn aan de clustermodus. Anders kan de functionaliteit van de applicatie onverwachte problemen ondervinden.
:::

Zie voor meer informatie: [Clustermodus](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Voorvoegsel van de plugin-pakketnaam, standaard is: `@nocobase/plugin-,@nocobase/preset-`.

Als u bijvoorbeeld de `hello` plugin toevoegt aan het `my-nocobase-app`-project, is de volledige pakketnaam van de plugin `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX kan worden geconfigureerd als:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

De correspondentie tussen plugin-naam en pakketnaam is als volgt:

- De pakketnaam van de `users` plugin is `@nocobase/plugin-users`
- De pakketnaam van de `nocobase` plugin is `@nocobase/preset-nocobase`
- De pakketnaam van de `hello` plugin is `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Databasetype, opties zijn onder andere:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Databasehost (vereist bij gebruik van MySQL- of PostgreSQL-databases).

Standaardwaarde `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Databasepoort (vereist bij gebruik van MySQL- of PostgreSQL-databases).

- Standaardpoort voor MySQL en MariaDB is 3306
- Standaardpoort voor PostgreSQL is 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Databasenaam (vereist bij gebruik van MySQL- of PostgreSQL-databases).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Databasegebruiker (vereist bij gebruik van MySQL- of PostgreSQL-databases).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Databasewachtwoord (vereist bij gebruik van MySQL- of PostgreSQL-databases).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Tabelvoorvoegsel.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Of databasetabel- en veldnamen worden geconverteerd naar snake_case-stijl, standaard is `false`. Als u een MySQL (MariaDB)-database gebruikt en `lower_case_table_names=1`, dan moet `DB_UNDERSCORED` op `true` worden ingesteld.

:::warning
Wanneer `DB_UNDERSCORED=true`, komen de werkelijke tabel- en veldnamen in de database niet overeen met wat in de gebruikersinterface wordt weergegeven. Bijvoorbeeld, `orderDetails` wordt in de database opgeslagen als `order_details`.
:::

### DB_LOGGING

Databaselogschakelaar, standaardwaarde `off`. Opties zijn onder andere:

- `on` aan
- `off` uit

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Maximaal aantal verbindingen in de databaseverbindingspool, standaardwaarde `5`.

### DB_POOL_MIN

Minimaal aantal verbindingen in de databaseverbindingspool, standaardwaarde `0`.

### DB_POOL_IDLE

Maximale inactiviteitstijd voor een verbinding in de databaseverbindingspool, standaardwaarde `10000` (10 seconden).

### DB_POOL_ACQUIRE

Maximale wachttijd voor de databaseverbindingspool om een verbinding te verkrijgen, standaardwaarde `60000` (60 seconden).

### DB_POOL_EVICT

De maximale levensduur van een verbinding in de databaseverbindingspool, standaardwaarde `1000` (1 seconde).

### DB_POOL_MAX_USES

Het aantal keren dat een verbinding kan worden gebruikt voordat deze wordt weggegooid en vervangen, standaardwaarde `0` (onbeperkt).

### LOGGER_TRANSPORT

Loguitvoermethode, meerdere waarden gescheiden door `,`. Standaard is `console` in de ontwikkelomgeving, `console,dailyRotateFile` in de productieomgeving.
Opties:

- `console` - `console.log`
- `file` - Uitvoer naar een bestand
- `dailyRotateFile` - Uitvoer naar dagelijks roterende bestanden

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Bestandsgebaseerd logopslagpad, standaard is `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Uitvoerlogniveau. Standaard is `debug` in de ontwikkelomgeving en `info` in de productieomgeving. Opties:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Het uitvoerniveau van databaselogboeken is `debug`, en wordt geregeld door `DB_LOGGING`, niet beïnvloed door `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Maximaal aantal te bewaren logbestanden.

- Wanneer `LOGGER_TRANSPORT` `file` is: Standaardwaarde is `10`.
- Wanneer `LOGGER_TRANSPORT` `dailyRotateFile` is: Gebruik `[n]d` om dagen aan te geven. Standaardwaarde is `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Logrotatie op basis van grootte.

- Wanneer `LOGGER_TRANSPORT` `file` is: Eenheid is `byte`. Standaardwaarde is `20971520 (20 * 1024 * 1024)`.
- Wanneer `LOGGER_TRANSPORT` `dailyRotateFile` is: U kunt `[n]k`, `[n]m`, `[n]g` gebruiken. Standaard niet geconfigureerd.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Logprintfunctie. Standaard is `console` in de ontwikkelomgeving en `json` in de productieomgeving. Opties:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referentie: [Logformaat](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Unieke identificatie voor de cachemethode, specificeert de standaard servercachemethode, standaardwaarde `memory`. Ingebouwde opties zijn:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Maximaal aantal items in de geheugencache, standaardwaarde `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Redis-verbinding, optioneel. Voorbeeld: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Schakel het verzamelen van telemetriegegevens in, standaard is `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Ingeschakelde monitoring-metriekverzamelaars, standaard is `console`. Andere waarden moeten verwijzen naar de namen die zijn geregistreerd door de corresponderende verzamelaar-plugins, zoals `prometheus`. Meerdere waarden worden gescheiden door `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Ingeschakelde traceergegevensprocessors, standaard is `console`. Andere waarden moeten verwijzen naar de namen die zijn geregistreerd door de corresponderende processor-plugins. Meerdere waarden worden gescheiden door `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Experimentele omgevingsvariabelen

### APPEND_PRESET_LOCAL_PLUGINS

Wordt gebruikt om vooraf ingestelde, niet-geactiveerde plugins toe te voegen. De waarde is de pakketnaam van de plugin (de `name`-parameter in `package.json`), met meerdere plugins gescheiden door komma's.

:::info
1. Zorg ervoor dat de plugin lokaal is gedownload en kan worden gevonden in de `node_modules`-map. Raadpleeg voor meer details de [Plugin-organisatie](/plugin-development/project-structure).
2. Nadat de omgevingsvariabele is toegevoegd, verschijnt de plugin pas op de pluginbeheerpagina na een initiële installatie (`nocobase install`) of upgrade (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Wordt gebruikt om ingebouwde en standaard geïnstalleerde plugins toe te voegen. De waarde is de pakketnaam van de plugin (de `name`-parameter in `package.json`), met meerdere plugins gescheiden door komma's.

:::info
1. Zorg ervoor dat de plugin lokaal is gedownload en kan worden gevonden in de `node_modules`-map. Raadpleeg voor meer details de [Plugin-organisatie](/plugin-development/project-structure).
2. Nadat de omgevingsvariabele is toegevoegd, wordt de plugin automatisch geïnstalleerd of geüpgraded tijdens de initiële installatie (`nocobase install`) of upgrade (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Tijdelijke omgevingsvariabelen

Bij het installeren van NocoBase kunt u tijdelijke omgevingsvariabelen instellen om de installatie te vergemakkelijken, zoals:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Gelijk aan
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Gelijk aan
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Taal tijdens de installatie, standaardwaarde `en-US`. Opties zijn onder andere:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

E-mailadres van de root-gebruiker.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Wachtwoord van de root-gebruiker.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Bijnaam van de root-gebruiker.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```