---
title: "nb skills"
description: "Справочник по команде nb skills: проверка, установка, обновление или удаление глобальных навыков ИИ-разработки NocoBase."
keywords: "nb skills,NocoBase CLI,навыки,навыки ИИ-разработки"
---

# nb skills

Проверка, установка, обновление или удаление глобальных навыков ИИ-разработки NocoBase.

## Использование

```bash
nb skills <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb skills check`](./check.md) | Проверить глобальные навыки ИИ-разработки NocoBase |
| [`nb skills install`](./install.md) | Установить навыки ИИ-разработки NocoBase глобально |
| [`nb skills update`](./update.md) | Обновить установленные навыки ИИ-разработки NocoBase |
| [`nb skills remove`](./remove.md) | Удалить навыки ИИ-разработки NocoBase, управляемые `nb` |

## Примеры

```bash
nb skills check
nb skills install --yes
nb skills update --json
nb skills remove --yes
```

## Связанные команды

- [`nb init`](../init.md)
- [`nb self`](../self/index.md)
