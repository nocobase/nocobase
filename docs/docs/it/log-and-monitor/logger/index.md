---
pkg: "@nocobase/plugin-logger"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



pkg: '@nocobase/plugin-logger'
---

# Log

## Introduzione

I log sono uno strumento importante per aiutarci a individuare i problemi del sistema. I log del server di NocoBase includono principalmente i log delle richieste di interfaccia e i log di funzionamento del sistema, supportando la configurazione del livello di log, della strategia di rotazione, delle dimensioni, del formato di stampa e altro ancora. Questo documento introduce principalmente il contenuto relativo ai log del server di NocoBase, oltre a come utilizzare le funzionalità di impacchettamento e download dei log del server fornite dal plugin di logging.

## Configurazione dei Log

I parametri relativi ai log, come il livello di log, il metodo di output e il formato di stampa, possono essere configurati tramite le [variabili d'ambiente](/get-started/installation/env.md#logger_transport).

## Formati dei Log

NocoBase supporta la configurazione di quattro diversi formati di log.

### `console`

Formato predefinito nell'ambiente di sviluppo, i messaggi vengono visualizzati con colori evidenziati.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Formato predefinito nell'ambiente di produzione.

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

Separato dal delimitatore `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Directory dei Log

La struttura principale delle directory dei file di log di NocoBase è la seguente:

- `storage/logs` - Directory di output dei log
  - `main` - Nome dell'applicazione principale
    - `request_YYYY-MM-DD.log` - Log delle richieste
    - `system_YYYY-MM-DD.log` - Log di sistema
    - `system_error_YYYY-MM-DD.log` - Log degli errori di sistema
    - `sql_YYYY-MM-DD.log` - Log di esecuzione SQL
    - ...
  - `sub-app` - Nome della sotto-applicazione
    - `request_YYYY-MM-DD.log`
    - ...

## File di Log

### Log delle Richieste

`request_YYYY-MM-DD.log`, log delle richieste e delle risposte dell'interfaccia.

| Campo         | Descrizione                               |
| ------------- | ----------------------------------------- |
| `level`       | Livello del log                           |
| `timestamp`   | Ora di stampa del log `YYYY-MM-DD hh:mm:ss` |
| `message`     | Messaggio: `request` o `response`         |
| `userId`      | Presente solo in `response`               |
| `method`      | Metodo della richiesta                    |
| `path`        | Percorso della richiesta                  |
| `req` / `res` | Contenuto della richiesta/risposta        |
| `action`      | Risorse e parametri della richiesta       |
| `status`      | Codice di stato della risposta            |
| `cost`        | Durata della richiesta                    |
| `app`         | Nome dell'applicazione corrente           |
| `reqId`       | ID della richiesta                        |

:::info{title=Nota}
`reqId` verrà trasmesso al frontend tramite l'header di risposta `X-Request-Id`.
:::

### Log di Sistema

`system_YYYY-MM-DD.log`, log di funzionamento del sistema per applicazioni, middleware, plugin e altro. I log di livello `error` verranno stampati separatamente in `system_error_YYYY-MM-DD.log`.

| Campo       | Descrizione                               |
| ----------- | ----------------------------------------- |
| `level`     | Livello del log                           |
| `timestamp` | Ora di stampa del log `YYYY-MM-DD hh:mm:ss` |
| `message`   | Messaggio del log                         |
| `module`    | Modulo                                    |
| `submodule` | Sottomodulo                               |
| `method`    | Metodo chiamato                           |
| `meta`      | Altre informazioni correlate, formato JSON |
| `app`       | Nome dell'applicazione corrente           |
| `reqId`     | ID della richiesta                        |

### Log di Esecuzione SQL

`sql_YYYY-MM-DD.log`, log di esecuzione SQL del database. Le istruzioni `INSERT INTO` sono limitate ai primi 2000 caratteri.

| Campo       | Descrizione                               |
| ----------- | ----------------------------------------- |
| `level`     | Livello del log                           |
| `timestamp` | Ora di stampa del log `YYYY-MM-DD hh:mm:ss` |
| `sql`       | Istruzione SQL                            |
| `app`       | Nome dell'applicazione corrente           |
| `reqId`     | ID della richiesta                        |

## Impacchettamento e Download dei Log

1. Acceda alla pagina di gestione dei log.
2. Selezioni i file di log che desidera scaricare.
3. Clicchi sul pulsante Scarica (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Documenti Correlati

- [Sviluppo di Plugin - Server - Log](/plugin-development/server/logger)
- [Riferimento API - @nocobase/logger](/api/logger/logger)