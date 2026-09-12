---
title: "nb env current"
description: "Справочник по команде nb env current: показать текущее фактически используемое окружение NocoBase CLI."
keywords: "nb env current,NocoBase CLI,текущее окружение,current env"
---

# nb env current

Показывает имя текущего фактически используемого окружения.

По умолчанию команда сначала читает окружение сессии для текущего `NB_SESSION_ID`. Если режим сессии не включён для текущей оболочки или среды выполнения, используется глобальный `last env` как запасной вариант.

## Использование

```bash
nb env current
```

## Примеры

```bash
nb env current
```

## Связанные команды

- [`nb env use`](./use.md)
- [`nb env status`](./status.md)
- [`nb session setup`](../session/setup.md)
