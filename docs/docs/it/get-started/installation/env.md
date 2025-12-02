:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Variabili d'ambiente

## Come impostare le variabili d'ambiente?

### Metodo di installazione tramite codice sorgente Git o `create-nocobase-app`

Imposti le variabili d'ambiente nel file `.env` nella directory principale del progetto. Dopo averle modificate, dovrà terminare il processo dell'applicazione e riavviarla.

### Metodo di installazione tramite Docker

Modifichi la configurazione di `docker-compose.yml` e imposti le variabili d'ambiente nel parametro `environment`. Esempio:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Può anche usare `env_file` per impostare le variabili d'ambiente nel file `.env`. Esempio:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Dopo aver modificato le variabili d'ambiente, dovrà ricreare il container dell'applicazione.

```yml
docker compose up -d app
```

## Variabili d'ambiente globali

### TZ

Utilizzata per impostare il fuso orario dell'applicazione; il valore predefinito è il fuso orario del sistema operativo.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Le operazioni relative all'ora verranno gestite in base a questo fuso orario. La modifica di TZ potrebbe influire sui valori di data nel database. Per maggiori dettagli, consulti la "[[Panoramica Data & Ora](/data-sources/data-modeling/collection-fields/datetime)]".
:::

### APP_ENV

Ambiente dell'applicazione, valore predefinito `development`. Le opzioni includono:

- `production` ambiente di produzione
- `development` ambiente di sviluppo

```bash
APP_ENV=production
```

### APP_KEY

La chiave segreta dell'applicazione, utilizzata per generare token utente, ecc. La modifichi con la sua chiave applicativa e si assicuri che non venga divulgata.

:::warning
Se `APP_KEY` viene modificata, i vecchi token diventeranno non validi.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Porta dell'applicazione, valore predefinito `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Prefisso dell'indirizzo API di NocoBase, valore predefinito `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Modalità di avvio multi-core (cluster). Se questa variabile è configurata, verrà passata al comando `pm2 start` come parametro `-i <instances>`. Le opzioni sono coerenti con il parametro `-i` di pm2 (consulti [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), e includono:

- `max`: Utilizza il numero massimo di core della CPU
- `-1`: Utilizza il numero massimo di core della CPU meno uno
- `<number>`: Specifica il numero di core

Il valore predefinito è vuoto, il che significa che non è abilitata.

:::warning{title="Attenzione"}
Questa modalità richiede l'uso di **plugin** correlati alla modalità cluster. In caso contrario, le funzionalità dell'applicazione potrebbero riscontrare problemi imprevisti.
:::

Per maggiori informazioni, consulti: [Modalità Cluster](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Prefisso del nome del pacchetto **plugin**, predefinito: `@nocobase/plugin-,@nocobase/preset-`.

Ad esempio, per aggiungere il **plugin** `hello` al progetto `my-nocobase-app`, il nome completo del pacchetto del **plugin** sarà `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` può essere configurato come:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

La corrispondenza tra il nome del **plugin** e il nome del pacchetto è la seguente:

- Il nome del pacchetto del **plugin** `users` è `@nocobase/plugin-users`
- Il nome del pacchetto del **plugin** `nocobase` è `@nocobase/preset-nocobase`
- Il nome del pacchetto del **plugin** `hello` è `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Tipo di database, le opzioni includono:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Host del database (richiesto quando si utilizzano database MySQL o PostgreSQL).

Valore predefinito `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Porta del database (richiesto quando si utilizzano database MySQL o PostgreSQL).

- Porta predefinita per MySQL e MariaDB è 3306
- Porta predefinita per PostgreSQL è 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Nome del database (richiesto quando si utilizzano database MySQL o PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Utente del database (richiesto quando si utilizzano database MySQL o PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Password del database (richiesto quando si utilizzano database MySQL o PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Prefisso delle tabelle dei dati.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Indica se i nomi delle tabelle e dei campi del database devono essere convertiti in stile snake case. Il valore predefinito è `false`. Se si utilizza un database MySQL (MariaDB) e `lower_case_table_names=1`, allora `DB_UNDERSCORED` deve essere `true`.

:::warning
Quando `DB_UNDERSCORED=true`, i nomi effettivi delle tabelle e dei campi nel database non corrisponderanno a quanto visualizzato nell'interfaccia utente. Ad esempio, `orderDetails` verrà memorizzato come `order_details` nel database.
:::

### DB_LOGGING

Interruttore per i log del database, valore predefinito `off`. Le opzioni includono:

- `on` abilitato
- `off` disabilitato

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Numero massimo di connessioni nel pool di connessioni del database, valore predefinito `5`.

### DB_POOL_MIN

Numero minimo di connessioni nel pool di connessioni del database, valore predefinito `0`.

### DB_POOL_IDLE

Tempo massimo, in millisecondi, in cui una connessione può rimanere inattiva prima di essere rilasciata. Valore predefinito `10000` (10 secondi).

### DB_POOL_ACQUIRE

Tempo massimo, in millisecondi, in cui il pool tenterà di ottenere una connessione prima di generare un errore. Valore predefinito `60000` (60 secondi).

### DB_POOL_EVICT

Intervallo di tempo, in millisecondi, dopo il quale il pool di connessioni rimuoverà le connessioni inattive. Valore predefinito `1000` (1 secondo).

### DB_POOL_MAX_USES

Numero di volte in cui una connessione può essere utilizzata prima di essere scartata e sostituita. Valore predefinito `0` (illimitato).

### LOGGER_TRANSPORT

Metodo di output dei log, più valori separati da `,`. Il valore predefinito è `console` in ambiente di sviluppo e `console,dailyRotateFile` in ambiente di produzione.
Opzioni:

- `console` - `console.log`
- `file` - Output su file
- `dailyRotateFile` - Output su file a rotazione giornaliera

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Percorso di archiviazione dei log basato su file, predefinito `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Livello di output dei log. Il valore predefinito è `debug` in ambiente di sviluppo e `info` in ambiente di produzione. Opzioni:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Il livello di output dei log del database è `debug`, controllato da `DB_LOGGING`, e non è influenzato da `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Numero massimo di file di log da conservare.

- Quando `LOGGER_TRANSPORT` è `file`: il valore predefinito è `10`.
- Quando `LOGGER_TRANSPORT` è `dailyRotateFile`: utilizzi `[n]d` per rappresentare i giorni. Il valore predefinito è `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Rotazione dei log per dimensione.

- Quando `LOGGER_TRANSPORT` è `file`: l'unità è `byte`. Il valore predefinito è `20971520 (20 * 1024 * 1024)`.
- Quando `LOGGER_TRANSPORT` è `dailyRotateFile`: può usare `[n]k`, `[n]m`, `[n]g`. Non configurato per impostazione predefinita.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Formato di stampa dei log. Il valore predefinito è `console` in ambiente di sviluppo e `json` in ambiente di produzione. Opzioni:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Riferimento: [Formato dei log](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Identificatore univoco per il metodo di caching, che specifica il metodo di cache predefinito del server. Il valore predefinito è `memory`. Le opzioni integrate includono:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Numero massimo di elementi nella cache in memoria, valore predefinito `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

URL di connessione Redis, opzionale. Esempio: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Abilita la raccolta dei dati di telemetria. Il valore predefinito è `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Collettori di metriche di monitoraggio abilitati. Il valore predefinito è `console`. Altri valori devono fare riferimento ai nomi registrati dai corrispondenti **plugin** del collettore, come `prometheus`. Più valori sono separati da `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Processori di dati di traccia abilitati. Il valore predefinito è `console`. Altri valori devono fare riferimento ai nomi registrati dai corrispondenti **plugin** del processore. Più valori sono separati da `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Variabili d'ambiente sperimentali

### APPEND_PRESET_LOCAL_PLUGINS

Utilizzata per aggiungere **plugin** locali preimpostati non attivi. Il valore è il nome del pacchetto del **plugin** (il parametro `name` in `package.json`), con più **plugin** separati da virgole.

:::info
1. Si assicuri che il **plugin** sia stato scaricato localmente e che possa essere trovato nella directory `node_modules`. Per maggiori dettagli, consulti [[Organizzazione dei plugin](/plugin-development/project-structure)].
2. Dopo aver aggiunto la variabile d'ambiente, il **plugin** apparirà nella pagina del gestore **plugin** solo dopo un'installazione iniziale (`nocobase install`) o un aggiornamento (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Utilizzata per aggiungere **plugin** integrati e installati per impostazione predefinita. Il valore è il nome del pacchetto del **plugin** (il parametro `name` in `package.json`), con più **plugin** separati da virgole.

:::info
1. Si assicuri che il **plugin** sia stato scaricato localmente e che possa essere trovato nella directory `node_modules`. Per maggiori dettagli, consulti [[Organizzazione dei plugin](/plugin-development/project-structure)].
2. Dopo aver aggiunto la variabile d'ambiente, il **plugin** verrà automaticamente installato o aggiornato durante l'installazione iniziale (`nocobase install`) o l'aggiornamento (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Variabili d'ambiente temporanee

Durante l'installazione di NocoBase, è possibile impostare variabili d'ambiente temporanee per facilitare il processo, ad esempio:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Equivalente a
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Equivalente a
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Lingua al momento dell'installazione. Il valore predefinito è `en-US`. Le opzioni includono:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

Email dell'utente Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Password dell'utente Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Nickname dell'utente Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```