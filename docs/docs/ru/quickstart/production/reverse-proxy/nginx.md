---
title: "Nginx"
description: "Используйте nb proxy nginx, чтобы генерировать и управлять конфигурацией reverse proxy Nginx для env NocoBase, управляемых CLI."
keywords: "NocoBase,nb proxy nginx,reverse proxy,Nginx,production"
---

# Nginx

Если вы уже используете Nginx на сервере для управления сайтами или хотите и дальше самостоятельно поддерживать сертификаты, кэширование и контроль доступа, `nb proxy nginx` — рекомендуемый путь.

## Рекомендуемый порядок

Для CLI-управляемого env типа `local` или `docker` обычно используется такой порядок:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Или с локальным процессом:

```bash
nb proxy nginx use local
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Часто используемые последующие команды:

```bash
nb proxy nginx current
nb proxy nginx status
nb proxy nginx info
nb proxy nginx reload
nb proxy nginx restart
nb proxy nginx stop
```

## Какие входные данные нужны для `generate`

Наиболее типичная форма:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Если вы также хотите указать входной порт:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Где:

- `--env`: для какого CLI env нужно сгенерировать конфигурацию
- `--host`: публичное доменное имя
- `--port`: входной порт proxy, а не собственный `appPort` приложения

Если в env отсутствует `appPort`, сначала сохраните его с помощью `nb env update test2 --app-port 56575`.

## Какие файлы поддерживает CLI

На примере `test2` workflow Nginx обычно поддерживает:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- `NB_CLI_ROOT/test2/storage/dist-client`
- `NB_CLI_ROOT/test2/storage/uploads`

Полноценная сгенерированная точка входа Nginx обычно покрывает такие области:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

Это значит, что реальная production-конфигурация NocoBase обычно не сводится к одному простому блоку `proxy_pass`.

## Ручная конфигурация

Если приложение не управляется CLI, или вы намеренно хотите поддерживать всю конфигурацию Nginx вручную, вы всё равно можете написать её сами.

Но для NocoBase готовый к production reverse proxy обычно должен обрабатывать не только проксирование на backend, но и uploads, frontend-ресурсы, WebSocket, маршруты `.well-known` и SPA fallback pages.

Когда приложение использует размещение в подпути, или когда ресурсы, uploads и proxy не разделяют одно и то же представление путей, ручная конфигурация становится заметно более подверженной ошибкам. В таких случаях обычно безопаснее сначала сгенерировать конфигурацию:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

## Связанные ссылки

- [Reverse proxy в продакшене](./index.md)
- [Caddy](./caddy.md)
- [Установка через CLI](../../installation/cli.md)
