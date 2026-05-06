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
| `<key>` | string | Ключ конфигурации: `license.pkg-url`, `docker.network` или `docker.container-prefix` |

## Примеры

```bash
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
```

## Связанные команды

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
