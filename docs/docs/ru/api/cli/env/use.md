---
title: "nb env use"
description: "Справочник по команде nb env use: переключение текущего env NocoBase CLI."
keywords: "nb env use,NocoBase CLI,переключение окружения,current env"
---

# nb env use

Переключает текущий env CLI. После этого команды без флага `--env` будут по умолчанию использовать выбранный env.

## Использование

```bash
nb env use <name>
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<name>` | string | Имя настроенного окружения |

## Примеры

```bash
nb env use local
```

## Связанные команды

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
