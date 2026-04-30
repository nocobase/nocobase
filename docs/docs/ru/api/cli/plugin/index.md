---
title: "nb plugin"
description: "Справочник по команде nb plugin: управление плагинами выбранного env NocoBase."
keywords: "nb plugin,NocoBase CLI,управление плагинами,enable,disable,list"
---

# nb plugin

Управление плагинами выбранного env NocoBase. Для env типа npm/Git команды плагинов выполняются локально, для Docker env — в сохранённом контейнере приложения, а для HTTP env — через API при его доступности.

## Использование

```bash
nb plugin <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb plugin list`](./list.md) | Перечисляет установленные плагины |
| [`nb plugin enable`](./enable.md) | Включает один или несколько плагинов |
| [`nb plugin disable`](./disable.md) | Отключает один или несколько плагинов |

## Примеры

```bash
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## Связанные команды

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
