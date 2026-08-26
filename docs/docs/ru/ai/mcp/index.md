---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

После активации плагина MCP Server приложение NocoBase предоставляет внешний интерфейс MCP-сервиса, к которому могут обращаться MCP-клиенты для вызова интерфейсов NocoBase.

## Адрес сервиса

- Главное приложение:

  `http(s)://<host>:<port>/api/mcp`

- Подприложение:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Этот адрес использует транспортный протокол `streamable HTTP`.

## Предоставляемые возможности

### Универсальные инструменты

Используются для работы с таблицами данных.

| Имя инструмента    | Описание возможности                                              |
| ------------------ | ----------------------------------------------------------------- |
| `resource_list`    | Получить список записей                                           |
| `resource_get`     | Получить детали записи                                            |
| `resource_create`  | Создать запись                                                    |
| `resource_update`  | Обновить запись                                                   |
| `resource_destroy` | Удалить запись                                                    |
| `resource_query`   | Запросить данные с поддержкой сложных условий, агрегаций и связей |

### Интерфейсы ядра NocoBase и плагинов

Поддерживается заголовок запроса `x-mcp-packages`, через который можно указать, интерфейсы каких пакетов будет открывать MCP. Например:

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

В этом заголовке можно указать полное имя пакета. Если scope не указан, он автоматически дополняется до `@nocobase/`.

По умолчанию, кроме универсальных инструментов, интерфейсы других пакетов не загружаются. Для управления остальными системными возможностями рекомендуется использовать [NocoBase CLI](../quick-start.md).

Описание часто используемых пакетов:

| Имя пакета                             | Описание возможности                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `@nocobase/plugin-data-source-main`    | Управление основным источником данных, включая создание таблиц и полей и т. д. |
| `@nocobase/plugin-data-source-manager` | Управление источниками данных, получение информации о доступных источниках     |
| `@nocobase/plugin-workflow`            | Управление workflow                                                           |
| `@nocobase/plugin-acl`                 | Управление ролями и правами доступа                                           |
| `@nocobase/plugin-users`               | Управление пользователями                                                     |

Описание других пакетов и их интерфейсов можно посмотреть с помощью плагина [API Documentation](/integration/api-doc).

## Способы аутентификации

### Аутентификация по API Key

Для вызова интерфейсов MCP-сервиса используется API key, созданный через плагин [API keys](/auth-verification/api-keys/index.md). Права определяются ролью, к которой привязан API key.

### Аутентификация OAuth

Для вызова интерфейсов MCP-сервиса используется access token, полученный после авторизации OAuth. Права определяются авторизованным пользователем. Если у пользователя несколько ролей, нужную роль можно указать через заголовок запроса `x-role`.

## Быстрый старт

### Codex

#### Аутентификация по API Key

Сначала включите плагин API Keys и создайте API Key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Аутентификация OAuth

Сначала включите плагин IdP: OAuth.

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Аутентификация по API Key

Сначала включите плагин API Keys и создайте API Key.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Аутентификация OAuth

Сначала включите плагин IdP: OAuth.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

После выполнения откройте Claude и выберите соответствующий MCP-сервис для входа:

```bash
claude
/mcp
```

### OpenCode

#### Аутентификация по API Key

Сначала включите плагин API Keys и создайте API Key. Настройте `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer <your_api_key>"
      }
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

#### Аутентификация OAuth

Сначала включите плагин IdP: OAuth. Настройте `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

Авторизация:

```bash
opencode mcp auth nocobase
```

Debug:

```bash
opencode mcp debug nocobase
```
