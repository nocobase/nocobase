---
title: "nb proxy caddy"
description: "Справочник по группе команд nb proxy caddy: управление драйвером провайдера Caddy, генерацией конфигурации и контролем среды выполнения."
keywords: "nb proxy caddy,NocoBase CLI,caddy,обратный прокси,конфигурация прокси"
---

# nb proxy caddy

`nb proxy caddy` — точка входа группы команд провайдера Caddy.

Если у вас уже есть домен, вы хотите быстро включить HTTPS и не хотите вручную поддерживать слишком много деталей TLS, обычно стоит начинать отсюда. Эта группа решает две задачи:

- выбрать способ запуска Caddy — `local` или `docker`
- генерировать, запускать, перезагружать и проверять точку входа Caddy для окружений, управляемых CLI

## Использование

```bash
nb proxy caddy <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | Переключить драйвер Caddy |
| [`nb proxy caddy current`](./current.md) | Показать текущий драйвер |
| [`nb proxy caddy generate`](./generate.md) | Сгенерировать или обновить конфигурацию Caddy для одного окружения |
| [`nb proxy caddy start`](./start.md) | Запустить прокси Caddy |
| [`nb proxy caddy restart`](./restart.md) | Перезапустить прокси Caddy |
| [`nb proxy caddy reload`](./reload.md) | Перезагрузить конфигурацию Caddy |
| [`nb proxy caddy stop`](./stop.md) | Остановить прокси Caddy |
| [`nb proxy caddy status`](./status.md) | Показать состояние среды выполнения Caddy |
| [`nb proxy caddy info`](./info.md) | Показать драйвер, пути конфигурации и сведения о среде выполнения |

## Примечания

- Текущий драйвер хранится в `proxy.caddy-driver`
- Драйвер по умолчанию — `local`
- Локальный драйвер использует исполняемый файл, указанный в `bin.caddy`; по умолчанию это `caddy`
- Драйвер `docker` использует `caddy:latest`
- Имя Docker-контейнера по умолчанию — `<docker.container-prefix>-caddy-proxy`
- Драйвер `docker` монтирует `NB_CLI_ROOT` хоста в контейнер по пути `/apps`

## Типичный рабочий процесс

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
