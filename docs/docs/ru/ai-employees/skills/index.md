# NocoBase Skills

> [!WARNING]
> NocoBase Skills пока находится в статусе черновика. Содержимое приведено только для справки и может измениться в любой момент.

[NocoBase Skills](https://github.com/nocobase/skills) предоставляет набор переиспользуемых Skills для coding agent CLI, таких как Codex, Claude Code и OpenCode, помогая эффективнее выполнять установку, моделирование данных, создание интерфейсов и настройку рабочих процессов.

## Установка

1. Установите coding agent CLI, например Codex, Claude Code или OpenCode.

2. Установите Skills через [skills.sh](https://skills.sh/).

Установите все NocoBase Skills из этого репозитория:

```bash
mkdir nocobase-app-builder && cd nocobase-app-builder
npx skills add nocobase/skills
```

## Рекомендуемый порядок использования

1. Установите NocoBase, если он еще не установлен.

Можно сразу попросить agent сделать это:

```text
Install and start NocoBase.
```

2. Настройте NocoBase MCP Server.

Также можно попросить agent настроить подключение:

```text
Set up NocoBase MCP connection.
```

Вы также можете настроить его вручную. См. [NocoBase MCP](../mcp/index.md).

3. Начните моделирование данных и разработку приложения.

Например, можно сказать agent:

```text
I am building a CRM, design and create collections.
```

После настройки MCP-подключения большинство API NocoBase можно использовать через MCP tools.
