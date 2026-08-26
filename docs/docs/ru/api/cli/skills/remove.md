---
title: "nb skills remove"
description: "Справочник по команде nb skills remove: удаление глобальных AI coding Skills NocoBase."
keywords: "nb skills remove,NocoBase CLI,удаление Skills"
---

# nb skills remove

Удаляет глобальные AI coding Skills NocoBase, управляемые `nb`.

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
