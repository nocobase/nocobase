---
title: "nb self update"
description: "Справочник по команде nb self update: обновление глобально установленного через npm NocoBase CLI."
keywords: "nb self update,NocoBase CLI,обновление,автообновление"
---

# nb self update

Обновляет установленный NocoBase CLI, если текущий CLI управляется стандартной глобальной установкой npm.

## Использование

```bash
nb self update [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--channel` | string | Channel релиза для обновления, по умолчанию `auto`; возможные значения: `auto`, `latest`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Пропустить подтверждение обновления |
| `--json` | boolean | Вывести в формате JSON |
| `--verbose` | boolean | Показать подробный вывод процесса обновления |

## Примеры

```bash
nb self update
nb self update --yes
nb self update --channel alpha --json
```

## Связанные команды

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
