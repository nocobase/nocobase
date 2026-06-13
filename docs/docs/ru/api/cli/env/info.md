---
title: 'nb env info'
description: 'Справка по команде nb env info: просмотр конфигурации приложения, базы данных, API и аутентификации для указанного env в NocoBase CLI.'
keywords: 'nb env info,NocoBase CLI,сведения об окружении,конфигурация'
---

# nb env info

Просмотр подробной информации об одном env, включая конфигурацию приложения, базы данных, API и аутентификации.

## Использование

```bash
nb env info [name] [flags]
```

## Параметры

| Параметр         | Тип     | Описание                                                                                                       |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `[name]`         | string  | Имя настроенного окружения для просмотра; если не указано, используется текущий env                            |
| `--json`         | boolean | Вывод в формате JSON                                                                                           |
| `--field`        | string  | Возвращает только одно поле, используя путь через точку, например `app.url`, `app.appPath` или `api.auth.type` |
| `--show-secrets` | boolean | Показывает токены, пароли и другие секреты в открытом виде                                                     |

## Примеры

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --field app.appPath
nb env info app1 --show-secrets
```

## Связанные команды

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
