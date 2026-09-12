---
title: "nb session remove"
description: "Справочник по команде nb session remove: удаление интеграции оболочки или среды выполнения для `NB_SESSION_ID`."
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,удаление интеграции сессии"
---

# nb session remove

Удаляет интеграцию сессии для `NB_SESSION_ID`.

Эта команда очищает конфигурацию оболочки, ранее записанную [`nb session setup`](./setup.md). Если обнаружена интеграция плагина opencode, она тоже будет удалена.

## Использование

```bash
nb session remove [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--shell` | string | Целевая оболочка. Поддерживаемые значения: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Примеры

```bash
nb session remove
nb session remove --shell zsh
```

## Связанные команды

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
