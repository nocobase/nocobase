---
pkg: "@nocobase/plugin-logger"
---
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::



# Журнали

## Вступ

Журнали є важливим інструментом для виявлення системних проблем. Серверні журнали NocoBase переважно включають журнали запитів інтерфейсу та журнали роботи системи, підтримуючи конфігурацію рівня журналювання, стратегії ротації, розміру, формату виведення тощо. Цей документ головним чином присвячений серверним журналам NocoBase, а також тому, як використовувати функціонал пакування та завантаження серверних журналів, який надає плагін для журналювання.

## Конфігурація журналів

Параметри, пов'язані з журналами, такі як рівень журналювання, спосіб виведення та формат друку, можна налаштувати за допомогою [змінних середовища](/get-started/installation/env.md#logger_transport).

## Формати журналів

NocoBase підтримує налаштування чотирьох різних форматів журналів.

### `console`

Формат за замовчуванням у середовищі розробки, повідомлення відображаються виділеним кольором.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-3f77-456b-a295-0c8a28938228
```

### `json`

Формат за замовчуванням у виробничому середовищі.

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

Розділяється символом `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Каталог журналів

Основна структура каталогів файлів журналів NocoBase:

- `storage/logs` - Каталог виведення журналів
  - `main` - Назва основної програми
    - `request_YYYY-MM-DD.log` - Журнал запитів
    - `system_YYYY-MM-DD.log` - Системний журнал
    - `system_error_YYYY-MM-DD.log` - Журнал системних помилок
    - `sql_YYYY-MM-DD.log` - Журнал виконання SQL
    - ...
  - `sub-app` - Назва дочірньої програми
    - `request_YYYY-MM-DD.log`
    - ...

## Файли журналів

### Журнал запитів

`request_YYYY-MM-DD.log`, журнали запитів та відповідей інтерфейсу.

| Поле          | Опис                               |
| ------------- | ---------------------------------- |
| `level`       | Рівень журналювання                |
| `timestamp`   | Час запису в журнал `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` або `response`           |
| `userId`      | Лише у відповіді                   |
| `method`      | Метод запиту                       |
| `path`        | Шлях запиту                        |
| `req` / `res` | Вміст запиту/відповіді             |
| `action`      | Запитувані ресурси та параметри    |
| `status`      | Код статусу відповіді              |
| `cost`        | Тривалість запиту                  |
| `app`         | Назва поточної програми            |
| `reqId`       | ID запиту                          |

:::info{title=Примітка}
`reqId` передається на фронтенд через заголовок відповіді `X-Request-Id`.
:::

### Системний журнал

`system_YYYY-MM-DD.log`, журнали роботи системи, такі як програми, проміжне програмне забезпечення, плагіни тощо. Журнали рівня `error` будуть окремо виводитися до `system_error_YYYY-MM-DD.log`.

| Поле        | Опис                               |
| ----------- | ---------------------------------- |
| `level`     | Рівень журналювання                |
| `timestamp` | Час запису в журнал `YYYY-MM-DD hh:mm:ss` |
| `message`   | Повідомлення журналу               |
| `module`    | Модуль                             |
| `submodule` | Підмодуль                          |
| `method`    | Викликаний метод                   |
| `meta`      | Інша пов'язана інформація, формат JSON |
| `app`       | Назва поточної програми            |
| `reqId`     | ID запиту                          |

### Журнал виконання SQL

`sql_YYYY-MM-DD.log`, журнали виконання SQL запитів до бази даних. Оператори `INSERT INTO` обмежуються першими 2000 символами.

| Поле        | Опис                               |
| ----------- | ---------------------------------- |
| `level`     | Рівень журналювання                |
| `timestamp` | Час запису в журнал `YYYY-MM-DD hh:mm:ss` |
| `sql`       | SQL запит                          |
| `app`       | Назва поточної програми            |
| `reqId`     | ID запиту                          |

## Пакування та завантаження журналів

1. Перейдіть на сторінку керування журналами.
2. Оберіть файли журналів, які ви бажаєте завантажити.
3. Натисніть кнопку Завантажити (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Пов'язані документи

- [Розробка плагінів - Сервер - Журнали](/plugin-development/server/logger)
- [Довідник API - @nocobase/logger](/api/logger/logger)