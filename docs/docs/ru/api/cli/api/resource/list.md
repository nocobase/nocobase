---
title: "nb api resource list"
description: "Справочник по команде nb api resource list: вывод списка записей указанного ресурса NocoBase."
keywords: "nb api resource list,NocoBase CLI,список,ресурс"
---

# nb api resource list

Вывод списка записей указанного ресурса. Для управления запросом можно использовать параметры `--filter`, `--fields`, `--sort`, `--page` и др.

## Использование

```bash
nb api resource list --resource <resource> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--resource` | string | Имя ресурса, обязательно |
| `--data-source` | string | Ключ источника данных, по умолчанию `main` |
| `--source-id` | string | ID исходной записи связанного ресурса |
| `--filter` | string | Условие фильтрации в виде JSON-объекта |
| `--fields` | string[] | Запрашиваемые поля, можно передавать несколько раз или JSON-массивом |
| `--appends` | string[] | Добавляемые связанные поля, можно передавать несколько раз или JSON-массивом |
| `--except` | string[] | Исключаемые поля, можно передавать несколько раз или JSON-массивом |
| `--sort` | string[] | Поля сортировки, например `-createdAt`, можно передавать несколько раз или JSON-массивом |
| `--page` | integer | Номер страницы |
| `--page-size` | integer | Количество записей на странице |
| `--paginate` / `--no-paginate` | boolean | Использовать ли постраничный вывод |

Также поддерживаются общие параметры подключения [`nb api resource`](./index.md).

## Примеры

```bash
nb api resource list --resource users
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
nb api resource list --resource users --filter '{"status":"active"}' --sort=-createdAt
```

## Связанные команды

- [`nb api resource get`](./get.md)
- [`nb api resource query`](./query.md)
