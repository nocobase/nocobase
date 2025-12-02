---
pkg: "@nocobase/plugin-logger"
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::



pkg: '@nocobase/plugin-logger'
---

# Журналирование

## Введение

Журналы — это важный инструмент для выявления системных проблем. Серверные журналы NocoBase включают в себя журналы запросов к интерфейсу и журналы работы системы. Вы можете настроить уровень журналирования, стратегию ротации, размер файлов, формат вывода и другие параметры. В этом документе мы подробно рассмотрим серверные журналы NocoBase, а также расскажем, как использовать функциональность плагина для журналирования для упаковки и загрузки серверных журналов.

## Настройка журналирования

Параметры, связанные с журналированием, такие как уровень журналов, метод вывода и формат печати, можно настроить с помощью [переменных окружения](/get-started/installation/env.md#logger_transport).

## Форматы журналов

NocoBase поддерживает настройку четырех различных форматов журналов.

### `console`

Формат по умолчанию для среды разработки, сообщения отображаются с подсветкой.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Формат по умолчанию для производственной среды.

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

Разделяется символом-разделителем `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Каталог журналов

Основная структура каталогов файлов журналов NocoBase выглядит следующим образом:

- `storage/logs` - Каталог вывода журналов
  - `main` - Название основного приложения
    - `request_YYYY-MM-DD.log` - Журнал запросов
    - `system_YYYY-MM-DD.log` - Системный журнал
    - `system_error_YYYY-MM-DD.log` - Журнал системных ошибок
    - `sql_YYYY-MM-DD.log` - Журнал выполнения SQL
    - ...
  - `sub-app` - Название дочернего приложения
    - `request_YYYY-MM-DD.log`
    - ...

## Файлы журналов

### Журнал запросов

`request_YYYY-MM-DD.log` — журналы запросов к интерфейсу и ответов.

| Поле         | Описание                               |
| ------------- | -------------------------------------- |
| `level`       | Уровень журнала                        |
| `timestamp`   | Время записи в журнал `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` или `response`               |
| `userId`      | Только в `response`                    |
| `method`      | Метод запроса                          |
| `path`        | Путь запроса                           |
| `req` / `res` | Содержимое запроса/ответа              |
| `action`      | Запрашиваемые ресурсы и параметры     |
| `status`      | Код состояния ответа                   |
| `cost`        | Длительность запроса                   |
| `app`         | Название текущего приложения           |
| `reqId`       | ID запроса                             |

:::info{title=Примечание}
`ID запроса (reqId) будет передан на фронтенд через заголовок ответа `X-Request-Id`.`
:::

### Системный журнал

`system_YYYY-MM-DD.log` — журналы работы приложения, промежуточного ПО, плагинов и других системных компонентов. Журналы уровня `error` будут записываться отдельно в `system_error_YYYY-MM-DD.log`.

| Поле        | Описание                               |
| ----------- | -------------------------------------- |
| `level`     | Уровень журнала                        |
| `timestamp` | Время записи в журнал `YYYY-MM-DD hh:mm:ss` |
| `message`   | Сообщение журнала                      |
| `module`    | Модуль                                 |
| `submodule` | Подмодуль                              |
| `method`    | Вызываемый метод                       |
| `meta`      | Другая связанная информация, формат JSON |
| `app`       | Название текущего приложения           |
| `reqId`     | ID запроса                             |

### Журнал выполнения SQL

`sql_YYYY-MM-DD.log` — журналы выполнения SQL-запросов к базе данных. Операторы `INSERT INTO` сохраняются только до первых 2000 символов.

| Поле        | Описание                               |
| ----------- | -------------------------------------- |
| `level`     | Уровень журнала                        |
| `timestamp` | Время записи в журнал `YYYY-MM-DD hh:mm:ss` |
| `sql`       | SQL-запрос                             |
| `app`       | Название текущего приложения           |
| `reqId`     | ID запроса                             |

## Упаковка и загрузка журналов

1. Перейдите на страницу управления журналами.
2. Выберите файлы журналов, которые вы хотите загрузить.
3. Нажмите кнопку «Загрузить» (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Связанные документы

- [Разработка плагинов - Сервер - Журналирование](/plugin-development/server/logger)
- [Справочник API - @nocobase/logger](/api/logger/logger)