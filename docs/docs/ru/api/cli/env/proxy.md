---
title: 'nb env proxy'
description: 'Справка по команде nb env proxy: генерирует конфигурацию прокси Nginx или Caddy для управляемого CLI env.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,конфигурация прокси'
---

# nb env proxy

В NocoBase CLI команда `nb env proxy` генерирует конфигурацию reverse proxy для одного env, управляемого CLI. По умолчанию обычно достаточно `nginx`. Переключайтесь на `caddy` только если вы уже используете Caddy или вам явно нужен Caddyfile.

Эта команда работает только для управляемых env, чей runtime доступен с текущей машины, то есть для `local` или `docker`. Пока она не поддерживает env, у которых есть только удалённое API-подключение, а также SSH env.

## Использование

```bash
nb env proxy [name] [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[name]` | string | Имя настроенного env, для которого нужно сгенерировать прокси-конфигурацию. Если не указано, используется текущий env |
| `--output`, `-o` | string | Путь к выходному файлу. По умолчанию используется `~/.nocobase/proxy/<provider>/<env>/generated.<ext>` |
| `--provider` | string | Provider прокси: `nginx` или `caddy` |
| `--host` | string | Хост, записываемый во входную конфигурацию, например `example.com` или `localhost` |
| `--port` | string | Порт, записываемый во входную конфигурацию. Это входной порт прокси, а не порт upstream-приложения NocoBase |
| `--install` | boolean | Устанавливает общую прокси-конфигурацию в основную конфигурацию provider |
| `--reload` | boolean | Проверяет и перезагружает provider после записи конфигурации |
| `--print` | boolean | Выводит сгенерированную конфигурацию в stdout вместо записи файлов |

## Файлы вывода по умолчанию

Если не передавать `--output`, CLI поддерживает три вида файлов в `~/.nocobase/proxy/<provider>/`:

| Provider | Сгенерированный файл | Редактируемый входной файл | Общая основная конфигурация |
| --- | --- | --- | --- |
| `nginx` | `~/.nocobase/proxy/nginx/<env>/generated.conf` | `~/.nocobase/proxy/nginx/<env>/app.conf` | `~/.nocobase/proxy/nginx/nocobase.conf` |
| `caddy` | `~/.nocobase/proxy/caddy/<env>/generated.caddy` | `~/.nocobase/proxy/caddy/<env>/app.caddy` | `~/.nocobase/proxy/caddy/nocobase.caddy` |

Это означает следующее:

- `generated.*` управляется CLI и будет перезаписан при следующем запуске `nb env proxy`
- `app.conf` / `app.caddy` — редактируемый входной файл, но ссылку на generated-конфигурацию, которую поддерживает CLI, нужно сохранить
- `nocobase.conf` / `nocobase.caddy` — общая основная конфигурация, которая подключает входные файлы всех env

Если передать `--output`, CLI запишет только generated-конфигурацию в этот файл и не будет создавать или обновлять входной файл и общую основную конфигурацию.

## Связанные параметры конфигурации

| Параметр конфигурации | Значение по умолчанию | Описание |
| --- | --- | --- |
| `proxy.provider` | `nginx` | Provider по умолчанию, который использует `nb env proxy` |
| `proxy.nb-cli-root` | Корень CLI, обычно домашний каталог текущего пользователя | Сопоставляет путь `.nocobase` с корневым путём, который реально видит процесс прокси |
| `proxy.upstream-host` | `127.0.0.1` | Хост, который прокси использует для обратной передачи трафика в приложение NocoBase |
| `bin.caddy` | `caddy` | Путь к исполняемому файлу Caddy, используемому в `--install` или `--reload` |
| `bin.nginx` | `nginx` | Путь к исполняемому файлу Nginx, используемому в `--install` или `--reload` |

В большинстве случаев менять `proxy.nb-cli-root` не нужно. Обычно это требуется только тогда, когда Nginx или Caddy работают в другом контейнере, под другим корнем монтирования или с другой картиной путей.

## Примечания

- `--port` должен быть целым числом от `1` до `65535`
- Порт upstream-приложения NocoBase берётся из сохранённого в env `appPort`, а не из `--port`
- Если команда сообщает, что у env отсутствует `appPort`, сначала выполните `nb env update <name>` или явно сохраните его через `nb env update <name> --app-port <port>`
- `--print` нельзя сочетать с `--install` или `--reload`
- `--output` нельзя сочетать с `--install` или `--reload`
- `--install` подключает общую конфигурацию к основной конфигурации provider. `--reload` проверяет и перезагружает provider. На практике эти два флага обычно используются вместе

## Примеры

```bash
# Сгенерировать стандартную конфигурацию nginx для текущего env
nb env proxy

# Сгенерировать конфигурацию для конкретного env
nb env proxy demo

# Вывести generated-конфигурацию без записи файлов
nb env proxy demo --print

# Записать host и port во входную конфигурацию
nb env proxy demo --host demo.local.nocobase.com --port 8080

# Сгенерировать конфигурацию Caddy
nb env proxy demo --provider caddy --host demo.local.nocobase.com

# Изменить provider по умолчанию и upstream-host
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal

# Сопоставить путь .nocobase, когда provider работает под другим root-путём
nb config set proxy.nb-cli-root /workspace

# Установить общую конфигурацию в основную конфигурацию provider и перезагрузить provider
nb env proxy demo --install --reload
```

## Связанные команды

- [`nb env update`](./update.md)
- [`nb env info`](./info.md)
- [`nb config`](../config/index.md)
- [`nb app start`](../app/start.md)
