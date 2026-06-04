---
title: "nb config set"
description: "Справочник по команде nb config set: установка значения конфигурации CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Устанавливает значение конфигурации CLI. Поддерживаются ключи `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` и `bin.yarn`.

## Использование

```bash
nb config set <key> <value>
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<key>` | string | Ключ конфигурации: `locale`, `update.policy`, `license.pkg-url`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` или `bin.yarn` |
| `<value>` | string | Значение конфигурации; не должно быть пустым |

## Примеры

```bash
nb config set locale ru-RU
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Примечания

При установке `license.pkg-url` CLI нормализует URL так, чтобы он оканчивался на `/`.

`update.policy` поддерживает `prompt`, `auto` и `off`. Значение по умолчанию — `prompt`.

## Связанные команды

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
