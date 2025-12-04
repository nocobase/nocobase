---
pkg: "@nocobase/plugin-logger"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



pkg: '@nocobase/plugin-logger'
---

# Logboeken

## Introductie

Logboeken zijn een belangrijk middel om systeemproblemen op te sporen. De serverlogboeken van NocoBase omvatten voornamelijk logboeken van API-aanvragen en systeemactiviteiten, met ondersteuning voor configuratie van logniveau, roll-overstrategie, grootte, afdrukformaat en meer. Dit document beschrijft voornamelijk de serverlogboeken van NocoBase en hoe u de serverlogboeken kunt bundelen en downloaden met behulp van de logboek-plugin.

## Logboekconfiguratie

Parameters voor logboeken, zoals het logniveau, de uitvoermethode en het afdrukformaat, configureert u via [omgevingsvariabelen](/get-started/installation/env.md#logger_transport).

## Logboekformaten

NocoBase ondersteunt de configuratie van vier verschillende logboekformaten.

### `console`

Het standaardformaat in de ontwikkelomgeving; berichten worden met kleur gemarkeerd.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Het standaardformaat in de productieomgeving.

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

Gescheiden door het scheidingsteken `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Logboekmap

De hoofdmapstructuur van NocoBase-logbestanden is:

- `storage/logs` - Uitvoermap voor logboeken
  - `main` - Naam van de hoofdapplicatie
    - `request_JJJJ-MM-DD.log` - Aanvraaglogboek
    - `system_JJJJ-MM-DD.log` - Systeemlogboek
    - `system_error_JJJJ-MM-DD.log` - Systeemfoutenlogboek
    - `sql_JJJJ-MM-DD.log` - SQL-uitvoeringslogboek
    - ...
  - `sub-app` - Naam van de subapplicatie
    - `request_JJJJ-MM-DD.log`
    - ...

## Logbestanden

### Aanvraaglogboek

`request_JJJJ-MM-DD.log`, logboeken van API-aanvragen en -antwoorden.

| Veld          | Beschrijving                               |
| ------------- | ------------------------------------------ |
| `level`       | Logniveau                                  |
| `timestamp`   | Tijdstip van logboekregistratie `JJJJ-MM-DD uu:mm:ss` |
| `message`     | `aanvraag` of `antwoord`                   |
| `userId`      | Alleen in `antwoord`                       |
| `method`      | Aanvraagmethode                            |
| `path`        | Aanvraagpad                                |
| `req` / `res` | Inhoud van aanvraag/antwoord               |
| `action`      | Aangevraagde bronnen en parameters         |
| `status`      | Statuscode van antwoord                    |
| `cost`        | Duur van aanvraag                          |
| `app`         | Naam van huidige applicatie                |
| `reqId`       | Aanvraag-ID                                |

:::info{title=Tip}
`reqId` wordt via de `X-Request-Id` antwoordheader naar de frontend gestuurd.
:::

### Systeemlogboek

`system_JJJJ-MM-DD.log`, applicatie-, middleware-, plugin- en andere systeemactiviteitenlogboeken; logboeken van het `error`-niveau worden afzonderlijk opgeslagen in `system_error_JJJJ-MM-DD.log`.

| Veld        | Beschrijving                               |
| ----------- | ------------------------------------------ |
| `level`     | Logniveau                                  |
| `timestamp` | Tijdstip van logboekregistratie `JJJJ-MM-DD uu:mm:ss` |
| `message`   | Logboekbericht                             |
| `module`    | Module                                     |
| `submodule` | Submodule                                  |
| `method`    | Aangeroepen methode                        |
| `meta`      | Overige gerelateerde informatie, JSON-formaat |
| `app`       | Naam van huidige applicatie                |
| `reqId`     | Aanvraag-ID                                |

### SQL-uitvoeringslogboek

`sql_JJJJ-MM-DD.log`, SQL-uitvoeringslogboeken van de database. `INSERT INTO`-statements worden beperkt tot de eerste 2000 tekens.

| Veld        | Beschrijving                               |
| ----------- | ------------------------------------------ |
| `level`     | Logniveau                                  |
| `timestamp` | Tijdstip van logboekregistratie `JJJJ-MM-DD uu:mm:ss` |
| `sql`       | SQL-statement                              |
| `app`       | Naam van huidige applicatie                |
| `reqId`     | Aanvraag-ID                                |

## Logboeken bundelen en downloaden

1. Ga naar de pagina voor logboekbeheer.
2. Selecteer de logbestanden die u wilt downloaden.
3. Klik op de knop Downloaden.

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Gerelateerde documenten

- [Pluginontwikkeling - Server - Logboeken](/plugin-development/server/logger)
- [API-referentie - @nocobase/logger](/api/logger/logger)