---
title: "nb proxy caddy generate"
description: "Справка по команде nb proxy caddy generate: генерирует или обновляет конфигурацию Caddy для одного env, управляемого CLI."
keywords: "nb proxy caddy generate,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy generate

Генерирует или обновляет входную конфигурацию Caddy для одного env, управляемого CLI.

## Использование

```bash
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя env, управляемого CLI, для которого нужно сгенерировать конфигурацию |
| `--host` | string | Host, который будет записан в адрес сайта, например `app1.example.com` |
| `--port` | string | Порт прослушивания, который будет записан в адрес сайта, например `8080` |

## Сгенерированные файлы

На примере env `test2` команда обычно поддерживает следующие файлы и каталоги:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`

В текущем дизайне `app.caddy` уже является полной конфигурацией сайта для одного env и больше не разделяется на отдельный файл `generated.caddy`.

## Примеры

```bash
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy generate --env demo --host demo.local.nocobase.com --port 8080
```

## Примечания

- `generate` только записывает или обновляет конфигурацию и не запускает Caddy автоматически
- Повторная генерация полностью перезаписывает `app.caddy`
- Если вы меняете параметры вроде `app-port` или `app-public-path` через `nb env update`, обычно нужно повторно запустить эту команду
- Эту команду можно использовать только для env `local` или `docker`, управляемых CLI

## Связанные команды

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy reload`](./reload.md)
- [`nb env update`](../../env/update.md)
