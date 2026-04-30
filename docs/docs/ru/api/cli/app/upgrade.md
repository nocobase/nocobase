---
title: "nb app upgrade"
description: "Справочник по команде nb app upgrade: обновление исходников или образа и перезапуск указанного приложения NocoBase."
keywords: "nb app upgrade,NocoBase CLI,обновление,апгрейд,Docker-образ"
---

# nb app upgrade

Обновление указанного приложения NocoBase. Установки npm/Git обновляют сохранённые исходники и перезапускаются в режиме quickstart; установки Docker обновляют сохранённый образ и пересоздают контейнер приложения.

## Использование

```bash
nb app upgrade [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env для обновления; если не указано, используется текущий env |
| `--skip-code-update`, `-s` | boolean | Перезапустить с использованием уже сохранённых локальных исходников или Docker-образа, не загружая обновления заново |
| `--verbose` | boolean | Показать вывод низкоуровневых команд обновления и перезапуска |

## Примеры

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

## Связанные команды

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
