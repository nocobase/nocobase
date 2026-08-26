---
title: "nb proxy nginx generate"
description: "Справка по команде nb proxy nginx generate: генерирует или обновляет конфигурацию Nginx для одного env, управляемого CLI."
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx generate

Генерирует или обновляет входную конфигурацию Nginx для одного env, управляемого CLI.

## Использование

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя env, управляемого CLI, для которого нужно сгенерировать конфигурацию |
| `--host` | string | Host, который будет записан во входную конфигурацию, например `app1.example.com` |
| `--port` | string | Порт прослушивания, который будет записан во входную конфигурацию, например `8080` |

## Сгенерированные файлы

На примере env `test2` команда обычно поддерживает следующие файлы и каталоги:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

Сгенерированная входная конфигурация Nginx охватывает такие основные области:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

## Примеры

```bash
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx generate --env demo --host demo.local.nocobase.com --port 8080
```

## Примечания

- `generate` только записывает или обновляет конфигурацию и не запускает Nginx автоматически
- `app.conf` — редактируемый входной файл, но управляемый блок внутри него должен оставаться без изменений
- Если вы меняете параметры вроде `app-port` или `app-public-path` через `nb env update`, обычно нужно повторно запустить эту команду
- Эту команду можно использовать только для env `local` или `docker`, управляемых CLI

## Связанные команды

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
