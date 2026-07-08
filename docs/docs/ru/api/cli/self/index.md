---
title: "nb self"
description: "Справочник по команде nb self: проверка или обновление установленного NocoBase CLI."
keywords: "nb self,NocoBase CLI,самообновление,проверка версии"
---

# nb self

Проверка или обновление установленного NocoBase CLI.

## Использование

```bash
nb self <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb self check`](./check.md) | Проверить текущую версию CLI и поддержку самообновления |
| [`nb self update`](./update.md) | Обновить NocoBase CLI, глобально установленный через npm, pnpm или yarn |

## Примеры

```bash
nb self check
nb self check --json
nb self update --yes
```

## Связанные команды

- [`nb skills`](../skills/index.md)
- [`nb app upgrade`](../app/upgrade.md)
