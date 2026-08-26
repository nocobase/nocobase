---
title: "nb api resource update"
description: "Справочник по команде nb api resource update: обновление записи указанного ресурса NocoBase."
keywords: "nb api resource update,NocoBase CLI,обновление записи,CRUD"
---

# nb api resource update

Обновление записи указанного ресурса. Для определения записи можно использовать `--filter-by-tk` или `--filter`, а содержимое обновления передаётся через `--values`.

## Использование

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--resource` | string | Имя ресурса, обязательно |
| `--data-source` | string | Ключ источника данных, по умолчанию `main` |
| `--source-id` | string | ID исходной записи связанного ресурса |
| `--filter-by-tk` | string | Значение первичного ключа; для составных или нескольких ключей можно передать JSON-массив |
| `--filter` | string | Условие фильтрации в виде JSON-объекта |
| `--values` | string | Данные обновления записи, JSON-объект, обязательно |
| `--whitelist` | string[] | Поля, разрешённые для записи, можно передавать несколько раз или JSON-массивом |
| `--blacklist` | string[] | Поля, запрещённые для записи, можно передавать несколько раз или JSON-массивом |
| `--update-association-values` | string[] | Связанные поля, которые также должны обновляться, можно передавать несколько раз или JSON-массивом |
| `--force-update` / `--no-force-update` | boolean | Принудительно записывать ли значения, которые не изменились |

Также поддерживаются общие параметры подключения [`nb api resource`](./index.md).

## Примеры

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## Связанные команды

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
