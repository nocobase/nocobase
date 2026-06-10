---
title: "nb proxy caddy"
description: "Справка по группе команд nb proxy caddy: управление driver provider Caddy, генерацией конфигурации и runtime-контролем."
keywords: "nb proxy caddy,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy

`nb proxy caddy` — это точка входа группы команд для provider Caddy.

Если у вас уже есть домен, вы хотите быстро включить HTTPS и не хотите вручную поддерживать слишком много деталей TLS, обычно стоит начинать отсюда. Эта группа решает две задачи:

- выбрать способ запуска Caddy — `local` или `docker`
- генерировать, запускать, перезагружать и проверять входную конфигурацию Caddy для env, управляемых CLI

## Использование

```bash
nb proxy caddy <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | Переключает driver Caddy |
| [`nb proxy caddy current`](./current.md) | Показывает текущий driver |
| [`nb proxy caddy generate`](./generate.md) | Генерирует или обновляет конфигурацию Caddy для одного env |
| [`nb proxy caddy start`](./start.md) | Запускает proxy Caddy |
| [`nb proxy caddy restart`](./restart.md) | Перезапускает proxy Caddy |
| [`nb proxy caddy reload`](./reload.md) | Перезагружает конфигурацию Caddy |
| [`nb proxy caddy stop`](./stop.md) | Останавливает proxy Caddy |
| [`nb proxy caddy status`](./status.md) | Показывает runtime-статус Caddy |
| [`nb proxy caddy info`](./info.md) | Показывает driver, пути конфигурации и сведения о runtime |

## Примечания

- Текущий driver хранится в `proxy.caddy-driver`
- Driver по умолчанию — `local`
- Локальный driver использует исполняемый файл, указанный в `bin.caddy`, его значение по умолчанию — `caddy`
- Docker driver использует `caddy:latest`
- Имя Docker-контейнера по умолчанию — `<docker.container-prefix>-caddy-proxy`
- Docker driver монтирует `NB_CLI_ROOT` хоста в контейнер по пути `/apps`

## Типовой рабочий процесс

```bash
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app1.example.com
nb proxy caddy start
nb proxy caddy status
nb proxy caddy info
```

## Связанные команды

- [`nb proxy`](../index.md)
- [`nb proxy nginx`](../nginx/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
