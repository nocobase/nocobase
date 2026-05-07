---
title: "nb env update"
description: "Справочник по команде nb env update: обновление OpenAPI Schema и кэша runtime-команд указанного env."
keywords: "nb env update,NocoBase CLI,OpenAPI,runtime-команды,swagger"
---

# nb env update

Обновляет OpenAPI Schema из приложения NocoBase и обновляет локальный кэш runtime-команд. Кэш сохраняется в `.nocobase/versions/<hash>/commands.json`.

## Использование

```bash
nb env update [name] [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[name]` | string | Имя окружения, при пропуске используется текущий env |
| `--verbose` | boolean | Показать подробный прогресс |
| `--api-base-url` | string | Переопределить адрес API NocoBase и сохранить его в целевом env |
| `--role` | string | Переопределение роли, отправляется как заголовок запроса `X-Role` |
| `--token`, `-t` | string | Переопределение API key и сохранение его в целевом env |

## Примеры

```bash
nb env update
nb env update prod
nb env update prod --api-base-url http://localhost:13000/api
nb env update prod --token <token>
```

## Связанные команды

- [`nb api`](../api/index.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
