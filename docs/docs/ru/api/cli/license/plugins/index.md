---
title: "nb license plugins"
description: "Справочник по команде nb license plugins: просмотр или синхронизация коммерческих плагинов, разрешённых текущей лицензией."
keywords: "nb license plugins,NocoBase CLI,commercial plugins"
---

# nb license plugins

Просматривает или синхронизирует коммерческие плагины, разрешённые текущей лицензией.

## Использование

```bash
nb license plugins <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb license plugins list`](./list.md) | Показать коммерческие плагины, связанные с текущей лицензией |
| [`nb license plugins sync`](./sync.md) | Синхронизировать коммерческие плагины, разрешённые текущей лицензией |
| [`nb license plugins clean`](./clean.md) | Удалить загруженные коммерческие плагины для текущего env |

## Примеры

```bash
nb license plugins list --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins clean --env app1 --verbose
```

## Связанные команды

- [`nb license activate`](../activate.md)
- [`nb plugin list`](../../plugin/list.md)
