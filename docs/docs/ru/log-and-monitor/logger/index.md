---
pkg: '@nocobase/plugin-logger'
---


pkg: '@nocobase/plugin-logger'
---

# Логирование

## Введение

Логи — важный инструмент для поиска системных проблем. Серверные логи NocoBase в основном включают логи запросов интерфейса и логи системных операций; поддерживаются настройка уровня логирования, стратегии ротации, размера, формата вывода и т. д. Этот документ в основном описывает серверные логи NocoBase, а также использование плагина логирования для упаковки и загрузки серверных логов.

## Конфигурация логов

Параметры логов, такие как уровень логирования, способ вывода и формат печати, можно настроить через [переменные окружения](/get-started/installation/env.md#logger_transport).

## Форматы логов

NocoBase поддерживает настройку четырёх разных форматов логов.

### `console`

Формат по умолчанию в окружении разработки; сообщения подсвечиваются цветом.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Формат по умолчанию в продакшен-окружении.

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

Разделитель — `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Директория логов

Основная структура директорий логов NocoBase:

- `storage/logs` - директория вывода логов
  - `main` - имя основного приложения
    - `request_YYYY-MM-DD.log` - лог запросов
    - `system_YYYY-MM-DD.log` - системный лог
    - `system_error_YYYY-MM-DD.log` - системный лог ошибок
    - `sql_YYYY-MM-DD.log` - лог выполнения SQL
    - ...
  - `sub-app` - имя подприложения
    - `request_YYYY-MM-DD.log`
    - ...

## Файлы логов

### Лог запросов

`request_YYYY-MM-DD.log`, логи запросов и ответов интерфейса.

| Поле          | Описание                             |
| ------------- | ------------------------------------ |
| `level`       | Уровень лога                         |
| `timestamp`   | Время вывода лога `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` или `response`             |
| `userId`      | Только в `response`                  |
| `method`      | Метод запроса                        |
| `path`        | Путь запроса                         |
| `req` / `res` | Содержимое запроса/ответа            |
| `action`      | Запрошенные ресурсы и параметры      |
| `status`      | Код статуса ответа                   |
| `cost`        | Длительность запроса                 |
| `app`         | Имя текущего приложения              |
| `reqId`       | Идентификатор запроса                |

:::info{title=Примечание}
`reqId` передаётся в клиентскую часть через заголовок ответа `X-Request-Id`.
:::

### Системный лог

`system_YYYY-MM-DD.log`, логи операций приложения, промежуточного ПО, плагинов и других системных операций. Логи уровня `error` дополнительно выводятся в `system_error_YYYY-MM-DD.log`.

| Поле        | Описание                               |
| ----------- | -------------------------------------- |
| `level`     | Уровень лога                           |
| `timestamp` | Время вывода лога `YYYY-MM-DD hh:mm:ss` |
| `message`   | Сообщение лога                         |
| `module`    | Модуль                                 |
| `submodule` | Подмодуль                              |
| `method`    | Вызванный метод                        |
| `meta`      | Другая связанная информация (JSON)     |
| `app`       | Имя текущего приложения                |
| `reqId`     | Идентификатор запроса                  |

### Лог выполнения SQL

`sql_YYYY-MM-DD.log`, логи выполнения SQL базы данных. Для выражений `INSERT INTO` сохраняются только первые 2000 символов.

| Поле        | Описание                             |
| ----------- | ------------------------------------ |
| `level`     | Уровень лога                         |
| `timestamp` | Время вывода лога `YYYY-MM-DD hh:mm:ss` |
| `sql`       | SQL-выражение                        |
| `app`       | Имя текущего приложения              |
| `reqId`     | Идентификатор запроса                |

## Упаковка и загрузка логов

1. Перейдите на страницу управления логами.
2. Выберите файлы логов, которые нужно скачать.
3. Нажмите кнопку «Скачать».

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Связанные документы

- [Разработка плагинов - Сервер - Логирование](/plugin-development/server/logger)
- [Справочник API - @nocobase/logger](/api/logger/logger)