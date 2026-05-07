---
title: "nb env list"
description: "Справочник по команде nb env list: список настроенных env NocoBase CLI и состояние аутентификации API."
keywords: "nb env list,NocoBase CLI,список окружений,состояние аутентификации"
---

# nb env list

Перечисляет все настроенные env и проверяет состояние аутентификации API приложения с помощью сохранённых учётных данных Token/OAuth.

## Использование

```bash
nb env list
```

## Вывод

Таблица вывода содержит маркер текущего окружения, имя, тип, App Status, URL, метод аутентификации и версию runtime.

`App Status` показывает состояние, полученное при доступе CLI к API приложения с использованием данных аутентификации текущего env, например `ok`, `auth failed`, `unreachable` или `unconfigured`. Для просмотра состояния работы базы данных используйте [`nb db ps`](../db/ps.md).

## Примеры

```bash
nb env list
```

## Связанные команды

- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
- [`nb db ps`](../db/ps.md)
