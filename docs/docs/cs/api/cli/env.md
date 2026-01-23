:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Globální proměnné prostředí

## TZ

Slouží k nastavení časového pásma aplikace. Výchozí hodnota je časové pásmo operačního systému.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operace související s časem budou zpracovávány podle tohoto časového pásma. Změna `TZ` může ovlivnit hodnoty dat v databázi. Podrobnosti naleznete v části '[Přehled dat a času](#)'
:::

## APP_ENV

Prostředí aplikace. Výchozí hodnota je `development`. Možnosti zahrnují:

- `production` – Produkční prostředí
- `development` – Vývojové prostředí

```bash
APP_ENV=production
```

## APP_KEY

Tajný klíč aplikace, který se používá k generování uživatelských tokenů a podobně. Změňte jej na svůj vlastní klíč aplikace a zajistěte, aby nebyl vyzrazen.

:::warning
Pokud změníte `APP_KEY`, staré tokeny se stanou neplatnými.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Port aplikace. Výchozí hodnota je `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Prefix adresy NocoBase API. Výchozí hodnota je `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Režim spouštění s více jádry (cluster). Pokud je tato proměnná nakonfigurována, bude předána příkazu `pm2 start` jako parametr `-i <instances>`. Možnosti jsou shodné s parametrem `pm2 -i` (viz [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)) a zahrnují:

- `max`: použije maximální počet jader CPU
- `-1`: použije maximální počet jader CPU minus 1
- `<number>`: určí počet jader

Výchozí hodnota je prázdná, což znamená, že režim není povolen.

:::warning{title="Poznámka"}
Tento režim je nutné používat ve spojení s pluginy souvisejícími s cluster režimem, jinak může dojít k abnormalitám ve funkčnosti aplikace.
:::

Více informací naleznete v části: [Režim clusteru](#).

## PLUGIN_PACKAGE_PREFIX

Prefix názvu balíčku **pluginu**. Výchozí hodnota je: `@nocobase/plugin-,@nocobase/preset-`.

Například, pokud chcete přidat **plugin** `hello` do projektu `my-nocobase-app`, celý název balíčku **pluginu** by byl `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` lze konfigurovat takto:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Pak je mapování mezi názvy **pluginů** a názvy balíčků následující:

- Název balíčku pro **plugin** `users` je `@nocobase/plugin-users`
- Název balíčku pro **plugin** `nocobase` je `@nocobase/preset-nocobase`
- Název balíčku pro **plugin** `hello` je `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Typ databáze. Možnosti zahrnují:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Hostitel databáze (vyžadováno při použití databáze MySQL nebo PostgreSQL).

Výchozí hodnota je `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Port databáze (vyžadováno při použití databáze MySQL nebo PostgreSQL).

- Výchozí port MySQL, MariaDB je 3306
- Výchozí port PostgreSQL je 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Název databáze (vyžadováno při použití databáze MySQL nebo PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Uživatel databáze (vyžadováno při použití databáze MySQL nebo PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Heslo k databázi (vyžadováno při použití databáze MySQL nebo PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Prefix tabulek databáze.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Určuje, zda se názvy databázových tabulek a polí převedou na styl snake case. Výchozí hodnota je `false`. Pokud používáte databázi MySQL (MariaDB) a `lower_case_table_names=1`, pak musí být `DB_UNDERSCORED` nastaveno na `true`.

:::warning
Pokud je `DB_UNDERSCORED=true`, skutečné názvy tabulek a polí v databázi nebudou odpovídat tomu, co vidíte v uživatelském rozhraní. Například `orderDetails` bude v databázi `order_details`.
:::

## DB_LOGGING

Přepínač pro logování databáze. Výchozí hodnota je `off`. Možnosti zahrnují:

- `on` – Povoleno
- `off` – Zakázáno

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Způsob výstupu logů. Více hodnot se odděluje čárkou `,`. Výchozí hodnota ve vývojovém prostředí je `console`, v produkčním prostředí `console,dailyRotateFile`. Možnosti:

- `console` - `console.log`
- `file` – `Soubor`
- `dailyRotateFile` – `Denně rotující soubor`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Cesta pro ukládání logů založených na souborech. Výchozí hodnota je `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Úroveň výstupu logů. Výchozí hodnota ve vývojovém prostředí je `debug`, v produkčním prostředí `info`. Možnosti:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Úroveň výstupu databázových logů je `debug` a to, zda se logy vypisují, je řízeno proměnnou `DB_LOGGING`, nikoli `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Maximální počet uchovávaných souborů s logy.

- Pokud je `LOGGER_TRANSPORT` nastaveno na `file`, výchozí hodnota je `10`.
- Pokud je `LOGGER_TRANSPORT` nastaveno na `dailyRotateFile`, použijte `[n]d` pro označení počtu dní. Výchozí hodnota je `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotace logů podle velikosti.

- Pokud je `LOGGER_TRANSPORT` nastaveno na `file`, jednotkou jsou `bajty` a výchozí hodnota je `20971520 (20 * 1024 * 1024)`.
- Pokud je `LOGGER_TRANSPORT` nastaveno na `dailyRotateFile`, můžete použít `[n]k`, `[n]m`, `[n]g`. Ve výchozím nastavení není konfigurováno.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Formát tisku logů. Výchozí hodnota ve vývojovém prostředí je `console`, v produkčním prostředí `json`. Možnosti:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Viz: [Formát logů](#)

## CACHE_DEFAULT_STORE

Jedinečný identifikátor pro úložiště mezipaměti, které se má použít, specifikující výchozí úložiště mezipaměti na straně serveru. Výchozí hodnota je `memory`. Vestavěné možnosti:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Maximální počet položek v paměťové mezipaměti. Výchozí hodnota je `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Připojení k Redis, volitelné. Příklad: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Povolit sběr telemetrických dat. Výchozí hodnota je `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Povolené čtečky monitorovacích metrik. Výchozí hodnota je `console`. Jiné hodnoty by se měly odkazovat na registrované názvy odpovídajících **pluginů** čteček, například `prometheus`. Více hodnot se odděluje čárkou `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Povolené procesory trasovacích dat. Výchozí hodnota je `console`. Jiné hodnoty by se měly odkazovat na registrované názvy odpovídajících **pluginů** procesorů. Více hodnot se odděluje čárkou `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```