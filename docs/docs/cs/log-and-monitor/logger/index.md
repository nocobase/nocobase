---
pkg: "@nocobase/plugin-logger"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Logy

## Úvod

Logy jsou důležitým nástrojem pro lokalizaci systémových problémů. Serverové logy NocoBase zahrnují především logy požadavků rozhraní a provozní logy systému. Podporují konfiguraci úrovně logování, strategie rotace, velikosti, formátu tisku a dalších parametrů. Tento dokument se zaměřuje na související obsah serverových logů NocoBase a na to, jak využít **plugin** pro logování k zabalení a stažení serverových logů.

## Konfigurace logů

Parametry související s logováním, jako je úroveň logování, způsob výstupu a formát tisku, lze konfigurovat pomocí [proměnných prostředí](/get-started/installation/env.md#logger_transport).

## Formáty logů

NocoBase podporuje konfiguraci čtyř různých formátů logů.

### `console`

Výchozí formát ve vývojovém prostředí, zprávy jsou zvýrazněny barvou.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Výchozí formát v produkčním prostředí.

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

Odděleno oddělovačem `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Adresář logů

Hlavní adresářová struktura souborů logů NocoBase je:

- `storage/logs` - Adresář pro výstup logů
  - `main` - Název hlavní aplikace
    - `request_YYYY-MM-DD.log` - Logy požadavků
    - `system_YYYY-MM-DD.log` - Systémové logy
    - `system_error_YYYY-MM-DD.log` - Systémové chybové logy
    - `sql_YYYY-MM-DD.log` - Logy provádění SQL
    - ...
  - `sub-app` - Název podaplikace
    - `request_YYYY-MM-DD.log`
    - ...

## Soubory logů

### Logy požadavků

`request_YYYY-MM-DD.log`, logy požadavků a odpovědí rozhraní.

| Pole          | Popis                                |
| ------------- | ------------------------------------ |
| `level`       | Úroveň logu                          |
| `timestamp`   | Čas tisku logu `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` nebo `response`            |
| `userId`      | Pouze v `response`                   |
| `method`      | Metoda požadavku                     |
| `path`        | Cesta požadavku                      |
| `req` / `res` | Obsah požadavku/odpovědi             |
| `action`      | Požadované zdroje a parametry        |
| `status`      | Stavový kód odpovědi                 |
| `cost`        | Doba trvání požadavku                |
| `app`         | Název aktuální aplikace              |
| `reqId`       | ID požadavku                         |

:::info{title=Tip}
`reqId` bude předáno frontendu prostřednictvím hlavičky odpovědi `X-Request-Id`.
:::

### Systémové logy

`system_YYYY-MM-DD.log`, logy provozu aplikace, middleware, **pluginů** a dalších systémových komponent. Logy úrovně `error` budou tisknuty samostatně do `system_error_YYYY-MM-DD.log`.

| Pole        | Popis                                  |
| ----------- | -------------------------------------- |
| `level`     | Úroveň logu                            |
| `timestamp` | Čas tisku logu `YYYY-MM-DD hh:mm:ss`   |
| `message`   | Zpráva logu                            |
| `module`    | Modul                                  |
| `submodule` | Podmodul                               |
| `method`    | Volaná metoda                          |
| `meta`      | Další související informace, formát JSON |
| `app`       | Název aktuální aplikace                |
| `reqId`     | ID požadavku                           |

### Logy provádění SQL

`sql_YYYY-MM-DD.log`, logy provádění SQL dotazů databáze. Příkazy `INSERT INTO` jsou omezeny na prvních 2000 znaků.

| Pole        | Popis                                |
| ----------- | ------------------------------------ |
| `level`     | Úroveň logu                          |
| `timestamp` | Čas tisku logu `YYYY-MM-DD hh:mm:ss` |
| `sql`       | SQL příkaz                           |
| `app`       | Název aktuální aplikace              |
| `reqId`     | ID požadavku                         |

## Balení a stahování logů

1. Přejděte na stránku správy logů.
2. Vyberte soubory logů, které si přejete stáhnout.
3. Klikněte na tlačítko Stáhnout (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Související dokumenty

- [Vývoj **pluginů** - Server - Logování](/plugin-development/server/logger)
- [Referenční příručka API - @nocobase/logger](/api/logger/logger)