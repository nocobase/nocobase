---
title: "nb proxy nginx"
description: "Справочник по группе команд nb proxy nginx: управление драйвером провайдера Nginx, генерацией конфигурации и контролем среды выполнения."
keywords: "nb proxy nginx,NocoBase CLI,nginx,обратный прокси,конфигурация прокси"
---

# nb proxy nginx

`nb proxy nginx` — точка входа группы команд провайдера Nginx.

Если вы уже используете Nginx для управления сайтами, сертификатами, кэшем или контролем доступа, обычно стоит начинать отсюда. Эта группа решает две задачи:

- выбрать способ запуска Nginx — `local` или `docker`
- генерировать, запускать, перезагружать и проверять точку входа Nginx для окружений, управляемых CLI

## Использование

```bash
nb proxy nginx <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | Переключить драйвер Nginx |
| [`nb proxy nginx current`](./current.md) | Показать текущий драйвер |
| [`nb proxy nginx generate`](./generate.md) | Сгенерировать или обновить конфигурацию Nginx для одного окружения |
| [`nb proxy nginx start`](./start.md) | Запустить прокси Nginx |
| [`nb proxy nginx restart`](./restart.md) | Перезапустить прокси Nginx |
| [`nb proxy nginx reload`](./reload.md) | Перезагрузить конфигурацию Nginx |
| [`nb proxy nginx stop`](./stop.md) | Остановить прокси Nginx |
| [`nb proxy nginx status`](./status.md) | Показать состояние среды выполнения Nginx |
| [`nb proxy nginx info`](./info.md) | Показать драйвер, пути конфигурации и сведения о среде выполнения |

## Примечания

- Текущий драйвер хранится в `proxy.nginx-driver`
- Драйвер по умолчанию — `local`
- Локальный драйвер использует исполняемый файл, указанный в `bin.nginx`; по умолчанию это `nginx`
- Драйвер `docker` использует `nginx:latest`
- Имя Docker-контейнера по умолчанию — `<docker.container-prefix>-nginx-proxy`
- Драйвер `docker` монтирует `NB_CLI_ROOT` хоста в контейнер по пути `/apps`

## Типичный рабочий процесс

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app1.example.com
nb proxy nginx start
nb proxy nginx status
nb proxy nginx info
```

## Связанные команды

- [`nb proxy`](../index.md)
- [`nb proxy caddy`](../caddy/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
