---
title: "nb api resource get"
description: "Справочник по команде nb api resource get: получение одной записи указанного ресурса NocoBase."
keywords: "nb api resource get,NocoBase CLI,получение записи,первичный ключ"
---

# nb api resource get

Получение одной записи указанного ресурса. Обычно для указания первичного ключа используется `--filter-by-tk`.

## Использование

```bash
nb api resource get --resource <resource> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--resource` | string | Имя ресурса, обязательно |
| `--data-source` | string | Ключ источника данных, по умолчанию `main` |
| `--source-id` | string | ID исходной записи связанного ресурса |
| `--filter-by-tk` | string | Значение первичного ключа; для составных или нескольких ключей можно передать JSON-массив |
| `--fields` | string[] | Запрашиваемые поля, можно передавать несколько раз или JSON-массивом |
| `--appends` | string[] | Добавляемые связанные поля, можно передавать несколько раз или JSON-массивом |
| `--except` | string[] | Исключаемые поля, можно передавать несколько раз или JSON-массивом |

Также поддерживаются общие параметры подключения [`nb api resource`](./index.md).

## Примеры

```bash
nb api resource get --resource users --filter-by-tk 1
nb api resource get --resource posts.comments --source-id 1 --filter-by-tk 2
```

## Связанные команды

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
