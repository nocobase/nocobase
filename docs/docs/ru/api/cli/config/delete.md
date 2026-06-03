---
title: 'nb config delete'
description: 'Справка по команде nb config delete: удаляет явно заданный параметр конфигурации CLI.'
keywords: 'nb config delete,NocoBase CLI,удалить конфигурацию'
---

# nb config delete

Удаляет явно заданный параметр конфигурации CLI. После удаления этот параметр возвращается к значению по умолчанию.

## Использование

```bash
nb config delete <key>
```

## Параметры

| Параметр | Тип    | Описание                                                                                                                                   |
| -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `<key>`  | string | Имя параметра конфигурации: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` или `bin.yarn` |

## Примеры

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Связанные команды

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
