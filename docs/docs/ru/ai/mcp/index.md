---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

После включения плагина сервиса NocoBase MCP приложение NocoBase предоставляет конечную точку сервиса MCP, к которой клиенты MCP могут обращаться и вызывать API NocoBase.

## URL сервиса

- Основное приложение:

  `http(s)://<host>:<port>/api/mcp`

- Подприложение:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Эта конечная точка использует транспортный протокол `streamable HTTP`.

## Возможности

### Общие инструменты

Можно использовать для работы с таблицами данных.

| Название инструмента | Описание                                                        |
| -------------------- | --------------------------------------------------------------- |
| `resource_list`    | Получить список записей                                              |
| `resource_get`     | Получить детали записи                                                 |
| `resource_create`  | Создать запись                                                    |
| `resource_update`  | Обновить запись                                                    |
| `resource_destroy` | Удалить запись                                                    |
| `resource_query`   | Запрос данных со сложными условиями, такими как агрегация и соединения   |

### API ядра NocoBase и плагинов

Можно управлять тем, какие API пакетов доступны через MCP, с помощью заголовка запроса `x-mcp-packages`, например:

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

Этот заголовок поддерживает полные имена пакетов. Имена без области видимости автоматически получают префикс `@nocobase/`.

По умолчанию API пакетов, кроме общих инструментов, не загружаются. Для работы с другими возможностями системы рекомендуется использовать [NocoBase CLI](../quick-start.md).

Распространённые пакеты:

| Имя пакета                           | Описание                                          |
| ------------------------------------ | ------------------------------------------------- |
| `@nocobase/plugin-data-source-main`    | Управление основным источником данных, включая создание таблиц данных и добавление полей |
| `@nocobase/plugin-data-source-manager` | Управление источниками данных и получение информации о доступных источниках данных |
| `@nocobase/plugin-workflow`            | Управление рабочими процессами                                     |
| `@nocobase/plugin-acl`                 | Управление ролями и правами доступа                         |
| `@nocobase/plugin-users`               | Управление пользователями                                         |

Подробнее о пакетах и связанной документации API см. в плагине [Документация API](/integration/api-doc).

## Аутентификация

### Аутентификация по API-ключу

Вызывайте конечную точку сервиса MCP с помощью API-ключа, созданного через плагин [API-ключи](/auth-verification/api-keys/index.md). Права определяются ролью, привязанной к API-ключу.

### Аутентификация по OAuth

Вызывайте конечную точку сервиса MCP с помощью токена доступа, полученного через аутентификацию OAuth. Права определяются авторизованным пользователем. Если у пользователя несколько ролей, вызывающую роль можно задать через заголовок запроса `x-role`.

## Быстрый старт

### Codex

#### Аутентификация по API-ключу

Сначала включите плагин API-ключей и создайте API-ключ.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Аутентификация по OAuth

Сначала включите плагин IdP: OAuth.

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Аутентификация по API-ключу

Сначала включите плагин API-ключей и создайте API-ключ.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Аутентификация по OAuth

Сначала включите плагин IdP: OAuth.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

После выполнения откройте Claude и выберите соответствующий сервис MCP для входа:

```bash
claude
/mcp
```

### OpenCode

#### Аутентификация по API-ключу

Сначала включите плагин API-ключей и создайте API-ключ. Настройте `opencode.json`:

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

#### Аутентификация по OAuth

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

Аутентификация при входе

```bash
opencode mcp auth nocobase
```

Отладка

```bash
opencode mcp debug nocobase
```
