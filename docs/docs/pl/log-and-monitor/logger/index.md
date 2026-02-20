---
pkg: "@nocobase/plugin-logger"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



pkg: '@nocobase/plugin-logger'
---

# Logi

## Wprowadzenie

Logi są kluczowym narzędziem do lokalizowania problemów systemowych. Logi serwera NocoBase obejmują przede wszystkim logi żądań interfejsu API oraz logi działania systemu. Umożliwiają one konfigurację poziomu logów, strategii rotacji, rozmiaru, formatu wydruku i wielu innych parametrów. W tym dokumencie omówimy szczegółowo logi serwera NocoBase oraz pokażemy, jak korzystać z funkcji pakowania i pobierania logów serwera, które są dostępne dzięki wtyczce do logowania.

## Konfiguracja logów

Parametry związane z logowaniem, takie jak poziom logów, sposób ich zapisu oraz format wydruku, można skonfigurować za pomocą [zmiennych środowiskowych](/get-started/installation/env.md#logger_transport).

## Formaty logów

NocoBase obsługuje konfigurację czterech różnych formatów logów.

### `console`

Domyślny format w środowisku deweloperskim; wiadomości są wyświetlane w wyróżnionych kolorach.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Domyślny format w środowisku produkcyjnym.

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

Rozdzielane separatorem `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Katalog logów

Główna struktura katalogów plików logów NocoBase to:

- `storage/logs` - Katalog wyjściowy logów
  - `main` - Nazwa głównej aplikacji
    - `request_YYYY-MM-DD.log` - Log żądań
    - `system_YYYY-MM-DD.log` - Log systemowy
    - `system_error_YYYY-MM-DD.log` - Log błędów systemowych
    - `sql_YYYY-MM-DD.log` - Log wykonania SQL
    - ...
  - `sub-app` - Nazwa podaplikacji
    - `request_YYYY-MM-DD.log`
    - ...

## Pliki logów

### Log żądań

`request_YYYY-MM-DD.log`, logi żądań i odpowiedzi interfejsu API.

| Pole          | Opis                               |
| ------------- | ---------------------------------- |
| `level`       | Poziom logów                       |
| `timestamp`   | Czas zapisu logu `YYYY-MM-DD hh:mm:ss` |
| `message`     | `żądanie` lub `odpowiedź`          |
| `userId`      | Tylko w odpowiedzi                 |
| `method`      | Metoda żądania                     |
| `path`        | Ścieżka żądania                    |
| `req` / `res` | Treść żądania/odpowiedzi           |
| `action`      | Żądane zasoby i parametry          |
| `status`      | Kod statusu odpowiedzi             |
| `cost`        | Czas trwania żądania               |
| `app`         | Nazwa bieżącej aplikacji           |
| `reqId`       | ID żądania                         |

:::info{title=Uwaga}
`reqId` jest przekazywane do front-endu za pośrednictwem nagłówka odpowiedzi `X-Request-Id`.
:::

### Log systemowy

`system_YYYY-MM-DD.log`, logi działania systemu, takie jak aplikacje, middleware, wtyczki itp. Logi poziomu `error` są zapisywane oddzielnie w `system_error_YYYY-MM-DD.log`.

| Pole        | Opis                               |
| ----------- | ---------------------------------- |
| `level`     | Poziom logów                       |
| `timestamp` | Czas zapisu logu `YYYY-MM-DD hh:mm:ss` |
| `message`   | Wiadomość logu                     |
| `module`    | Moduł                              |
| `submodule` | Podmoduł                           |
| `method`    | Wywołana metoda                    |
| `meta`      | Inne powiązane informacje, format JSON |
| `app`       | Nazwa bieżącej aplikacji           |
| `reqId`     | ID żądania                         |

### Log wykonania SQL

`sql_YYYY-MM-DD.log`, logi wykonania zapytań SQL bazy danych. Instrukcje `INSERT INTO` są ograniczone do pierwszych 2000 znaków.

| Pole        | Opis                               |
| ----------- | ---------------------------------- |
| `level`     | Poziom logów                       |
| `timestamp` | Czas zapisu logu `YYYY-MM-DD hh:mm:ss` |
| `sql`       | Instrukcja SQL                     |
| `app`       | Nazwa bieżącej aplikacji           |
| `reqId`     | ID żądania                         |

## Pakowanie i pobieranie logów

1. Proszę przejść do strony zarządzania logami.
2. Proszę wybrać pliki logów, które Pan/Pani chce pobrać.
3. Proszę kliknąć przycisk Pobierz (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Powiązane dokumenty

- [Rozwój wtyczek - Serwer - Logowanie](/plugin-development/server/logger)
- [Referencje API - @nocobase/logger](/api/logger/logger)