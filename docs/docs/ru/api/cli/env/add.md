---
title: "nb env add"
description: "Справочник по команде nb env add: сохранение адреса API NocoBase и способа аутентификации с переключением на новый env."
keywords: "nb env add,NocoBase CLI,добавить окружение,адрес API,аутентификация"
---

# nb env add

Сохранение именованного endpoint API NocoBase и переключение CLI на использование этого env. При выборе способа аутентификации `oauth` автоматически запускается процесс входа [`nb env auth`](./auth.md).

## Использование

```bash
nb env add [name] [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[name]` | string | Имя окружения; в TTY при пропуске будет предложено ввести, в не-TTY обязательно |
| `--verbose` | boolean | Показывать подробный прогресс при записи конфигурации |
| `--locale` | string | Язык подсказок CLI: `en-US` или `zh-CN` |
| `--api-base-url`, `-u` | string | Адрес API NocoBase, включая префикс `/api` |
| `--auth-type`, `-a` | string | Способ аутентификации: `token` или `oauth` |
| `--access-token`, `-t` | string | API key или access token для способа аутентификации `token` |

## Примеры

```bash
nb env add
nb env add local
nb env add local --api-base-url http://localhost:13000/api --auth-type oauth
nb env add local --api-base-url http://localhost:13000/api --auth-type token --access-token <token>
```

## Связанные команды

- [`nb env auth`](./auth.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
