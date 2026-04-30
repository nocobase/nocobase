---
title: "nb api"
description: "Справочник по команде nb api: вызов API NocoBase через CLI, включая универсальные команды resource и динамические команды."
keywords: "nb api,NocoBase CLI,API,resource,OpenAPI"
---

# nb api

Вызов API NocoBase через CLI. `nb api` содержит универсальные команды CRUD [`nb api resource`](./resource/index.md), а также команды, динамически генерируемые на основе OpenAPI Schema текущего приложения.

## Использование

```bash
nb api <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb api resource`](./resource/index.md) | Выполнение универсальных CRUD-операций и агрегатных запросов на любых ресурсах NocoBase |
| [`nb api Динамические команды`](./dynamic.md) | Команды topic и operation, генерируемые на основе OpenAPI Schema приложения |

## Общие параметры

Большинство команд `nb api` поддерживают следующие параметры подключения:

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--api-base-url` | string | Адрес API NocoBase, например `http://localhost:13000/api` |
| `--env`, `-e` | string | Имя окружения |
| `--token`, `-t` | string | Переопределение API key |
| `--role` | string | Переопределение роли, отправляется как HTTP-заголовок `X-Role` |
| `--verbose` | boolean | Показать подробный прогресс |
| `--json-output`, `-j` / `--no-json-output` | boolean | Выводить ли исходный JSON, по умолчанию включено |

## Примеры

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 --no-json-output
```

## Связанные команды

- [`nb env update`](../env/update.md)
- [`nb env add`](../env/add.md)
