---
pkg: "@nocobase/plugin-logger"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



pkg: '@nocobase/plugin-logger'
---

# Loggning

## Introduktion

Loggar är ett viktigt verktyg för att lokalisera systemproblem. NocoBases serverloggar inkluderar huvudsakligen loggar för API-förfrågningar och systemdriftsloggar, och stöder konfiguration av loggnivå, rullande strategi, storlek, utskriftsformat med mera. Detta dokument beskriver huvudsakligen NocoBases serverloggar och hur ni använder den **plugin** som tillhandahåller funktioner för att paketera och ladda ner serverloggar.

## Loggkonfiguration

Loggrelaterade parametrar som loggnivå, utmatningsmetod och utskriftsformat kan konfigureras via [miljövariabler](/get-started/installation/env.md#logger_transport).

## Loggformat

NocoBase stöder konfiguration av fyra olika loggformat.

### `console`

Standardformatet i utvecklingsmiljön, där meddelanden visas med markerade färger.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Standardformatet i produktionsmiljön.

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

Avgränsas av avgränsaren `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Loggkatalog

Huvudkatalogstrukturen för NocoBases loggfiler är:

- `storage/logs` - Loggutdatakatalog
  - `main` - Huvudapplikationsnamn
    - `request_YYYY-MM-DD.log` - Förfrågningslogg
    - `system_YYYY-MM-DD.log` - Systemlogg
    - `system_error_YYYY-MM-DD.log` - Systemfellogg
    - `sql_YYYY-MM-DD.log` - SQL-exekveringslogg
    - ...
  - `sub-app` - Underapplikationsnamn
    - `request_YYYY-MM-DD.log`
    - ...

## Loggfiler

### Förfrågningslogg

`request_YYYY-MM-DD.log`, loggar för API-förfrågningar och svar.

| Fält          | Beskrivning                               |
| ------------- | ----------------------------------------- |
| `level`       | Loggnivå                                  |
| `timestamp`   | Loggens utskriftstid `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` eller `response`                |
| `userId`      | Endast i `response`                       |
| `method`      | Förfrågningsmetod                         |
| `path`        | Förfrågningsväg                           |
| `req` / `res` | Förfrågnings-/svarsinnehåll               |
| `action`      | Begärda resurser och parametrar           |
| `status`      | Svarsstatuskod                            |
| `cost`        | Förfrågningstid                           |
| `app`         | Nuvarande applikationsnamn                |
| `reqId`       | Förfrågnings-ID                           |

:::info{title=Tips}
`reqId` skickas till frontend via `X-Request-Id`-svarsheadern.
:::

### Systemlogg

`system_YYYY-MM-DD.log`, systemdriftsloggar för applikationer, middleware, **plugin**s med mera. Loggar på `error`-nivå skrivs ut separat till `system_error_YYYY-MM-DD.log`.

| Fält        | Beskrivning                               |
| ----------- | ----------------------------------------- |
| `level`     | Loggnivå                                  |
| `timestamp` | Loggens utskriftstid `YYYY-MM-DD hh:mm:ss` |
| `message`   | Loggmeddelande                            |
| `module`    | Modul                                     |
| `submodule` | Submodul                                  |
| `method`    | Anropad metod                             |
| `meta`      | Annan relaterad information, JSON-format  |
| `app`       | Nuvarande applikationsnamn                |
| `reqId`     | Förfrågnings-ID                           |

### SQL-exekveringslogg

`sql_YYYY-MM-DD.log`, loggar för SQL-exekvering i databasen. `INSERT INTO`-satser begränsas till de första 2000 tecknen.

| Fält        | Beskrivning                               |
| ----------- | ----------------------------------------- |
| `level`     | Loggnivå                                  |
| `timestamp` | Loggens utskriftstid `YYYY-MM-DD hh:mm:ss` |
| `sql`       | SQL-sats                                  |
| `app`       | Nuvarande applikationsnamn                |
| `reqId`     | Förfrågnings-ID                           |

## Paketera och ladda ner loggar

1. Gå till sidan för logghantering.
2. Välj de loggfiler ni vill ladda ner.
3. Klicka på knappen Ladda ner (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Relaterade dokument

- [**Plugin**utveckling - Server - Loggning](/plugin-development/server/logger)
- [API-referens - @nocobase/logger](/api/logger/logger)