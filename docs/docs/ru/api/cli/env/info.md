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
| `[name]` | string | Имя настроенного env для просмотра; если не указано, используется текущий env |
| `--json` | boolean | Вывести в формате JSON |
| `--show-secrets` | boolean | Отображать токены, пароли и другие секреты в открытом виде |

## Примеры

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
```

## Связанные команды

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
