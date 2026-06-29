---
title: "nb session id"
description: "Справочник по команде nb session id: вывод текущего действующего `NB_SESSION_ID`."
keywords: "nb session id,NocoBase CLI,NB_SESSION_ID,идентификатор сессии"
---

# nb session id

Показывает текущий фактически используемый id сессии.

Если в текущей оболочке или среде выполнения нет пригодного `NB_SESSION_ID`, команда предложит сначала выполнить [`nb session setup`](./setup.md), а затем открыть новую сессию оболочки или новую среду выполнения.

## Использование

```bash
nb session id
```

## Примеры

```bash
nb session id
```

## Связанные команды

- [`nb session setup`](./setup.md)
- [`nb env current`](../env/current.md)
