---
title: "nb plugin"
description: "Справочник по команде nb plugin: управление плагинами выбранного окружения NocoBase и импорт упакованных плагинов в storage/plugins."
keywords: "nb plugin,NocoBase CLI,управление плагинами,enable,disable,list,import"
---

# nb plugin

Управляет плагинами выбранного окружения NocoBase. Для окружений типов `npm`/`git` команды плагинов выполняются локально, для окружений типа `docker` — в сохранённом контейнере приложения, а для окружений типа `http` — через API, если это доступно.

## Использование

```bash
nb plugin <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb plugin import`](./import.md) | Импортировать упакованный архив плагина или npm-пакет |
| [`nb plugin list`](./list.md) | Показать список установленных плагинов |
| [`nb plugin enable`](./enable.md) | Включить один или несколько плагинов |
| [`nb plugin disable`](./disable.md) | Отключить один или несколько плагинов |

## Примеры

```bash
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## Связанные команды

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
