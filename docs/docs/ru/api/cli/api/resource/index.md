---
title: "nb api resource"
description: "Справочник по команде nb api resource: универсальные CRUD-операции и агрегатные запросы для любых ресурсов NocoBase."
keywords: "nb api resource,NocoBase CLI,CRUD,ресурс,таблица"
---

# nb api resource

Выполнение универсальных CRUD-операций и агрегатных запросов для любых ресурсов NocoBase. Имя ресурса может быть как обычным ресурсом, например `users`, так и связанным ресурсом, например `posts.comments`.

## Использование

```bash
nb api resource <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb api resource list`](./list.md) | Список записей ресурса |
| [`nb api resource get`](./get.md) | Получение одной записи ресурса |
| [`nb api resource create`](./create.md) | Создание записи ресурса |
| [`nb api resource update`](./update.md) | Обновление записи ресурса |
| [`nb api resource destroy`](./destroy.md) | Удаление записи ресурса |
| [`nb api resource query`](./query.md) | Выполнение агрегатных запросов |

## Общие параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--api-base-url` | string | Адрес API NocoBase, например `http://localhost:13000/api` |
| `--verbose` | boolean | Показать подробный прогресс |
| `--env`, `-e` | string | Имя окружения |
| `--role` | string | Переопределение роли, отправляется как HTTP-заголовок `X-Role` |
| `--token`, `-t` | string | Переопределение API key |
| `--json-output`, `-j` / `--no-json-output` | boolean | Выводить ли исходный JSON, по умолчанию включено |
| `--resource` | string | Имя ресурса, обязательно, например `users`, `orders`, `posts.comments` |
| `--data-source` | string | Ключ источника данных, по умолчанию `main` |

Команды связанных ресурсов также можно сочетать с `--source-id` для указания ID исходной записи.

## Примеры

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
```

## Связанные команды

- [`nb api`](../index.md)
- [`nb env update`](../../env/update.md)
