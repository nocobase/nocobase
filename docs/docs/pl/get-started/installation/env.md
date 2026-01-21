:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zmienne środowiskowe

## Jak ustawić zmienne środowiskowe?

### Metoda instalacji z kodu źródłowego Git lub `create-nocobase-app`

Zmienne środowiskowe ustawia się w pliku `.env` znajdującym się w katalogu głównym projektu. Po ich zmianie należy zatrzymać proces aplikacji i uruchomić ją ponownie.

### Metoda instalacji Docker

Należy zmodyfikować konfigurację w pliku `docker-compose.yml` i ustawić zmienne środowiskowe w parametrze `environment`. Przykład:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Można również użyć `env_file`, aby ustawić zmienne środowiskowe w pliku `.env`. Przykład:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Po zmianie zmiennych środowiskowych należy przebudować kontener aplikacji:

```yml
docker compose up -d app
```

## Globalne zmienne środowiskowe

### TZ

Służy do ustawienia strefy czasowej aplikacji. Domyślnie używana jest strefa czasowa systemu operacyjnego.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operacje związane z czasem będą przetwarzane zgodnie z tą strefą czasową. Zmiana TZ może wpłynąć na wartości dat w bazie danych. Więcej szczegółów znajdą Państwo w [Przeglądzie dat i czasu](/data-sources/data-modeling/collection-fields/datetime).
:::

### APP_ENV

Środowisko aplikacji. Wartość domyślna to `development`. Dostępne opcje to:

- `production`: środowisko produkcyjne
- `development`: środowisko deweloperskie

```bash
APP_ENV=production
```

### APP_KEY

Klucz tajny aplikacji, używany m.in. do generowania tokenów użytkowników. Proszę zmienić go na własny klucz aplikacji i upewnić się, że nie zostanie on ujawniony.

:::warning
Jeśli `APP_KEY` zostanie zmieniony, stare tokeny staną się nieważne.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Port aplikacji. Wartość domyślna to `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Prefiks adresu API NocoBase. Wartość domyślna to `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Tryb uruchamiania wielordzeniowego (klastrowego) aplikacji. Jeśli ta zmienna zostanie skonfigurowana, zostanie przekazana do polecenia `pm2 start` jako parametr `-i <instances>`. Dostępne opcje są zgodne z parametrem `-i` PM2 (proszę zapoznać się z [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)) i obejmują:

- `max`: Używa maksymalnej liczby rdzeni CPU
- `-1`: Używa maksymalnej liczby rdzeni CPU minus jeden
- `<number>`: Określa liczbę rdzeni

Wartość domyślna jest pusta, co oznacza, że tryb nie jest włączony.

:::warning{title="Uwaga"}
Ten tryb wymaga użycia wtyczek związanych z trybem klastrowym. W przeciwnym razie funkcjonalność aplikacji może działać nieprawidłowo.
:::

Więcej informacji znajdą Państwo w: [Tryb klastrowy](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Prefiks nazwy pakietu wtyczki. Domyślnie: `@nocobase/plugin-,@nocobase/preset-`.

Na przykład, aby dodać wtyczkę `hello` do projektu `my-nocobase-app`, pełna nazwa pakietu wtyczki będzie `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` można skonfigurować jako:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Zależność między nazwą wtyczki a nazwą pakietu jest następująca:

- Nazwa pakietu wtyczki `users` to `@nocobase/plugin-users`
- Nazwa pakietu wtyczki `nocobase` to `@nocobase/preset-nocobase`
- Nazwa pakietu wtyczki `hello` to `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Typ bazy danych. Dostępne opcje to:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Host bazy danych (wymagany przy użyciu baz danych MySQL lub PostgreSQL).

Wartość domyślna to `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Port bazy danych (wymagany przy użyciu baz danych MySQL lub PostgreSQL).

- Domyślny port dla MySQL i MariaDB to 3306
- Domyślny port dla PostgreSQL to 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Nazwa bazy danych (wymagana przy użyciu baz danych MySQL lub PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Użytkownik bazy danych (wymagany przy użyciu baz danych MySQL lub PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Hasło do bazy danych (wymagane przy użyciu baz danych MySQL lub PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Prefiks tabeli danych.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Określa, czy nazwy tabel i pól w bazie danych są konwertowane na styl snake_case. Wartość domyślna to `false`. Jeśli używają Państwo bazy danych MySQL (MariaDB) z `lower_case_table_names=1`, wówczas `DB_UNDERSCORED` musi być ustawione na `true`.

:::warning
Gdy `DB_UNDERSCORED=true`, rzeczywiste nazwy tabel i pól w bazie danych nie będą odpowiadać tym wyświetlanym w interfejsie użytkownika. Na przykład `orderDetails` zostanie zapisane w bazie danych jako `order_details`.
:::

### DB_LOGGING

Przełącznik logowania bazy danych. Wartość domyślna to `off`. Dostępne opcje to:

- `on`: Włączone
- `off`: Wyłączone

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Maksymalna liczba połączeń w puli połączeń bazy danych. Wartość domyślna to `5`.

### DB_POOL_MIN

Minimalna liczba połączeń w puli połączeń bazy danych. Wartość domyślna to `0`.

### DB_POOL_IDLE

Maksymalny czas bezczynności połączenia w puli połączeń bazy danych, po którym zostanie ono zwolnione. Wartość domyślna to `10000` (10 sekund).

### DB_POOL_ACQUIRE

Maksymalny czas (w milisekundach), przez jaki pula połączeń będzie próbować uzyskać połączenie przed zgłoszeniem błędu. Wartość domyślna to `60000` (60 sekund).

### DB_POOL_EVICT

Interwał czasowy (w milisekundach), po którym pula połączeń usunie bezczynne połączenia. Wartość domyślna to `1000` (1 sekunda).

### DB_POOL_MAX_USES

Liczba użyć połączenia, zanim zostanie ono odrzucone i zastąpione. Wartość domyślna to `0` (bez limitu).

### LOGGER_TRANSPORT

Metoda wyjścia logów. Wiele wartości należy oddzielić przecinkami. W środowisku deweloperskim wartość domyślna to `console`, w środowisku produkcyjnym `console,dailyRotateFile`.
Dostępne opcje:

- `console` - `console.log`
- `file` - Zapis do pliku
- `dailyRotateFile` - Zapis do plików rotowanych dziennie

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Ścieżka przechowywania logów opartych na plikach. Wartość domyślna to `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Poziom wyjścia logów. W środowisku deweloperskim wartość domyślna to `debug`, w środowisku produkcyjnym `info`. Dostępne opcje:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Poziom wyjścia logów bazy danych to `debug`, kontrolowany przez `DB_LOGGING` i niezależny od `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Maksymalna liczba przechowywanych plików logów.

- Gdy `LOGGER_TRANSPORT` to `file`: Wartość domyślna to `10`.
- Gdy `LOGGER_TRANSPORT` to `dailyRotateFile`: Należy użyć `[n]d` do oznaczenia liczby dni. Wartość domyślna to `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Rotacja logów według rozmiaru.

- Gdy `LOGGER_TRANSPORT` to `file`: Jednostką jest `bajt`. Wartość domyślna to `20971520 (20 * 1024 * 1024)`.
- Gdy `LOGGER_TRANSPORT` to `dailyRotateFile`: Można użyć `[n]k`, `[n]m`, `[n]g`. Domyślnie nie jest skonfigurowane.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Format wydruku logów. W środowisku deweloperskim wartość domyślna to `console`, w środowisku produkcyjnym `json`. Dostępne opcje:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Więcej informacji: [Format logów](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Unikalny identyfikator metody buforowania, określający domyślną metodę buforowania po stronie serwera. Wartość domyślna to `memory`. Wbudowane opcje to:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Maksymalna liczba elementów w pamięci podręcznej. Wartość domyślna to `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Adres URL połączenia Redis, opcjonalny. Przykład: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Włącza zbieranie danych telemetrycznych. Wartość domyślna to `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Włączone kolektory metryk monitorowania. Wartość domyślna to `console`. Inne wartości powinny odnosić się do nazw zarejestrowanych przez odpowiadające wtyczki kolektorów, np. `prometheus`. Wiele wartości należy oddzielić przecinkami.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Włączone procesory danych śledzenia. Wartość domyślna to `console`. Inne wartości powinny odnosić się do nazw zarejestrowanych przez odpowiadające wtyczki procesorów. Wiele wartości należy oddzielić przecinkami.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Eksperymentalne zmienne środowiskowe

### APPEND_PRESET_LOCAL_PLUGINS

Służy do dołączania wstępnie ustawionych, nieaktywnych wtyczek. Wartością jest nazwa pakietu wtyczki (parametr `name` w `package.json`), a wiele wtyczek należy oddzielić przecinkami.

:::info
1. Proszę upewnić się, że wtyczka została pobrana lokalnie i można ją znaleźć w katalogu `node_modules`. Więcej szczegółów znajdą Państwo w [Organizacji wtyczek](/plugin-development/project-structure).
2. Po dodaniu zmiennej środowiskowej wtyczka pojawi się na stronie menedżera wtyczek dopiero po początkowej instalacji (`nocobase install`) lub aktualizacji (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Służy do dołączania wbudowanych wtyczek, które są instalowane domyślnie. Wartością jest nazwa pakietu wtyczki (parametr `name` w `package.json`), a wiele wtyczek należy oddzielić przecinkami.

:::info
1. Proszę upewnić się, że wtyczka została pobrana lokalnie i można ją znaleźć w katalogu `node_modules`. Więcej szczegółów znajdą Państwo w [Organizacji wtyczek](/plugin-development/project-structure).
2. Po dodaniu zmiennej środowiskowej wtyczka zostanie automatycznie zainstalowana lub zaktualizowana podczas początkowej instalacji (`nocobase install`) lub aktualizacji (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Tymczasowe zmienne środowiskowe

Instalację NocoBase można wspomóc, ustawiając tymczasowe zmienne środowiskowe, na przykład:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Odpowiednik
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Odpowiednik
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Język podczas instalacji. Wartość domyślna to `en-US`. Dostępne opcje to:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

Adres e-mail użytkownika Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Hasło użytkownika Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Pseudonim użytkownika Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```