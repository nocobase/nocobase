---
title: "Reverse proxy в продакшене"
description: "Используйте nb proxy nginx и nb proxy caddy, чтобы генерировать и управлять конфигурацией reverse proxy для env NocoBase, управляемых CLI."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,reverse proxy,Nginx,Caddy,production"
---

# Reverse proxy в продакшене

В NocoBase CLI рекомендуемыми точками входа для reverse proxy в продакшене являются:

- `nb proxy nginx`
- `nb proxy caddy`

Здесь:

- `proxy` управляет входным слоем
- `nginx` и `caddy` — это реализации provider
- `docker` и `local` — это runtime driver
- `--env <name>` выбирает, для какого CLI env нужно сгенерировать конфигурацию

Если приложение уже сохранено как env, управляемый CLI, и этот env имеет тип `local` или `docker`, обычно достаточно поручить CLI генерацию и управление reverse proxy. Так обработка WebSocket, подпути, SPA fallback и последующие обновления будут согласованы в одном месте.

Если приложение не управляется CLI, или вы намеренно хотите поддерживать всю конфигурацию вручную, перейдите к разделам ручной настройки на страницах provider.

## Перед началом

Убедитесь, что:

- приложение уже доступно по внутреннему адресу, например `http://127.0.0.1:13000`
- приложение уже сохранено как CLI env, и этот env имеет тип `local` или `docker`
- в env уже сохранён `appPort`

Если команда сообщает, что в env отсутствует `appPort`, сначала обновите его через [`nb env update`](../../../api/cli/env/update.md).

Если позже вы измените настройки вроде `app-port` или `app-public-path`, влияющие на поведение proxy, повторно выполните соответствующую команду `generate`.

## Стандартный поток

Для Nginx:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Для Caddy:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Роли этих шагов:

- `use docker|local`: выбрать runtime driver для текущего provider
- `generate --env <name> --host <domain>`: сгенерировать конфигурацию reverse proxy для одного env
- `start`: запустить локальный процесс или Docker-контейнер текущего provider

## Что поддерживает CLI

CLI делает больше, чем просто генерирует один фрагмент proxy. Он также поддерживает вспомогательные файлы и структуру входа сайта в соответствии с provider:

- Nginx поддерживает общие `snippets`, `app.conf`, `public/index-v1.html` и `public/index-v2.html`
- Caddy поддерживает `nocobase.caddy`, `app.caddy`, `public/index-v1.html` и `public/index-v2.html`, где `app.caddy` — это полная конфигурация сайта для одного env

## С какой страницы начать

| Я хочу... | Куда перейти |
| --- | --- |
| Продолжать использовать Nginx для сайтов, сертификатов, кэша или контроля доступа | [Nginx](./nginx.md) |
| Быстро включить HTTPS и меньше вручную поддерживать детали TLS | [Caddy](./caddy.md) |
| Изменить настройки env, которые могут влиять на поведение proxy, например `app-port` или `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Сначала установить приложение как env, управляемый CLI | [Установка через CLI](../../installation/cli.md) |
