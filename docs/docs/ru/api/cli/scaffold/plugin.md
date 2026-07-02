---
title: "nb scaffold plugin"
description: "Справочник по команде nb scaffold plugin: генерация шаблона плагина NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,шаблон плагина"
---

# nb scaffold plugin

Генерирует шаблонный код плагина NocoBase.

## Использование

```bash
nb scaffold plugin <pkg> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<pkg>` | string | Имя пакета плагина, обязательный параметр |
| `--cwd`, `-c` | string | Указать путь к корневому каталогу приложения |
| `--force-recreate`, `-f` | boolean | Принудительно пересоздать шаблон плагина |

## Примеры

```bash
nb scaffold plugin @my-project/plugin-hello
nb scaffold plugin @my-project/plugin-hello --cwd /path/to/app
nb scaffold plugin @my-project/plugin-hello --force-recreate
```

## Описание

Для source-приложений, управляемых CLI (созданных через `nb init`), плагин генерируется в каталоге `<app-path>/plugins/`, а `nb` автоматически синхронизирует плагин в `source/packages/plugins/` для процессов разработки и сборки.

Если целевой плагин уже существует, команда по умолчанию выдаст ошибку. Используйте `--force-recreate`, чтобы принудительно пересоздать его. Если на стороне source существует конфликтующий каталог или внешняя символическая ссылка, необходимо сначала вручную удалить конфликтующий элемент и повторить попытку.

## Связанные команды

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
