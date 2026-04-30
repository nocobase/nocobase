---
title: "nb source build"
description: "Справочник по команде nb source build: сборка локального проекта исходного кода NocoBase."
keywords: "nb source build,NocoBase CLI,сборка,исходный код"
---

# nb source build

Собирает локальный проект исходного кода NocoBase. Эта команда перенаправляет выполнение в корневой каталог репозитория и использует прежний процесс сборки NocoBase.

## Использование

```bash
nb source build [packages...] [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[packages...]` | string[] | Имена собираемых пакетов, при пропуске собираются все |
| `--cwd`, `-c` | string | Рабочий каталог |
| `--no-dts` | boolean | Не генерировать файлы объявлений `.d.ts` |
| `--sourcemap` | boolean | Генерировать sourcemap |
| `--verbose` | boolean | Показать подробный вывод команд |

## Примеры

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
```

## Связанные команды

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
