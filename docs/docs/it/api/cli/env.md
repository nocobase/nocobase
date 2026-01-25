:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Variabili d'ambiente globali

## TZ

Utilizzata per impostare il fuso orario dell'applicazione; il valore predefinito è il fuso orario del sistema operativo.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Le operazioni relative all'ora verranno elaborate in base a questo fuso orario. La modifica di TZ potrebbe influire sui valori di data nel database. Per maggiori dettagli, consulti la sezione '[Panoramica Data e Ora](#)'
:::

## APP_ENV

Ambiente dell'applicazione, il valore predefinito è `development`. Le opzioni includono:

- `production` Ambiente di produzione
- `development` Ambiente di sviluppo

```bash
APP_ENV=production
```

## APP_KEY

La chiave segreta dell'applicazione, utilizzata per generare i token utente e altro. La modifichi con la sua chiave applicativa e si assicuri che non venga divulgata.

:::warning
Se `APP_KEY` viene modificata, i vecchi token diventeranno invalidi.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Porta dell'applicazione, il valore predefinito è `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Prefisso dell'indirizzo API di NocoBase, il valore predefinito è `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Modalità di avvio multi-core (cluster). Se questa variabile è configurata, verrà passata al comando `pm2 start` come parametro `-i <instances>`. Le opzioni sono coerenti con il parametro `-i` di pm2 (consulti [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), e includono:

- `max`: utilizza il numero massimo di core della CPU
- `-1`: utilizza il numero massimo di core della CPU meno 1
- `<number>`: specifica il numero di core

Il valore predefinito è vuoto, il che significa che non è abilitata.

:::warning{title="Attenzione"}
Questa modalità deve essere utilizzata con i plugin relativi alla modalità cluster, altrimenti la funzionalità dell'applicazione potrebbe presentare anomalie.
:::

Per maggiori informazioni, consulti: [Modalità Cluster](#).

## PLUGIN_PACKAGE_PREFIX

Prefisso del nome del pacchetto del plugin, il valore predefinito è: `@nocobase/plugin-,@nocobase/preset-`.

Ad esempio, per aggiungere il `plugin` `hello` al progetto `my-nocobase-app`, il nome completo del pacchetto del `plugin` sarebbe `@my-nocobase-app/plugin-hello`.

`PLUGIN_PACKAGE_PREFIX` può essere configurato come segue:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

La corrispondenza tra i nomi dei `plugin` e i nomi dei pacchetti è la seguente:

- Il nome del pacchetto per il `plugin` `users` è `@nocobase/plugin-users`
- Il nome del pacchetto per il `plugin` `nocobase` è `@nocobase/preset-nocobase`
- Il nome del pacchetto per il `plugin` `hello` è `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Tipo di database, le opzioni includono:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Host del database (richiesto quando si utilizza un database MySQL o PostgreSQL).

Il valore predefinito è `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Porta del database (richiesta quando si utilizza un database MySQL o PostgreSQL).

- Porta predefinita di MySQL, MariaDB: 3306
- Porta predefinita di PostgreSQL: 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Nome del database (richiesto quando si utilizza un database MySQL o PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Utente del database (richiesto quando si utilizza un database MySQL o PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Password del database (richiesta quando si utilizza un database MySQL o PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Prefisso della tabella.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Indica se convertire i nomi delle tabelle e dei campi del database in stile snake case, il valore predefinito è `false`. Se sta utilizzando un database MySQL (MariaDB) e `lower_case_table_names=1`, allora `DB_UNDERSCORED` deve essere `true`.

:::warning
Quando `DB_UNDERSCORED=true`, i nomi effettivi delle tabelle e dei campi nel database non saranno coerenti con quanto visualizzato nell'interfaccia. Ad esempio, `orderDetails` nel database sarà `order_details`.
:::

## DB_LOGGING

Interruttore di logging del database, il valore predefinito è `off`. Le opzioni includono:

- `on` Abilitato
- `off` Disabilitato

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Modalità di output dei log, più valori sono separati da `,`. Il valore predefinito nell'ambiente di sviluppo è `console`, e nell'ambiente di produzione è `console,dailyRotateFile`. Opzioni:

- `console` - `console.log`
- `file` - `File`
- `dailyRotateFile` - `File a rotazione giornaliera`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Percorso di archiviazione dei log basato su file, il valore predefinito è `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Livello di output dei log. Il valore predefinito nell'ambiente di sviluppo è `debug`, e nell'ambiente di produzione è `info`. Opzioni:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Il livello di output dei log del database è `debug`, e la sua emissione è controllata da `DB_LOGGING`, non è influenzata da `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Numero massimo di file di log da conservare.

- Quando `LOGGER_TRANSPORT` è `file`, il valore predefinito è `10`.
- Quando `LOGGER_TRANSPORT` è `dailyRotateFile`, utilizzi `[n]d` per rappresentare i giorni. Il valore predefinito è `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotazione dei log per dimensione.

- Quando `LOGGER_TRANSPORT` è `file`, l'unità è `byte`, e il valore predefinito è `20971520 (20 * 1024 * 1024)`.
- Quando `LOGGER_TRANSPORT` è `dailyRotateFile`, può utilizzare `[n]k`, `[n]m`, `[n]g`. Non configurato per impostazione predefinita.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Formato di stampa dei log. Il valore predefinito nell'ambiente di sviluppo è `console`, e nell'ambiente di produzione è `json`. Opzioni:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Consulti: [Formato Log](#)

## CACHE_DEFAULT_STORE

Identificatore univoco per il tipo di cache da utilizzare, specifica la modalità di cache predefinita lato server. Il valore predefinito è `memory`. Opzioni integrate:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Numero massimo di elementi nella cache in memoria, il valore predefinito è `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Connessione Redis, opzionale. Esempio: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Abilita la raccolta dei dati di telemetria, il valore predefinito è `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Lettori di metriche di monitoraggio abilitati, il valore predefinito è `console`. Altri valori dovrebbero fare riferimento ai nomi registrati dei `plugin` lettori corrispondenti, come `prometheus`. Più valori sono separati da `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Processori di dati di traccia abilitati, il valore predefinito è `console`. Altri valori dovrebbero fare riferimento ai nomi registrati dei `plugin` processori corrispondenti. Più valori sono separati da `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```