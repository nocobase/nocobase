---
title: "nb skills remove"
description: "Справочник по команде nb skills remove: удаление глобальных навыков ИИ-разработки NocoBase."
keywords: "nb skills remove,NocoBase CLI,удаление навыков"
---

# nb skills remove

Удаляет глобальные навыки ИИ-разработки NocoBase, управляемые `nb`.

## Использование

```bash
nb skills remove [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Пропустить подтверждение удаления |
| `--json` | boolean | Вывести в формате JSON |
| `--verbose` | boolean | Показать подробный вывод процесса удаления |

## Примеры

```bash
nb skills remove
nb skills remove --yes
nb skills remove --json
```

## Связанные команды

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
