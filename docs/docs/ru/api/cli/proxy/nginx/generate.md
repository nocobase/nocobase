---
title: "nb proxy nginx generate"
description: "Справочник по команде nb proxy nginx generate: генерация или обновление конфигурации Nginx для одного окружения, управляемого CLI."
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,обратный прокси,конфигурация прокси"
---

# nb proxy nginx generate

Генерирует или обновляет входную конфигурацию Nginx для одного окружения, управляемого CLI.

## Использование

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя окружения, управляемого CLI, для которого нужно сгенерировать конфигурацию |
| `--host` | string | Хост, который будет записан во входную конфигурацию, например `app1.example.com` |
| `--port` | string | Порт прослушивания, который будет записан во входную конфигурацию, например `8080` |

## Сгенерированные файлы

На примере окружения `test2` команда обычно поддерживает следующие файлы и каталоги:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

Сгенерированная точка входа Nginx охватывает такие основные области:

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
- Если вы меняете параметры вроде `app-port` или `app-public-path` через `nb env update`, обычно нужно повторно выполнить эту команду
- Эту команду можно использовать только для окружений типов `local` или `docker`, управляемых CLI

## Связанные команды

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
