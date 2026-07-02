---
title: 'nb config get'
description: 'Справка по команде nb config get: прочитать фактическое значение параметра конфигурации CLI.'
keywords: 'nb config get,NocoBase CLI,читать конфигурацию'
---

# nb config get

Читает фактическое значение указанного параметра конфигурации CLI. Если он не был задан явно, будет возвращено значение по умолчанию.

## Использование

```bash
nb config get <key>
```

## Параметры

| Параметр | Тип    | Описание                                                                            |
| -------- | ------ | ----------------------------------------------------------------------------------- |
| `<key>`  | string | Имя параметра конфигурации. Поддерживаемые значения см. в [`nb config`](./index.md) |

## Примеры

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get nb-image-registry
nb config get nb-image-variant
nb config get proxy.nb-cli-root
nb config get proxy.upstream-host
nb config get bin.nginx
nb config get bin.git
```

## Связанные команды

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
