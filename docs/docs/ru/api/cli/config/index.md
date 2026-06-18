---
title: "nb config"
description: "Справочник по команде nb config: управление значениями конфигурации CLI NocoBase по умолчанию."
keywords: "nb config,NocoBase CLI,конфигурация,конфигурация по умолчанию"
---

# nb config

Управляет значениями конфигурации CLI по умолчанию. Поддерживаемые сейчас ключи в основном делятся на такие группы:

- Сама CLI: `locale`, `update.policy`, `license.pkg-url`
- Среда выполнения Docker: `docker.network`, `docker.container-prefix`
- Внешние исполняемые файлы: `bin.docker`, `bin.caddy`, `bin.git`, `bin.nginx`, `bin.yarn`
- Генерация прокси: `proxy.nb-cli-root`, `proxy.upstream-host`, `proxy.nginx-driver`, `proxy.caddy-driver`

Большинству проектов нужна только часть этих ключей. На практике чаще всего используются:

- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.nginx` или `bin.caddy`
- `proxy.nginx-driver` или `proxy.caddy-driver`

## Часто используемые ключи конфигурации

| Ключ | Значение по умолчанию | Описание |
| --- | --- | --- |
| `locale` | определяется по текущим правилам CLI | Переопределяет язык, используемый CLI |
| `update.policy` | `prompt` | Политика обновления при запуске: `prompt`, `auto` или `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | Переопределяет URL загрузки коммерческих плагинов |
| `docker.network` | `nocobase` | Сеть по умолчанию для Docker-приложений, управляемых CLI |
| `docker.container-prefix` | `nb` | Префикс по умолчанию для Docker-контейнеров, управляемых CLI |
| `bin.docker` | `docker` | Переопределяет путь к исполняемому файлу Docker |
| `bin.caddy` | `caddy` | Переопределяет путь к исполняемому файлу Caddy |
| `bin.git` | `git` | Переопределяет путь к исполняемому файлу Git |
| `bin.nginx` | `nginx` | Переопределяет путь к исполняемому файлу Nginx |
| `bin.yarn` | `yarn` | Переопределяет путь к исполняемому файлу Yarn |
| `proxy.nb-cli-root` | корень CLI, обычно домашний каталог текущего пользователя | Переопределяет корневой путь, который видит сгенерированная конфигурация прокси, когда процесс прокси и CLI не видят один и тот же корень файловой системы |
| `proxy.upstream-host` | `127.0.0.1` | Переопределяет хост, который прокси использует для пересылки трафика обратно в приложение NocoBase |
| `proxy.nginx-driver` | `local` | Драйвер среды выполнения по умолчанию для `nb proxy nginx` |
| `proxy.caddy-driver` | `local` | Драйвер среды выполнения по умолчанию для `nb proxy caddy` |

## Использование

```bash
nb config <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb config get`](./get.md) | Прочитать эффективное значение ключа конфигурации |
| [`nb config set`](./set.md) | Установить ключ конфигурации |
| [`nb config delete`](./delete.md) | Удалить явно заданный ключ конфигурации |
| [`nb config list`](./list.md) | Показать ключи конфигурации, которые сейчас заданы явно |

## Примеры

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.nb-cli-root
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## Примечания

- `bin.nginx` и `bin.caddy` влияют только на драйвер `local` для `nb proxy nginx` и `nb proxy caddy`
- `proxy.nginx-driver` и `proxy.caddy-driver` хранят драйвер по умолчанию для каждого провайдера
- `proxy.nb-cli-root` и `proxy.upstream-host` — это расширенные настройки прокси. Для большинства окружений типов `local` и `docker`, управляемых CLI, достаточно значений по умолчанию
- Если вам нужно только переключить активный драйвер прокси, обычно понятнее использовать `nb proxy nginx use` или `nb proxy caddy use`, чем вручную менять ключ конфигурации

## Связанные команды

- [`nb init`](../init.md)
- [`nb proxy`](../proxy/index.md)
- [`nb license`](../license/index.md)
