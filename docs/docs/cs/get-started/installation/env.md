:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Proměnné prostředí

## Jak nastavit proměnné prostředí?

### Způsob instalace ze zdrojového kódu Git nebo pomocí `create-nocobase-app`

Proměnné prostředí nastavte v souboru `.env` v kořenovém adresáři projektu. Po úpravě proměnných prostředí je potřeba ukončit proces aplikace a znovu ji spustit.

### Způsob instalace pomocí Dockeru

Upravte konfiguraci `docker-compose.yml` a nastavte proměnné prostředí v parametru `environment`. Příklad:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Můžete také použít `env_file`, což vám umožní nastavit proměnné prostředí v souboru `.env`. Příklad:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Po úpravě proměnných prostředí je potřeba znovu sestavit kontejner aplikace:

```yml
docker compose up -d app
```

## Globální proměnné prostředí

### TZ

Slouží k nastavení časového pásma aplikace. Výchozí hodnota je časové pásmo operačního systému.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operace související s časem se budou zpracovávat podle tohoto časového pásma. Změna TZ může ovlivnit hodnoty dat v databázi. Více podrobností naleznete v části „[Přehled data a času](/data-sources/data-modeling/collection-fields/datetime)“.
:::

### APP_ENV

Prostředí aplikace. Výchozí hodnota je `development`. Možnosti zahrnují:

- `production` produkční prostředí
- `development` vývojové prostředí

```bash
APP_ENV=production
```

### APP_KEY

Tajný klíč aplikace, který se používá například pro generování uživatelských tokenů. Změňte jej na vlastní klíč aplikace a zajistěte, aby nebyl vyzrazen.

:::warning
Pokud změníte `APP_KEY`, staré tokeny se stanou neplatnými.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Port aplikace. Výchozí hodnota je `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Prefix adresy NocoBase API. Výchozí hodnota je `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Režim spouštění s více jádry (cluster). Pokud je tato proměnná nakonfigurována, bude předána příkazu `pm2 start` jako parametr `-i <instances>`. Možnosti jsou shodné s parametrem `pm2 -i` (viz [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), včetně:

- `max`: Použije maximální počet jader CPU
- `-1`: Použije maximální počet jader CPU minus jedna
- `<number>`: Určí počet jader

Výchozí hodnota je prázdná, což znamená, že režim není povolen.

:::warning{title="Pozor"}
Tento režim vyžaduje použití pluginů souvisejících s clusterovým režimem. V opačném případě může funkčnost aplikace narazit na neočekávané problémy.
:::

Více informací naleznete v části [Clusterový režim](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Prefix balíčku pluginu. Výchozí hodnota je `@nocobase/plugin-,@nocobase/preset-`.

Například pro přidání pluginu `hello` do projektu `my-nocobase-app` by byl úplný název balíčku pluginu `@my-nocobase-app/plugin-hello`.

Proměnnou `PLUGIN_PACKAGE_PREFIX` lze nakonfigurovat takto:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Korespondence mezi názvem pluginu a názvem balíčku je následující:

- Název balíčku pro `users` plugin je `@nocobase/plugin-users`
- Název balíčku pro `nocobase` plugin je `@nocobase/preset-nocobase`
- Název balíčku pro `hello` plugin je `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Typ databáze. Možnosti zahrnují:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Hostitel databáze (vyžadováno při použití databází MySQL nebo PostgreSQL).

Výchozí hodnota je `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Port databáze (vyžadováno při použití databází MySQL nebo PostgreSQL).

- Výchozí port pro MySQL a MariaDB je 3306
- Výchozí port pro PostgreSQL je 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Název databáze (vyžadováno při použití databází MySQL nebo PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Uživatel databáze (vyžadováno při použití databází MySQL nebo PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Heslo k databázi (vyžadováno při použití databází MySQL nebo PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Prefix databázových tabulek.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Určuje, zda se názvy databázových tabulek a polí převádějí na styl snake case. Výchozí hodnota je `false`. Pokud používáte databázi MySQL (MariaDB) s `lower_case_table_names=1`, pak musí být `DB_UNDERSCORED` nastaveno na `true`.

:::warning
Když je `DB_UNDERSCORED=true`, skutečné názvy tabulek a polí v databázi se nebudou shodovat s tím, co je zobrazeno v uživatelském rozhraní. Například `orderDetails` bude v databázi uloženo jako `order_details`.
:::

### DB_LOGGING

Přepínač logování databáze. Výchozí hodnota je `off`. Možnosti zahrnují:

- `on` zapnuto
- `off` vypnuto

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Maximální počet připojení v poolu databázových připojení. Výchozí hodnota je `5`.

### DB_POOL_MIN

Minimální počet připojení v poolu databázových připojení. Výchozí hodnota je `0`.

### DB_POOL_IDLE

Maximální doba, v milisekundách, po kterou může být připojení nečinné, než bude uvolněno. Výchozí hodnota je `10000` (10 sekund).

### DB_POOL_ACQUIRE

Maximální doba, v milisekundách, po kterou se pool pokusí získat připojení, než vyvolá chybu. Výchozí hodnota je `60000` (60 sekund).

### DB_POOL_EVICT

Časový interval, v milisekundách, po kterém pool připojení odstraní nečinná připojení. Výchozí hodnota je `1000` (1 sekunda).

### DB_POOL_MAX_USES

Počet použití připojení předtím, než je zahozeno a nahrazeno. Výchozí hodnota je `0` (bez omezení).

### LOGGER_TRANSPORT

Metoda výstupu logů. Více hodnot oddělte čárkou `,`. Ve vývojovém prostředí je výchozí hodnota `console`, v produkčním prostředí `console,dailyRotateFile`.
Možnosti:

- `console` - `console.log`
- `file` - Výstup do souboru
- `dailyRotateFile` - Výstup do souborů rotujících denně

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Cesta k úložišti logů založenému na souborech. Výchozí hodnota je `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Úroveň výstupu logů. Ve vývojovém prostředí je výchozí hodnota `debug`, v produkčním prostředí `info`. Možnosti:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Úroveň výstupu logů databáze je `debug`, je řízena proměnnou `DB_LOGGING` a není ovlivněna proměnnou `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Maximální počet uchovávaných souborů logů.

- Pokud je `LOGGER_TRANSPORT` nastaveno na `file`, výchozí hodnota je `10`.
- Pokud je `LOGGER_TRANSPORT` nastaveno na `dailyRotateFile`, použijte `[n]d` pro počet dní. Výchozí hodnota je `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Rotace logů podle velikosti.

- Pokud je `LOGGER_TRANSPORT` nastaveno na `file`, jednotkou jsou `byte`. Výchozí hodnota je `20971520 (20 * 1024 * 1024)`.
- Pokud je `LOGGER_TRANSPORT` nastaveno na `dailyRotateFile`, můžete použít `[n]k`, `[n]m`, `[n]g`. Ve výchozím nastavení není konfigurováno.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Formát tisku logů. Ve vývojovém prostředí je výchozí `console`, v produkčním prostředí `json`. Možnosti:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Odkaz: [Formát logů](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Jedinečný identifikátor pro metodu ukládání do mezipaměti, specifikující výchozí metodu mezipaměti serveru. Výchozí hodnota je `memory`. Vestavěné možnosti zahrnují:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Maximální počet položek v paměťové mezipaměti. Výchozí hodnota je `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

URL připojení k Redis, volitelné. Příklad: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Povolit sběr telemetrických dat. Výchozí hodnota je `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Povolení sběrači metrik monitorování. Výchozí hodnota je `console`. Ostatní hodnoty by se měly odkazovat na názvy registrované odpovídajícími pluginy sběračů, například `prometheus`. Více hodnot oddělte čárkou `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Povolení procesory trasovacích dat. Výchozí hodnota je `console`. Ostatní hodnoty by se měly odkazovat na názvy registrované odpovídajícími pluginy procesorů. Více hodnot oddělte čárkou `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Experimentální proměnné prostředí

### APPEND_PRESET_LOCAL_PLUGINS

Slouží k připojení přednastavených lokálních pluginů. Hodnotou je název balíčku (parametr `name` v `package.json`), více pluginů oddělte čárkou.

:::info
1. Ujistěte se, že je plugin stažen lokálně a lze jej najít v adresáři `node_modules`. Více podrobností naleznete v části [Organizace pluginů](/plugin-development/project-structure).
2. Po přidání proměnné prostředí se plugin zobrazí na stránce správce pluginů až po počáteční instalaci (`nocobase install`) nebo aktualizaci (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Slouží k připojení vestavěných pluginů, které jsou nainstalovány ve výchozím nastavení. Hodnotou je název balíčku (parametr `name` v `package.json`), více pluginů oddělte čárkou.

:::info
1. Ujistěte se, že je plugin stažen lokálně a lze jej najít v adresáři `node_modules`. Více podrobností naleznete v části [Organizace pluginů](/plugin-development/project-structure).
2. Po přidání proměnné prostředí bude plugin automaticky nainstalován nebo aktualizován během počáteční instalace (`nocobase install`) nebo aktualizace (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Dočasné proměnné prostředí

Instalaci NocoBase lze usnadnit nastavením dočasných proměnných prostředí, například:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Rovná se
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Rovná se
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Jazyk v době instalace. Výchozí hodnota je `en-US`. Možnosti zahrnují:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

E-mail uživatele Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Heslo uživatele Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Přezdívka uživatele Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```