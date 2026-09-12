---
title: "nb api resource create"
description: "Справочник по команде nb api resource create: создание одной или нескольких записей указанного ресурса NocoBase."
keywords: "nb api resource create,NocoBase CLI,создание записи,CRUD"
---

# nb api resource create

Создание записей в выбранном ресурсе. Данные передаются через `--values` в виде JSON-объекта; JSON-массив объектов создаёт несколько записей за один запрос.

## Использование

```bash
nb api resource create --resource <resource> --values <json> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--resource` | string | Имя ресурса, обязательно |
| `--data-source` | string | Ключ источника данных, по умолчанию `main` |
| `--source-id` | string | ID исходной записи для ресурсов связи |
| `--values` | string | Данные новых записей: JSON-объект или JSON-массив объектов для создания нескольких записей, обязательно |
| `--whitelist` | string[] | Поля из белого списка, разрешённые для записи; можно передавать несколько раз или JSON-массивом |
| `--blacklist` | string[] | Поля из чёрного списка, запрещённые для записи; можно передавать несколько раз или JSON-массивом |

Также поддерживаются общие параметры подключения [`nb api resource`](./index.md).

## Примеры

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource users --values '[{"nickname":"Ada"},{"nickname":"Grace"}]'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## Связанные команды

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
