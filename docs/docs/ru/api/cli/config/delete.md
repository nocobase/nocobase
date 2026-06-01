---
title: "nb config delete"
description: "Справочник по команде nb config delete: удаление явно заданной настройки CLI."
keywords: "nb config delete,NocoBase CLI,configuration"
---

# nb config delete

Удаляет явно заданную настройку CLI. После этого CLI возвращается к значению по умолчанию для этого ключа.

## Использование

```bash
nb config delete <key>
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<key>` | string | Ключ конфигурации: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` или `bin.yarn` |

## Примеры

```bash
nb config delete locale
nb config delete update.policy
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## Связанные команды

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
