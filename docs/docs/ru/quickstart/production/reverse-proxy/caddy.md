---
title: "Caddy"
description: "Используйте nb proxy caddy, чтобы генерировать и управлять конфигурацией reverse proxy Caddy для env NocoBase, управляемых CLI."
keywords: "NocoBase,nb proxy caddy,reverse proxy,Caddy,production"
---

# Caddy

Если у вас уже есть домен и вы хотите быстро включить HTTPS, `nb proxy caddy` обычно является самым простым входным вариантом.

## Рекомендуемый порядок

Для CLI-управляемого env типа `local` или `docker` обычно используется такой порядок:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Или с локальным процессом:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Часто используемые последующие команды:

```bash
nb proxy caddy current
nb proxy caddy status
nb proxy caddy info
nb proxy caddy reload
nb proxy caddy restart
nb proxy caddy stop
```

## Какие входные данные нужны для `generate`

Наиболее типичная форма:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Если вы также хотите указать входной порт:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Где:

- `--env`: для какого CLI env нужно сгенерировать конфигурацию
- `--host`: публичное доменное имя
- `--port`: входной порт proxy

Для Caddy параметр `--host` особенно важен, потому что адрес сайта напрямую влияет на поток HTTPS.

## Какие файлы поддерживает CLI

На примере `test2` workflow Caddy обычно поддерживает:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`
- `NB_CLI_ROOT/test2/storage/dist-client`
- `NB_CLI_ROOT/test2/storage/uploads`

Здесь:

- `nocobase.caddy` — это provider-level entry file, который импортирует все `app.caddy` для env
- `app.caddy` — это полная конфигурация сайта для одного env, и при повторной генерации он перезаписывается целиком

## Ручная конфигурация

Если приложение не управляется CLI, или вы намеренно хотите поддерживать всю конфигурацию Caddy вручную, вы всё равно можете написать её сами.

Но для NocoBase готовая к production точка входа Caddy обычно должна обрабатывать больше, чем одну простую строку `reverse_proxy`. Как правило, она также включает uploads, frontend-ресурсы, маршруты `.well-known`, WebSocket и SPA fallback pages.

Когда приложение использует размещение в подпути, или когда ресурсы, uploads и входной слой не разделяют одно и то же представление путей, ручная конфигурация становится заметно более подверженной ошибкам. В таких случаях обычно безопаснее сначала сгенерировать конфигурацию:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

## Связанные ссылки

- [Reverse proxy в продакшене](./index.md)
- [Nginx](./nginx.md)
- [Установка через CLI](../../installation/cli.md)
