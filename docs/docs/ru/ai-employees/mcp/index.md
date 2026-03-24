---
pkg: '@nocobase/plugin-mcp-server'
---

# NocoBase MCP

После включения плагина NocoBase MCP Server ваше приложение NocoBase будет предоставлять MCP-эндпоинт, через который MCP-клиенты смогут обращаться к API NocoBase и вызывать их.

## Адрес сервера

- Основное приложение:

  `http(s)://<host>:<port>/api/mcp`

- Неосновное приложение:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Этот эндпоинт использует транспорт `streamable HTTP`.

Вы можете использовать заголовок запроса `x-mcp-packages`, чтобы управлять тем, API каких пакетов MCP будет предоставлять, например:

`x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users`

Этот заголовок принимает полные имена пакетов. Если scope опущен, `@nocobase/` будет добавлен автоматически. По умолчанию MCP загружает API следующих пакетов:

- `@nocobase/plugin-data-source-main`
- `@nocobase/plugin-data-source-manager`
- `@nocobase/plugin-workflow*`
- `@nocobase/plugin-acl`
- `@nocobase/plugin-users`
- `@nocobase/plugin-auth`
- `@nocobase/plugin-client`
- `@nocobase/plugin-flow-engine`
- `@nocobase/plugin-ai`

## Возможности

- API ядра NocoBase и его плагинов
- Универсальный CRUD-инструмент для работы с таблицами данных

## Быстрый старт

### Codex

#### Аутентификация через API Key

Сначала включите плагин API Keys и создайте API key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url http://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Аутентификация через OAuth

Сначала включите плагин IdP: OAuth.

```bash
codex mcp add nocobase --url http://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Аутентификация через API Key

Сначала включите плагин API Keys и создайте API key.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Аутентификация через OAuth

Сначала включите плагин IdP: OAuth.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp
```

После этого откройте Claude и выполните вход в соответствующий MCP-сервис:

```bash
claude
/mcp
```

## Использование вместе со Skills

Рекомендуется использовать NocoBase MCP вместе с NocoBase Skills. См. [NocoBase Skills](../skills/index.md).
