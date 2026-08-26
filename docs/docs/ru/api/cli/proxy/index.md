---
title: "nb proxy"
description: "Справка по группе команд nb proxy: выбор provider Nginx или Caddy и управление reverse proxy entrypoint для env, управляемых CLI."
keywords: "nb proxy,NocoBase CLI,nginx,caddy,reverse proxy,конфигурация proxy"
---

# nb proxy

В NocoBase CLI `nb proxy` — это единая точка входа для управления reverse proxy.

CLI разделяет управление env и управление входным уровнем:

- `nb env` сохраняет и поддерживает env приложения
- `nb proxy` генерирует и управляет entrypoint Nginx или Caddy для этих env, управляемых CLI

Если ваше приложение уже сохранено как env, управляемое CLI, и это env имеет тип `local` или `docker`, обычно достаточно выбрать один из subcommand provider.

## Использование

```bash
nb proxy <provider> <command>
```

## Дерево команд

```bash
nb proxy nginx use <local|docker>
nb proxy nginx current
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
nb proxy nginx start
nb proxy nginx restart
nb proxy nginx reload
nb proxy nginx stop
nb proxy nginx status
nb proxy nginx info

nb proxy caddy use <local|docker>
nb proxy caddy current
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
nb proxy caddy start
nb proxy caddy restart
nb proxy caddy reload
nb proxy caddy stop
nb proxy caddy status
nb proxy caddy info
```

## Providers

| Я хочу... | Куда перейти |
| --- | --- |
| Продолжать использовать Nginx для сайтов, сертификатов, кэша или контроля доступа | [`nb proxy nginx`](./nginx/index.md) |
| Быстро включить HTTPS и самостоятельно поддерживать меньше деталей TLS | [`nb proxy caddy`](./caddy/index.md) |
| Настроить параметры env, которые могут влиять на результат proxy, например `app-port` или `app-public-path` | [`nb env update`](../env/update.md) |

## Примечания

- У `nb proxy` нет собственных независимых флагов
- Используйте `nb proxy nginx` или `nb proxy caddy` для генерации и управления entrypoint
- Оба provider работают только для управляемых env, runtime которых доступен с текущей машины, то есть `local` или `docker`
- Оба provider поддерживают два драйвера: `local` и `docker`
- `use` сохраняет драйвер по умолчанию, а `current` напрямую выводит текущий драйвер
- `generate` записывает или обновляет файлы entry-конфигурации и не запускает proxy-процесс автоматически
- `start`, `restart`, `reload`, `stop`, `status` и `info` работают с runtime текущего драйвера
- Если вы меняете параметры вроде `app-port` или `app-public-path` через `nb env update`, обычно после этого нужно повторно выполнить соответствующую команду `generate`
- Эта группа команд пока не работает для env, у которых есть только удалённое API-подключение, и для SSH env

## Типичный сценарий

```bash
# 1. Выбрать provider и драйвер runtime
nb proxy nginx use docker

# 2. Сгенерировать entry-конфигурацию для одного CLI-managed env
nb proxy nginx generate --env app1 --host app1.example.com

# 3. Запустить proxy
nb proxy nginx start

# 4. Проверить статус и информацию о путях
nb proxy nginx status
nb proxy nginx info

# 5. Перезагрузить после изменений конфигурации
nb proxy nginx reload
```

Если вы выбрали Caddy, замените в командах выше `nginx` на `caddy`.

## Различия между командами

| Команда | Назначение |
| --- | --- |
| `use` | Переключить драйвер по умолчанию для текущего provider |
| `current` | Показать текущий драйвер provider, например `local` или `docker` |
| `generate` | Сгенерировать или обновить proxy entry-файлы для одного env |
| `start` | Запустить proxy с текущим драйвером |
| `reload` | Перезагрузить конфигурацию без остановки сервиса |
| `restart` | Остановить и затем запустить снова |
| `stop` | Остановить proxy |
| `status` | Показать состояние runtime |
| `info` | Показать драйвер, путь к config file, runtime root, upstream host и другие связанные runtime-детали |

## Примеры

```bash
# Сгенерировать и запустить Nginx для одного env
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# Сгенерировать и запустить Caddy для одного env
nb proxy caddy use local
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy start
```

## Связанные команды

- [`nb proxy nginx`](./nginx/index.md)
- [`nb proxy caddy`](./caddy/index.md)
- [`nb env update`](../env/update.md)
- [`nb env info`](../env/info.md)
- [`nb config`](../config/index.md)
