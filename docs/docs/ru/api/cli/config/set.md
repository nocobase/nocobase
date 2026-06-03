---
title: 'nb config set'
description: 'Справка по команде nb config set: устанавливает параметр конфигурации CLI.'
keywords: 'nb config set,NocoBase CLI,установить конфигурацию'
---

# nb config set

Устанавливает параметр конфигурации CLI. В настоящее время поддерживаются следующие параметры: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` и `bin.yarn`.

## Использование

```bash
nb config set <key> <value>
```

## Параметры

| Параметр  | Тип    | Описание                                                                                                                                   |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `<key>`   | string | Имя параметра конфигурации: `locale`, `update.policy`, `docker.network`, `docker.container-prefix`, `bin.docker`, `bin.git` или `bin.yarn` |
| `<value>` | string | Значение конфигурации, не может быть пустым                                                                                                |

## Примеры

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## Примечания

`update.policy` поддерживает значения `prompt`, `auto` и `off`, значение по умолчанию — `prompt`.

## Связанные команды

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
