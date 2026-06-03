---
title: 'nb config get'
description: 'Справка по команде nb config get: чтение итогового значения параметра конфигурации CLI.'
keywords: 'nb config get,NocoBase CLI,чтение конфигурации'
---

# nb config get

Считывает итоговое значение указанного параметра конфигурации CLI. Если он не был явно задан, возвращается значение по умолчанию.

## Использование

```bash
nb config get <key>
```

## Параметры

| Параметр | Тип    | Описание                                                                                                                                   |
| -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `<key>`  | string | Имя параметра конфигурации: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` или `bin.yarn` |

## Примеры

```bash
nb config get locale
nb config get update.policy
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Связанные команды

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
