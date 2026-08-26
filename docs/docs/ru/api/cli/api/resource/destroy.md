---
title: "nb api resource destroy"
description: "Справочник по команде nb api resource destroy: удаление записи указанного ресурса NocoBase."
keywords: "nb api resource destroy,NocoBase CLI,удаление записи,CRUD"
---

# nb api resource destroy

Удаление записи указанного ресурса. Для определения записи можно использовать `--filter-by-tk` или `--filter`.

## Использование

```bash
nb api resource destroy --resource <resource> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--resource` | string | Имя ресурса, обязательно |
| `--data-source` | string | Ключ источника данных, по умолчанию `main` |
| `--source-id` | string | ID исходной записи связанного ресурса |
| `--filter-by-tk` | string | Значение первичного ключа; для составных или нескольких ключей можно передать JSON-массив |
| `--filter` | string | Условие фильтрации в виде JSON-объекта |

Также поддерживаются общие параметры подключения [`nb api resource`](./index.md).

## Примеры

```bash
nb api resource destroy --resource users --filter-by-tk 1
nb api resource destroy --resource posts --filter '{"status":"archived"}'
```

## Связанные команды

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
