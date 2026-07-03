---
title: "nb config delete"
description: "Справочник по команде nb config delete: удаление явно заданного параметра конфигурации CLI."
keywords: "nb config delete,NocoBase CLI,удалить конфигурацию"
---

# nb config delete

Удаляет явно заданный параметр конфигурации CLI. После удаления этот параметр возвращается к значению по умолчанию.

## Использование

```bash
nb config delete <key>
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<key>` | string | Имя параметра конфигурации. Поддерживаемые значения см. в [`nb config`](./index.md) |

## Примеры

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete proxy.nb-cli-root
nb config delete proxy.upstream-host
nb config delete proxy.nginx-driver
nb config delete proxy.caddy-driver
nb config delete bin.nginx
nb config delete bin.git
nb config delete bin.pnpm
```

## Связанные команды

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
