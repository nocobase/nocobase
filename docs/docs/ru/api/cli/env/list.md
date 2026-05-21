---
title: "nb env list"
description: "Справочник по команде nb env list: список настроенных env NocoBase CLI."
keywords: "nb env list,NocoBase CLI,список окружений,API Base URL"
---

# nb env list

Показывает все настроенные env.

Эта команда показывает только сохранённую конфигурацию. Когда нужно проверить статус, используйте [`nb env status`](./status.md).

## Использование


nb env list

## Вывод

Таблица вывода включает маркер текущего окружения, имя, тип, `API Base URL`, тип аутентификации и версию runtime.

- `Current` помечает фактически активный env символом `*`
- `API Base URL` показывает сохранённый исходный адрес API
- `Runtime` показывает кэшированную информацию о версии runtime

## Примеры


nb env list

## Связанные команды

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
