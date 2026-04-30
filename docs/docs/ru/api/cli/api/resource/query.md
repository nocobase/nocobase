---
title: "nb api resource query"
description: "Справочник по команде nb api resource query: выполнение агрегатных запросов к указанному ресурсу NocoBase."
keywords: "nb api resource query,NocoBase CLI,агрегатный запрос,статистика"
---

# nb api resource query

Выполнение агрегатных запросов к указанному ресурсу. `--measures`, `--dimensions` и `--orders` используют формат JSON-массива.

## Использование

```bash
nb api resource query --resource <resource> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--resource` | string | Имя ресурса, обязательно |
| `--data-source` | string | Ключ источника данных, по умолчанию `main` |
| `--measures` | string | Определения мер в виде JSON-массива |
| `--dimensions` | string | Определения измерений в виде JSON-массива |
| `--orders` | string | Определения сортировки в виде JSON-массива |
| `--filter` | string | Условие фильтрации в виде JSON-объекта |
| `--having` | string | Условие фильтрации после группировки в виде JSON-объекта |
| `--limit` | integer | Максимальное количество возвращаемых строк |
| `--offset` | integer | Количество пропускаемых строк |
| `--timezone` | string | Часовой пояс для форматирования запроса |

Также поддерживаются общие параметры подключения [`nb api resource`](./index.md).

## Примеры

```bash
nb api resource query --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'
nb api resource query --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'
```

## Связанные команды

- [`nb api resource list`](./list.md)
- [`nb api Динамические команды`](../dynamic.md)
