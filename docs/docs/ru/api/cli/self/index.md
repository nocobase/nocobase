---
title: "nb self"
description: "Справочник по команде nb self: проверка или обновление установленного NocoBase CLI."
keywords: "nb self,NocoBase CLI,автообновление,проверка версии"
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
| [`nb self check`](./check.md) | Проверяет текущую версию CLI и поддержку автообновления |
| [`nb self update`](./update.md) | Обновляет глобально установленный через npm NocoBase CLI |

## Примеры

```bash
nb self check
nb self check --json
nb self update --yes
```

## Связанные команды

- [`nb skills`](../skills/index.md)
- [`nb app upgrade`](../app/upgrade.md)
