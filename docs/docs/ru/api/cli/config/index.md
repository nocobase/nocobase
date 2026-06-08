---
title: 'nb config'
description: 'Справочник по команде nb config: управление параметрами конфигурации NocoBase CLI по умолчанию.'
keywords: 'nb config,NocoBase CLI,конфигурация,конфигурация по умолчанию'
---

# nb config

Управляет конфигурацией CLI по умолчанию. В настоящее время поддерживаются следующие параметры конфигурации:

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.caddy`
- `bin.git`
- `bin.nginx`
- `bin.yarn`
- `proxy.provider`
- `proxy.nb-cli-root`
- `proxy.upstream-host`

## Часто используемые параметры конфигурации

| Параметр конфигурации | Значение по умолчанию | Описание |
| --- | --- | --- |
| `locale` | Определяется по текущим правилам CLI | Переопределяет язык, используемый CLI |
| `update.policy` | `prompt` | Политика обновления при запуске: `prompt`, `auto` или `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Переопределяет URL загрузки пакетов коммерческих расширений |
| `docker.network` | `nocobase` | Сеть по умолчанию для Docker-приложений, управляемых CLI |
| `docker.container-prefix` | `nb` | Префикс по умолчанию для Docker-контейнеров, управляемых CLI |
| `bin.docker` | `docker` | Переопределяет путь к исполняемому файлу Docker |
| `bin.caddy` | `caddy` | Переопределяет путь к исполняемому файлу Caddy |
| `bin.git` | `git` | Переопределяет путь к исполняемому файлу Git |
| `bin.nginx` | `nginx` | Переопределяет путь к исполняемому файлу Nginx |
| `bin.yarn` | `yarn` | Переопределяет путь к исполняемому файлу Yarn |
| `proxy.provider` | `nginx` | Proxy-provider по умолчанию, используемый `nb env proxy` |
| `proxy.nb-cli-root` | Корень CLI, обычно домашний каталог текущего пользователя | Сопоставляет путь `.nocobase` с корневым путём, видимым процессу прокси |
| `proxy.upstream-host` | `127.0.0.1` | Хост, который прокси использует для обратной передачи трафика в приложение NocoBase |

## Использование

```bash
nb config <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb config get`](./get.md)       | Считывает фактическое значение параметра конфигурации          |
| [`nb config set`](./set.md)       | Устанавливает параметр конфигурации                            |
| [`nb config delete`](./delete.md) | Удаляет явно заданный параметр конфигурации                    |
| [`nb config list`](./list.md)     | Выводит список параметров конфигурации, заданных явно          |

## Примеры

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.provider
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Связанные команды

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
