---
title: "nb proxy nginx"
description: "Справка по группе команд nb proxy nginx: управление driver provider Nginx, генерацией конфигурации и runtime-контролем."
keywords: "nb proxy nginx,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx

`nb proxy nginx` — это точка входа группы команд для provider Nginx.

Если вы уже используете Nginx для управления сайтами, сертификатами, кешем или контролем доступа, обычно стоит начинать отсюда. Эта группа решает две задачи:

- выбрать способ запуска Nginx — `local` или `docker`
- генерировать, запускать, перезагружать и проверять входную конфигурацию Nginx для env, управляемых CLI

## Использование

```bash
nb proxy nginx <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | Переключает driver Nginx |
| [`nb proxy nginx current`](./current.md) | Показывает текущий driver |
| [`nb proxy nginx generate`](./generate.md) | Генерирует или обновляет конфигурацию Nginx для одного env |
| [`nb proxy nginx start`](./start.md) | Запускает proxy Nginx |
| [`nb proxy nginx restart`](./restart.md) | Перезапускает proxy Nginx |
| [`nb proxy nginx reload`](./reload.md) | Перезагружает конфигурацию Nginx |
| [`nb proxy nginx stop`](./stop.md) | Останавливает proxy Nginx |
| [`nb proxy nginx status`](./status.md) | Показывает runtime-статус Nginx |
| [`nb proxy nginx info`](./info.md) | Показывает driver, пути конфигурации и сведения о runtime |

## Примечания

- Текущий driver хранится в `proxy.nginx-driver`
- Driver по умолчанию — `local`
- Локальный driver использует исполняемый файл, указанный в `bin.nginx`, его значение по умолчанию — `nginx`
- Docker driver использует `nginx:latest`
- Имя Docker-контейнера по умолчанию — `<docker.container-prefix>-nginx-proxy`
- Docker driver монтирует `NB_CLI_ROOT` хоста в контейнер по пути `/apps`

## Типовой рабочий процесс

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
