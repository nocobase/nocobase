---
title: "nb session setup"
description: "Справочник по команде nb session setup: установить интеграцию shell или runtime для `NB_SESSION_ID`."
keywords: "nb session setup,NocoBase CLI,NB_SESSION_ID,интеграция shell"
---

# nb session setup

Устанавливает session-интеграцию для `NB_SESSION_ID`.

Эта команда определяет текущую shell или использует shell, переданную через `--shell`, и записывает соответствующий файл инициализации, чтобы новые shell-сессии автоматически получали `NB_SESSION_ID`.

Если на машине обнаружена конфигурация opencode, команда также записывает соответствующую plugin-интеграцию, чтобы runtime агента мог внедрять собственный `NB_SESSION_ID`.

## Использование


nb session setup [flags]

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Примечания

В большинстве случаев эту команду нужно выполнить только один раз.

После этого откройте новую shell-сессию или перезагрузите profile, чтобы `NB_SESSION_ID` инициализировался автоматически.

В runtime агента, таких как Codex, если уже есть переменная контекста вроде `CODEX_THREAD_ID`, CLI сначала использует именно её значение.

## Примеры


nb session setup
nb session setup --shell zsh
nb session setup --shell powershell

## Связанные команды

- [`nb session id`](./id.md)
- [`nb session remove`](./remove.md)
- [`nb env use`](../env/use.md)
