---
title: "Развёртывание в production"
description: "Быстро завершите production-развёртывание NocoBase: сначала настройте auto-start приложения, затем reverse proxy."
keywords: "NocoBase,production deployment,nb app autostart,nb proxy nginx,nb proxy caddy,Nginx,Caddy"
---

# Развёртывание в production

Если ваше приложение NocoBase уже нормально работает на сервере, для production-развёртывания обычно остаётся сделать только две вещи:

1. убедиться, что приложение может автоматически восстановиться после перезагрузки машины
2. добавить entrypoint reverse proxy, чтобы приложение было стабильно доступно извне

В NocoBase CLI основные группы команд для этого такие:

- `nb app autostart`
- `nb proxy`

Эта страница сначала объясняет общий путь. За деталями по Nginx или Caddy переходите на страницы конкретных provider.

## Шаг 1: настроить auto-start приложения

В production приоритетом является не доменное имя, а то, насколько надёжно сервис сам восстанавливается. Иначе после перезагрузки машины, пересоздания контейнера или операционных действий приложение может не подняться автоматически.

Наиболее часто используемые подкоманды `nb app autostart`:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Включить auto-start для текущего env:

```bash
nb app autostart enable
```

Если целевое env не является текущим, укажите его явно:

```bash
nb app autostart enable --env app1 --yes
```

Проверить, какие env помечены для auto-start:

```bash
nb app autostart list
```

После загрузки системы запустить все включённые env:

```bash
nb app autostart run
```

Если при отладке вам нужен подробный вывод запуска:

```bash
nb app autostart run --verbose
```

:::tip Что на самом деле делает этот шаг

`nb app autostart enable` помечает CLI-managed env как разрешённое к автоматическому запуску. `nb app autostart run` уже фактически запускает все env, для которых auto-start включён.

В production обычно всё равно нужно встроить `nb app autostart run` в собственный системный стартовый поток — например, через `systemd`, стартовый скрипт контейнерной платформы или другой уже используемый хостовый механизм автоматического запуска.

:::

### Применимость

`nb app autostart` работает только для env, у которых runtime управляется CLI:

- `local`
- `docker`

Если env — это только удалённое API-подключение, или приложение не управляется локально через CLI на текущей машине, эта группа команд не подходит для auto-start.

## Шаг 2: настроить reverse proxy

После того как приложение умеет автоматически восстанавливаться, следующий шаг — внешний entrypoint. В production reverse proxy обычно отвечает за:

- привязку доменного имени или входного порта
- пересылку HTTP- и WebSocket-запросов в NocoBase
- управление HTTPS, сертификатами, кэшем или контролем доступа

Рекомендуемые CLI entrypoint:

- `nb proxy nginx`
- `nb proxy caddy`

### Поток по умолчанию

Если приложение уже сохранено как CLI env и это env имеет тип `local` или `docker`, обычно проще всего дать CLI самой сгенерировать конфигурацию:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com

nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
```

После этого запустите выбранный provider:

```bash
nb proxy nginx start
nb proxy caddy start
```

CLI также помогает с деталями, которые легко упустить в ручной конфигурации, например:

- пересылка WebSocket
- URL entrypoint и assets под subpath
- SPA fallback pages
- общие конфигурационные файлы на уровне provider

### Когда выбирать Nginx или Caddy

| Сценарий | Рекомендация |
| --- | --- |
| Вы уже используете Nginx для управления сайтами, кэшем, сертификатами или контролем доступа | [Nginx](./reverse-proxy/nginx.md) |
| У вас уже есть домен, и вы хотите быстро включить HTTPS, поддерживая меньше TLS-деталей вручную | [Caddy](./reverse-proxy/caddy.md) |
| Сначала нужна общая вводная | [Reverse Proxy в production](./reverse-proxy/index.md) |

Если позже вы измените параметры env вроде `app-port` или `app-public-path`, влияющие на поведение proxy, повторно выполните соответствующую proxy-подкоманду.

## Стандартный путь rollout

Для самого простого production-rollout обычно достаточно такой последовательности:

1. убедиться, что приложение уже может нормально запускаться на самом сервере
2. выполнить `nb app autostart enable`
3. встроить `nb app autostart run` в системный поток запуска
4. выбрать Nginx или Caddy и выполнить соответствующую подкоманду `nb proxy`
5. проверить внешний доступ по доменному имени или входному адресу

## Быстрый индекс

| Я хочу... | Куда перейти |
| --- | --- |
| Сначала прочитать общее введение по reverse proxy | [Reverse Proxy в production](./reverse-proxy/index.md) |
| Продолжать использовать Nginx на входном уровне | [Nginx](./reverse-proxy/nginx.md) |
| Использовать Caddy, чтобы быстрее получить HTTPS | [Caddy](./reverse-proxy/caddy.md) |
| Посмотреть операции запуска, остановки, логов и обновления приложения | [Управление приложением](../operations/manage-app.md) |
| Прочитать CLI-справку по `nb proxy nginx` | [`nb proxy nginx`](../../api/cli/proxy/nginx/index.md) |
| Прочитать CLI-справку по `nb proxy caddy` | [`nb proxy caddy`](../../api/cli/proxy/caddy/index.md) |

## Связанные команды

```bash
# Включить auto-start для одного env
nb app autostart enable --env app1 --yes

# Проверить состояние auto-start
nb app autostart list

# Запустить все включённые env
nb app autostart run

# Выбрать runtime Nginx и сгенерировать конфигурацию
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com
nb proxy nginx start

# Выбрать runtime Caddy и сгенерировать конфигурацию
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
nb proxy caddy start
```
