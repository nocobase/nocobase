---
title: "nb env add"
description: "Справочник по команде nb env add: сохранение URL API NocoBase и способа аутентификации с последующим переключением на это окружение."
keywords: "nb env add,NocoBase CLI,добавить окружение,API Base URL,аутентификация"
---

# nb env add

Сохраняет именованный адрес API NocoBase и переключает CLI на использование этого окружения. При выборе способа аутентификации `oauth` автоматически запускается [`nb env auth`](./auth.md).

Команда выполняет две операции:

- сохраняет конфигурацию окружения;
- переключает текущее окружение на только что добавленное.

Если для текущей оболочки или среды выполнения включён режим сессии, обновляется `current env` сессии. Также обновляется глобальный `last env` как запасной вариант для оболочек и сред выполнения без режима сессии.

## Использование

```bash
nb env add [name] [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[name]` | string | Имя окружения, которое нужно сохранить; в TTY при отсутствии будет запрошено, в не-TTY режиме обязательно |
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
- [`nb env current`](./current.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
