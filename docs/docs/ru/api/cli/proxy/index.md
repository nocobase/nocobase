---
title: "nb proxy"
description: "Справочник по группе команд nb proxy: выбор провайдера Nginx или Caddy и управление точками входа обратного прокси для окружений, управляемых CLI."
keywords: "nb proxy,NocoBase CLI,nginx,caddy,обратный прокси,конфигурация прокси"
---

# nb proxy

В NocoBase CLI `nb proxy` — единая точка входа для управления обратным прокси.

CLI разделяет управление окружениями и управление входным уровнем:

- `nb env` сохраняет и поддерживает окружения приложения
- `nb proxy` генерирует и управляет точками входа Nginx или Caddy для этих окружений, управляемых CLI

Если приложение уже сохранено как окружение, управляемое CLI, и это окружение имеет тип `local` или `docker`, обычно достаточно выбрать подкоманду провайдера.

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

## Провайдеры

| Я хочу... | Куда перейти |
| --- | --- |
| Продолжать использовать Nginx для сайтов, сертификатов, кэша или контроля доступа | [`nb proxy nginx`](./nginx/index.md) |
| Быстро включить HTTPS и самостоятельно поддерживать меньше деталей TLS | [`nb proxy caddy`](./caddy/index.md) |
| Настроить параметры окружения, которые могут влиять на вывод прокси, например `app-port` или `app-public-path` | [`nb env update`](../env/update.md) |

## Примечания

- У `nb proxy` нет собственных независимых флагов
- Используйте `nb proxy nginx` или `nb proxy caddy` для генерации и управления точками входа
- Оба провайдера работают только для управляемых окружений, среда выполнения которых доступна с текущей машины, то есть `local` или `docker`
- Оба провайдера поддерживают два драйвера: `local` и `docker`
- `use` сохраняет драйвер по умолчанию, а `current` напрямую выводит текущий драйвер
- `generate` записывает или обновляет файлы входной конфигурации и не запускает процесс прокси автоматически
- `start`, `restart`, `reload`, `stop`, `status` и `info` работают со средой выполнения текущего драйвера
- Если вы меняете параметры вроде `app-port` или `app-public-path` через `nb env update`, обычно после этого нужно повторно выполнить соответствующую команду `generate`
- Эта группа команд пока не работает для окружений только с удалённым API-подключением и для окружений типа `ssh`

## Типичный рабочий процесс

```bash
# 1. Выбрать провайдера и драйвер среды выполнения
nb proxy nginx use docker

# 2. Сгенерировать входную конфигурацию для одного окружения, управляемого CLI
nb proxy nginx generate --env app1 --host app1.example.com

# 3. Запустить прокси
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
| `use` | Переключить драйвер по умолчанию для текущего провайдера |
| `current` | Показать текущий драйвер провайдера, например `local` или `docker` |
| `generate` | Сгенерировать или обновить файлы конфигурации точки входа для одного окружения |
| `start` | Запустить прокси с текущим драйвером |
| `reload` | Перезагрузить конфигурацию без остановки сервиса |
| `restart` | Остановить и затем запустить снова |
| `stop` | Остановить прокси |
| `status` | Показать состояние среды выполнения |
| `info` | Показать драйвер, путь к файлу конфигурации, корень среды выполнения, `upstream host` и другие связанные сведения о среде выполнения |

## Примеры

```bash
# Сгенерировать и запустить Nginx для одного окружения
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# Сгенерировать и запустить Caddy для одного окружения
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
