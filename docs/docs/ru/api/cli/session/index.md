---
title: "nb session"
description: "Справочник по команде nb session: настройка и проверка `NB_SESSION_ID` для изоляции текущего env по shell или runtime агента."
keywords: "nb session,NocoBase CLI,NB_SESSION_ID,session mode"
---

# nb session

Управляет session mode для `NB_SESSION_ID`.

После включения session mode команды `nb env use` и `nb env current` сначала используют контекст текущей shell или runtime агента, вместо того чтобы напрямую делить один глобальный current env.

## Использование


nb session <command>

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb session setup`](./setup.md) | Устанавливает интеграцию shell или runtime для `NB_SESSION_ID` |
| [`nb session id`](./id.md) | Показывает текущий фактически используемый id сессии |
| [`nb session remove`](./remove.md) | Удаляет интеграцию shell или runtime для `NB_SESSION_ID` |

## Когда это нужно

По умолчанию рекомендуется один раз выполнить `nb session setup`, когда вы начинаете пользоваться CLI. Тогда:

- терминал 1 может использовать `env1`
- терминал 2 может одновременно использовать `env2`
- runtime агента тоже может хранить свой current env

Без session mode разные сессии в итоге используют один и тот же глобальный `last env` как fallback, поэтому параллельная работа чаще влияет друг на друга.

## Связанные команды

- [`nb env current`](../env/current.md)
- [`nb env use`](../env/use.md)
- [`nb env status`](../env/status.md)
