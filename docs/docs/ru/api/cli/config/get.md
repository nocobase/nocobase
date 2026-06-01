---
title: "nb config get"
description: "Справочник по команде nb config get: получение эффективного значения ключа конфигурации CLI."
keywords: "nb config get,NocoBase CLI,configuration"
---

# nb config get

Получает эффективное значение ключа конфигурации CLI. Если явное значение не задано, возвращается значение по умолчанию.

## Использование

```bash
nb config get <key>
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<key>` | string | Ключ конфигурации: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` или `bin.yarn` |

## Примеры

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## Связанные команды

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
