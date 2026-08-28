---
title: "nb skills update"
description: "Справочник по команде nb skills update: обновление глобальных навыков ИИ-разработки NocoBase."
keywords: "nb skills update,NocoBase CLI,обновление навыков"
---

# nb skills update

Обновляет глобально установленные навыки ИИ-разработки NocoBase. Эта команда обновляет только существующую установку `@nocobase/skills`.

## Использование

```bash
nb skills update [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Пропустить подтверждение обновления |
| `--json` | boolean | Вывести в формате JSON |
| `--verbose` | boolean | Показать подробный вывод процесса обновления |

## Примеры

```bash
nb skills update
nb skills update --yes
nb skills update --verbose
nb skills update --json
```

## Связанные команды

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
