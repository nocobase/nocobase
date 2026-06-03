---
title: 'nb config'
description: 'Справочник по команде nb config: управление параметрами конфигурации NocoBase CLI по умолчанию.'
keywords: 'nb config,NocoBase CLI,конфигурация,конфигурация по умолчанию'
---

# nb config

Управляет конфигурацией CLI по умолчанию. В настоящее время поддерживаются следующие параметры конфигурации:

- `locale`
- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.git`
- `bin.yarn`

## Часто используемые параметры конфигурации

| Параметр конфигурации     | Значение по умолчанию                | Описание                                                     |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `locale`                  | Определяется по текущим правилам CLI | Переопределяет язык, используемый CLI                        |
| `update.policy`           | `prompt`                             | Политика обновления при запуске: `prompt`, `auto` или `off`  |
| `docker.network`          | `nocobase`                           | Сеть по умолчанию для Docker-приложений, управляемых CLI     |
| `docker.container-prefix` | `nb`                                 | Префикс по умолчанию для Docker-контейнеров, управляемых CLI |
| `bin.docker`              | `docker`                             | Переопределяет путь к исполняемому файлу Docker              |
| `bin.git`                 | `git`                                | Переопределяет путь к исполняемому файлу Git                 |
| `bin.yarn`                | `yarn`                               | Переопределяет путь к исполняемому файлу Yarn                |

## Использование

```bash
nb config <command>
```

## Подкоманды

| Команда                           | Описание                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------ |
| [`nb config get`](./get.md)       | Считывает фактическое значение параметра конфигурации                          |
| [`nb config set`](./set.md)       | Устанавливает параметр конфигурации                                            |
| [`nb config delete`](./delete.md) | Удаляет явно заданный параметр конфигурации                                    |
| [`nb config list`](./list.md)     | Выводит список параметров конфигурации, которые в настоящий момент заданы явно |

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
