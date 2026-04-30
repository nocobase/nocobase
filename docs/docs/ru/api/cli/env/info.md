---
title: "nb env info"
description: "Справочник по команде nb env info: просмотр конфигурации приложения, базы данных, API и аутентификации указанного env NocoBase CLI."
keywords: "nb env info,NocoBase CLI,подробности окружения,конфигурация"
---

# nb env info

Просмотр подробной информации об одном env, включая конфигурацию приложения, базы данных, API и аутентификации.

## Использование

```bash
nb env info [name] [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[name]` | string | Имя env CLI для просмотра, при пропуске используется текущий env |
| `--env`, `-e` | string | Имя env CLI для просмотра, альтернатива позиционному аргументу |
| `--json` | boolean | Вывести в формате JSON |
| `--show-secrets` | boolean | Отображать токены, пароли и другие секреты в открытом виде |

Если переданы одновременно `[name]` и `--env`, они должны совпадать.

## Примеры

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
nb env info --env app1
```

## Связанные команды

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
