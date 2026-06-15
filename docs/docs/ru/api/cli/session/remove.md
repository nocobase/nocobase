---
title: "nb session remove"
description: "Справочник по команде nb session remove: удалить интеграцию shell или runtime для `NB_SESSION_ID`."
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,удалить session-интеграцию"
---

# nb session remove

Удаляет session-интеграцию для `NB_SESSION_ID`.

Эта команда очищает конфигурацию shell, ранее записанную [`nb session setup`](./setup.md). Если обнаружена plugin-интеграция opencode, она тоже будет удалена.

## Использование


nb session remove [flags]

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Примеры


nb session remove
nb session remove --shell zsh

## Связанные команды

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
