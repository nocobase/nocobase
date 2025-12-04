:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Globale Omgevingsvariabelen

## TZ

Gebruikt om de tijdzone van de applicatie in te stellen. Standaard wordt de tijdzone van het besturingssysteem gebruikt.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Tijdgerelateerde bewerkingen worden verwerkt volgens deze tijdzone. Het wijzigen van TZ kan invloed hebben op datumwaarden in de database. Voor meer details, zie '[Overzicht Datum & Tijd](#)'
:::

## APP_ENV

De applicatie-omgeving. De standaardwaarde is `development`. Opties zijn onder andere:

- `production` Productieomgeving
- `development` Ontwikkelomgeving

```bash
APP_ENV=production
```

## APP_KEY

De geheime sleutel van de applicatie, gebruikt voor het genereren van gebruikerstokens en dergelijke. Wijzig deze naar uw eigen applicatiesleutel en zorg ervoor dat deze niet openbaar wordt gemaakt.

:::warning
Als de APP_KEY wordt gewijzigd, worden oude tokens ongeldig.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

De applicatiepoort. De standaardwaarde is `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Het voorvoegsel van het NocoBase API-adres. De standaardwaarde is `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

De opstartmodus voor meerdere kernen (cluster). Als deze variabele is geconfigureerd, wordt deze doorgegeven aan het `pm2 start` commando als de `-i <instances>` parameter. De opties komen overeen met de pm2 `-i` parameter (zie [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), waaronder:

- `max`: gebruik het maximale aantal CPU-kernen
- `-1`: gebruik het maximale aantal CPU-kernen min 1
- `<number>`: specificeer het aantal kernen

De standaardwaarde is leeg, wat betekent dat deze niet is ingeschakeld.

:::warning{title="Let op"}
Deze modus moet worden gebruikt in combinatie met **plugin**s die gerelateerd zijn aan de clustermodus, anders kan de functionaliteit van de applicatie afwijken.
:::

Voor meer informatie, zie: [Clustermodus](#).

## PLUGIN_PACKAGE_PREFIX

Het voorvoegsel van de **plugin**-pakketnaam. Standaard is dit: `@nocobase/plugin-,@nocobase/preset-`.

Als u bijvoorbeeld de `hello` **plugin** wilt toevoegen aan het `my-nocobase-app` project, dan is de volledige pakketnaam van de **plugin** `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX kan worden geconfigureerd als:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

De koppeling tussen **plugin**-namen en pakketnamen is dan als volgt:

- De pakketnaam voor de `users` **plugin** is `@nocobase/plugin-users`
- De pakketnaam voor de `nocobase` **plugin** is `@nocobase/preset-nocobase`
- De pakketnaam voor de `hello` **plugin** is `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Het databasetype. Opties zijn onder andere:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

De databasehost (vereist bij gebruik van een MySQL- of PostgreSQL-database).

De standaardwaarde is `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

De databasepoort (vereist bij gebruik van een MySQL- of PostgreSQL-database).

- Standaardpoort MySQL, MariaDB: 3306
- Standaardpoort PostgreSQL: 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

De databasenaam (vereist bij gebruik van een MySQL- of PostgreSQL-database).

```bash
DB_DATABASE=nocobase
```

## DB_USER

De databasegebruiker (vereist bij gebruik van een MySQL- of PostgreSQL-database).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Het databasewachtwoord (vereist bij gebruik van een MySQL- of PostgreSQL-database).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Het tabelvoorvoegsel.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Of databasetabelnamen en veldnamen moeten worden omgezet naar snake_case-stijl. De standaardwaarde is `false`. Als u een MySQL (MariaDB) database gebruikt en `lower_case_table_names=1`, dan moet DB_UNDERSCORED `true` zijn.

:::warning
Wanneer `DB_UNDERSCORED=true`, komen de werkelijke tabel- en veldnamen in de database niet overeen met wat u in de interface ziet. Zo zal `orderDetails` in de database `order_details` zijn.
:::

## DB_LOGGING

De schakelaar voor databaselogging. De standaardwaarde is `off`. Opties zijn onder andere:

- `on` Ingeschakeld
- `off` Uitgeschakeld

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

De manier waarop logs worden uitgevoerd. Meerdere waarden worden gescheiden door `,`. De standaardwaarde in de ontwikkelomgeving is `console`, en in de productieomgeving is dit `console,dailyRotateFile`. Opties:

- `console` - `console.log`
- `file` - `Bestand`
- `dailyRotateFile` - `Dagelijks roterend bestand`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Het opslagpad voor bestandsgebaseerde logs. Standaard is dit `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Het logniveau voor de uitvoer. De standaardwaarde in de ontwikkelomgeving is `debug`, en in de productieomgeving is dit `info`. Opties:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Het logniveau voor database-uitvoer is `debug`. Of dit wordt uitgevoerd, wordt bepaald door `DB_LOGGING` en wordt niet beïnvloed door `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Het maximale aantal te bewaren logbestanden.

- Wanneer `LOGGER_TRANSPORT` `file` is, is de standaardwaarde `10`.
- Wanneer `LOGGER_TRANSPORT` `dailyRotateFile` is, gebruikt u `[n]d` om dagen aan te geven. De standaardwaarde is `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Logs roteren op basis van grootte.

- Wanneer `LOGGER_TRANSPORT` `file` is, is de eenheid `byte`, en de standaardwaarde is `20971520 (20 * 1024 * 1024)`.
- Wanneer `LOGGER_TRANSPORT` `dailyRotateFile` is, kunt u `[n]k`, `[n]m`, `[n]g` gebruiken. Standaard niet geconfigureerd.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Het logprintformaat. De standaardwaarde in de ontwikkelomgeving is `console`, en in de productieomgeving is dit `json`. Opties:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Zie: [Logformaat](#)

## CACHE_DEFAULT_STORE

De unieke identificatie voor de te gebruiken cacheopslag, waarmee de standaard cacheopslag aan de serverzijde wordt gespecificeerd. De standaardwaarde is `memory`. Ingebouwde opties:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Het maximale aantal items in de geheugencache. De standaardwaarde is `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Redis-verbinding, optioneel. Voorbeeld: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Schakel het verzamelen van telemetriegegevens in. Standaard is dit `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Ingeschakelde monitoring-metrieklezers. Standaard is dit `console`. Andere waarden moeten verwijzen naar de geregistreerde namen van de corresponderende lezer-**plugin**s, zoals `prometheus`. Meerdere waarden worden gescheiden door `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Ingeschakelde trace-gegevensprocessors. Standaard is dit `console`. Andere waarden moeten verwijzen naar de geregistreerde namen van de corresponderende processor-**plugin**s. Meerdere waarden worden gescheiden door `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```