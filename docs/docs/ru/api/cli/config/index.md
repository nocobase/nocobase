---
title: "nb config"
description: "Справочник по команде nb config: управление элементами конфигурации NocoBase CLI по умолчанию."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Управление настройками CLI по умолчанию. В настоящее время поддерживаются следующие ключи:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Часто используемые ключи

| Ключ | Значение по умолчанию | Описание |
| --- | --- | --- |
| `locale` | текущее правило определения локали CLI | Переопределяет язык, используемый CLI |
| `update.policy` | `prompt` | Поведение обновления при запуске: `prompt`, `auto` или `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Реестр пакетов для коммерческих пакетов |
| `docker.network` | `nocobase` | Сеть Docker по умолчанию для Docker-приложений, которыми управляет CLI |
| `docker.container-prefix` | `nb` | Префикс контейнеров по умолчанию для Docker-приложений, которыми управляет CLI |
| `bin.docker` | `docker` | Переопределяет путь к исполняемому файлу Docker |
| `bin.git` | `git` | Переопределяет путь к исполняемому файлу Git |
| `bin.yarn` | `yarn` | Переопределяет путь к исполняемому файлу Yarn |

## Использование

```bash
nb config <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb config get`](./get.md) | Получить эффективное значение ключа конфигурации |
| [`nb config set`](./set.md) | Установить значение конфигурации |
| [`nb config delete`](./delete.md) | Удалить явно заданное значение |
| [`nb config list`](./list.md) | Показать список явно заданных значений |

## Примеры

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Связанные команды

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
