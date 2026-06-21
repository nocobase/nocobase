---
title: "nb self check"
description: "Справочник по команде nb self check: проверка версии установленного NocoBase CLI и поддержки автообновления."
keywords: "nb self check,NocoBase CLI,проверка версии"
---

# nb self check

Проверяет текущую установку NocoBase CLI, определяет последнюю версию выбранного channel и сообщает о поддержке автоматического самообновления.

## Использование

```bash
nb self check [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--channel` | string | Channel релиза для сравнения, по умолчанию `auto`; возможные значения: `auto`, `latest`, `beta`, `alpha` |
| `--json` | boolean | Вывести в формате JSON |

## Примеры

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Связанные команды

- [`nb self update`](./update.md)
