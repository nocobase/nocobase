---
title: "nb source build"
description: "Справочник по команде nb source build: сборка локального проекта исходного кода NocoBase."
keywords: "nb source build,NocoBase CLI,сборка,исходный код"
---

# nb source build

Собирает локальный проект исходного кода NocoBase. Команду необходимо выполнять в каталоге исходного кода (`<app-path>/source/`). Для приложений, управляемых CLI (source app), перед сборкой автоматически синхронизируются плагины из каталога `plugins/` в `source/packages/plugins/`.

## Использование

```bash
nb source build [packages...] [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[packages...]` | string[] | Имена собираемых пакетов; если не указаны, собираются все пакеты |
| `--cwd`, `-c` | string | Рабочий каталог |
| `--no-dts` | boolean | Не генерировать файлы объявлений `.d.ts` |
| `--sourcemap` | boolean | Генерировать карты исходников |
| `--tar` | boolean | После сборки автоматически упаковать в файл `.tgz` |
| `--verbose` | boolean | Показать подробный вывод команд |

## Примеры

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
nb source build @my-project/plugin-hello --tar
```

## Описание

При использовании `--tar` после завершения сборки указанный плагин будет упакован в файл `.tgz` и помещён в каталог `source/storage/tar/`. По завершении команда выведет полный путь к архиву.

## Связанные команды

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
