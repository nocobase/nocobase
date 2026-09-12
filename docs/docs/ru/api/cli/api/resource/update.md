---
title: "nb api resource update"
description: "Справочник по команде nb api resource update: обновление записи указанного ресурса NocoBase."
keywords: "nb api resource update,NocoBase CLI,обновление записи,CRUD"
---

# nb api resource update

Обновление записей в выбранном ресурсе. Для поиска записей можно использовать `--filter-by-tk` или `--filter`, а данные обновления передаются через `--values`.

## Использование

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--resource` | string | Имя ресурса, обязательно |
| `--data-source` | string | Ключ источника данных, по умолчанию `main` |
| `--source-id` | string | ID исходной записи для ресурсов связи |
| `--filter-by-tk` | string | Значение первичного ключа; для составного или нескольких ключей можно передать JSON-массив |
| `--filter` | string | Условия фильтрации в виде JSON-объекта |
| `--values` | string | Данные обновления в виде JSON-объекта, обязательно |
| `--whitelist` | string[] | Поля из белого списка, разрешённые для записи; можно передавать несколько раз или JSON-массивом |
| `--blacklist` | string[] | Поля из чёрного списка, запрещённые для записи; можно передавать несколько раз или JSON-массивом |
| `--update-association-values` | string[] | Связанные поля, которые также нужно обновить; можно передавать несколько раз или JSON-массивом |
| `--force-update` / `--no-force-update` | boolean | Принудительно ли записывать значения, которые не изменились |

Также поддерживаются общие параметры подключения [`nb api resource`](./index.md).

## Примеры

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## Связанные команды

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
