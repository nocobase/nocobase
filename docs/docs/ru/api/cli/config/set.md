---
title: "nb config set"
description: "Справочник по команде nb config set: установка значения конфигурации CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Устанавливает значение конфигурации CLI. Поддерживаются ключи `license.pkg-url`, `docker.network` и `docker.container-prefix`.

## Использование

```bash
nb config set <key> <value>
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<key>` | string | Ключ конфигурации: `license.pkg-url`, `docker.network` или `docker.container-prefix` |
| `<value>` | string | Значение конфигурации; не должно быть пустым |

## Примеры

```bash
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
```

## Примечания

При установке `license.pkg-url` CLI нормализует URL так, чтобы он оканчивался на `/`.

## Связанные команды

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
