---
title: "nb skills"
description: "Справочник по команде nb skills: проверка, установка, обновление или удаление глобальных AI coding Skills NocoBase."
keywords: "nb skills,NocoBase CLI,Skills,AI coding skills"
---

# nb skills

Проверка, установка, обновление или удаление глобальных AI coding Skills NocoBase.

## Использование

```bash
nb skills <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb skills check`](./check.md) | Проверяет глобальные AI coding Skills NocoBase |
| [`nb skills install`](./install.md) | Устанавливает AI coding Skills NocoBase глобально |
| [`nb skills update`](./update.md) | Обновляет установленные AI coding Skills NocoBase |
| [`nb skills remove`](./remove.md) | Удаляет AI coding Skills NocoBase, управляемые `nb` |

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
