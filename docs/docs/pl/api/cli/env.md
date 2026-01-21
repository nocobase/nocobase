:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Globalne zmienne środowiskowe

## TZ

Służy do ustawienia strefy czasowej aplikacji. Domyślnie jest to strefa czasowa systemu operacyjnego.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operacje związane z czasem będą przetwarzane zgodnie z tą strefą czasową. Zmiana zmiennej `TZ` może wpłynąć na wartości dat w bazie danych. Szczegóły znajdą Państwo w sekcji '[Przegląd dat i czasu](#)'
:::

## APP_ENV

Środowisko aplikacji. Domyślna wartość to `development`. Dostępne opcje to:

- `production` – środowisko produkcyjne
- `development` – środowisko deweloperskie

```bash
APP_ENV=production
```

## APP_KEY

Klucz tajny aplikacji, używany do generowania tokenów użytkowników itp. Proszę zmienić go na własny klucz aplikacji i upewnić się, że nie zostanie ujawniony.

:::warning
Jeśli `APP_KEY` zostanie zmieniony, stare tokeny staną się nieważne.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Port aplikacji. Domyślna wartość to `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Prefiks adresu API NocoBase. Domyślna wartość to `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Tryb uruchamiania wielordzeniowego (klastrowego). Jeśli ta zmienna zostanie skonfigurowana, zostanie przekazana do polecenia `pm2 start` jako parametr `-i <instances>`. Opcje są zgodne z parametrem `-i` PM2 (zobacz [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), w tym:

- `max`: używa maksymalnej liczby rdzeni CPU
- `-1`: używa maksymalnej liczby rdzeni CPU minus 1
- `<number>`: określa liczbę rdzeni

Domyślna wartość jest pusta, co oznacza, że tryb nie jest włączony.

:::warning{title="Uwaga"}
Ten tryb wymaga użycia wtyczek związanych z trybem klastrowym, w przeciwnym razie funkcjonalność aplikacji może działać nieprawidłowo.
:::

Więcej informacji znajdą Państwo w sekcji: [Tryb klastrowy](#).

## PLUGIN_PACKAGE_PREFIX

Prefiks nazwy pakietu wtyczki. Domyślnie: `@nocobase/plugin-,@nocobase/preset-`.

Na przykład, aby dodać wtyczkę `hello` do projektu `my-nocobase-app`, pełna nazwa pakietu wtyczki to `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` można skonfigurować jako:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Wówczas mapowanie między nazwami wtyczek a nazwami pakietów wygląda następująco:

- Nazwa pakietu dla wtyczki `users` to `@nocobase/plugin-users`
- Nazwa pakietu dla wtyczki `nocobase` to `@nocobase/preset-nocobase`
- Nazwa pakietu dla wtyczki `hello` to `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Typ bazy danych. Dostępne opcje to:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Host bazy danych (wymagany przy użyciu bazy danych MySQL lub PostgreSQL).

Domyślna wartość to `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Port bazy danych (wymagany przy użyciu bazy danych MySQL lub PostgreSQL).

- Domyślny port MySQL, MariaDB: 3306
- Domyślny port PostgreSQL: 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Nazwa bazy danych (wymagana przy użyciu bazy danych MySQL lub PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Użytkownik bazy danych (wymagany przy użyciu bazy danych MySQL lub PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Hasło do bazy danych (wymagane przy użyciu bazy danych MySQL lub PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Prefiks tabeli.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Czy konwertować nazwy tabel i pól bazy danych na styl snake_case. Domyślnie `false`. Jeśli używają Państwo bazy danych MySQL (MariaDB) i `lower_case_table_names=1`, wówczas `DB_UNDERSCORED` musi mieć wartość `true`.

:::warning
Gdy `DB_UNDERSCORED=true`, rzeczywiste nazwy tabel i pól w bazie danych nie będą zgodne z tym, co widać w interfejsie. Na przykład `orderDetails` w bazie danych będzie `order_details`.
:::

## DB_LOGGING

Przełącznik logowania bazy danych. Domyślna wartość to `off`. Dostępne opcje to:

- `on` – włączone
- `off` – wyłączone

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Sposób wyprowadzania logów. Wiele wartości należy oddzielić przecinkami. Domyślna wartość w środowisku deweloperskim to `console`, a w środowisku produkcyjnym `console,dailyRotateFile`. Opcje:

- `console` – `console.log`
- `file` – `Plik`
- `dailyRotateFile` – `Plik rotowany dziennie`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Ścieżka przechowywania logów opartych na plikach. Domyślnie `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Poziom wyprowadzania logów. Domyślna wartość w środowisku deweloperskim to `debug`, a w środowisku produkcyjnym `info`. Opcje:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Poziom wyprowadzania logów bazy danych to `debug`. To, czy są one wyprowadzane, jest kontrolowane przez `DB_LOGGING` i nie zależy od `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Maksymalna liczba przechowywanych plików logów.

- Gdy `LOGGER_TRANSPORT` to `file`, domyślna wartość to `10`.
- Gdy `LOGGER_TRANSPORT` to `dailyRotateFile`, użyj `[n]d` do reprezentowania dni. Domyślna wartość to `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotacja logów według rozmiaru.

- Gdy `LOGGER_TRANSPORT` to `file`, jednostką jest `bajt`, a domyślna wartość to `20971520 (20 * 1024 * 1024)`.
- Gdy `LOGGER_TRANSPORT` to `dailyRotateFile`, można użyć `[n]k`, `[n]m`, `[n]g`. Domyślnie nie jest skonfigurowane.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Format drukowania logów. Domyślny w środowisku deweloperskim to `console`, a w środowisku produkcyjnym `json`. Opcje:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Zobacz: [Format logów](#)

## CACHE_DEFAULT_STORE

Unikalny identyfikator dla używanego magazynu pamięci podręcznej, określający domyślny magazyn pamięci podręcznej po stronie serwera. Domyślna wartość to `memory`. Wbudowane opcje:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Maksymalna liczba elementów w pamięci podręcznej. Domyślna wartość to `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Połączenie Redis, opcjonalne. Przykład: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Włącza zbieranie danych telemetrycznych. Domyślnie `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Włączone czytniki metryk monitorowania. Domyślnie `console`. Inne wartości powinny odnosić się do zarejestrowanych nazw odpowiednich wtyczek czytników, takich jak `prometheus`. Wiele wartości należy oddzielić przecinkami.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Włączone procesory danych śledzenia. Domyślnie `console`. Inne wartości powinny odnosić się do zarejestrowanych nazw odpowiednich wtyczek procesorów. Wiele wartości należy oddzielić przecinkami.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```