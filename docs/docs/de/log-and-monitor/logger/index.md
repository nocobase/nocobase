---
pkg: "@nocobase/plugin-logger"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



pkg: '@nocobase/plugin-logger'
---

# Protokolle

## Einführung

Protokolle sind ein wichtiges Mittel, um Systemprobleme zu lokalisieren. Die Server-Protokolle von NocoBase umfassen hauptsächlich Schnittstellenanfrage-Protokolle und Systembetriebs-Protokolle. Sie unterstützen die Konfiguration von Protokollierungsstufen, Rollierungsstrategien, Größen, Ausgabeformaten und mehr. Dieses Dokument stellt die relevanten Inhalte der NocoBase Server-Protokolle vor und erklärt, wie Sie die vom Protokoll-Plugin bereitgestellten Funktionen zum Packen und Herunterladen von Server-Protokollen nutzen können.

## Protokoll-Konfiguration

Protokoll-bezogene Parameter wie Protokollierungsstufe, Ausgabemethode und Ausgabeformat können über [Umgebungsvariablen](/get-started/installation/env.md#logger_transport) konfiguriert werden.

## Protokollformate

NocoBase unterstützt die Konfiguration von vier verschiedenen Protokollformaten.

### `console`

Das Standardformat in der Entwicklungsumgebung, Nachrichten werden farblich hervorgehoben.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Das Standardformat in der Produktionsumgebung.

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

Durch das Trennzeichen `|` getrennt.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Protokollverzeichnis

Die Hauptverzeichnisstruktur der NocoBase Protokolldateien ist:

- `storage/logs` – Protokoll-Ausgabeverzeichnis
  - `main` – Name der Hauptanwendung
    - `request_JJJJ-MM-TT.log` – Anfrage-Protokoll
    - `system_JJJJ-MM-TT.log` – System-Protokoll
    - `system_error_JJJJ-MM-TT.log` – Systemfehler-Protokoll
    - `sql_JJJJ-MM-TT.log` – SQL-Ausführungs-Protokoll
    - ...
  - `sub-app` – Name der Unteranwendung
    - `request_JJJJ-MM-TT.log`
    - ...

## Protokolldateien

### Anfrage-Protokoll

`request_JJJJ-MM-TT.log`, Protokolle für Schnittstellenanfragen und -antworten.

| Feld          | Beschreibung                               |
| ------------- | ------------------------------------------ |
| `level`       | Protokollierungsstufe                      |
| `timestamp`   | Zeitpunkt der Protokollierung `JJJJ-MM-TT hh:mm:ss` |
| `message`     | `request` oder `response`                  |
| `userId`      | Nur in `response` enthalten                |
| `method`      | Anfragemethode                             |
| `path`        | Anfragepfad                                |
| `req` / `res` | Anfrage-/Antwortinhalt                     |
| `action`      | Angefragte Ressourcen und Parameter        |
| `status`      | Antwort-Statuscode                         |
| `cost`        | Anfragedauer                               |
| `app`         | Name der aktuellen Anwendung               |
| `reqId`       | Anfrage-ID                                 |

:::info{title=Hinweis}
`reqId` wird über den `X-Request-Id` Antwort-Header an das Frontend übermittelt.
:::

### System-Protokoll

`system_JJJJ-MM-TT.log`, Systembetriebs-Protokolle von Anwendungen, Middleware, Plugins usw. Protokolle der Stufe `error` werden separat in `system_error_JJJJ-MM-TT.log` ausgegeben.

| Feld        | Beschreibung                               |
| ----------- | ------------------------------------------ |
| `level`     | Protokollierungsstufe                      |
| `timestamp` | Zeitpunkt der Protokollierung `JJJJ-MM-TT hh:mm:ss` |
| `message`   | Protokollnachricht                         |
| `module`    | Modul                                      |
| `submodule` | Untermodul                                 |
| `method`    | Aufgerufene Methode                        |
| `meta`      | Weitere relevante Informationen, JSON-Format |
| `app`       | Name der aktuellen Anwendung               |
| `reqId`     | Anfrage-ID                                 |

### SQL-Ausführungs-Protokoll

`sql_JJJJ-MM-TT.log`, Datenbank-SQL-Ausführungs-Protokolle. `INSERT INTO` Anweisungen werden auf die ersten 2000 Zeichen begrenzt.

| Feld        | Beschreibung                               |
| ----------- | ------------------------------------------ |
| `level`     | Protokollierungsstufe                      |
| `timestamp` | Zeitpunkt der Protokollierung `JJJJ-MM-TT hh:mm:ss` |
| `sql`       | SQL-Anweisung                              |
| `app`       | Name der aktuellen Anwendung               |
| `reqId`     | Anfrage-ID                                 |

## Protokolle packen und herunterladen

1. Navigieren Sie zur Protokollverwaltungsseite.
2. Wählen Sie die Protokolldateien aus, die Sie herunterladen möchten.
3. Klicken Sie auf die Schaltfläche „Herunterladen“ (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Verwandte Dokumente

- [Plugin-Entwicklung - Server - Protokollierung](/plugin-development/server/logger)
- [API-Referenz - @nocobase/logger](/api/logger/logger)