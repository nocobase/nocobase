---
title: "nb self check"
description: "Справочник по команде nb self check: проверка версии установленного NocoBase CLI и поддержки самообновления."
keywords: "nb self check,NocoBase CLI,проверка версии"
---

# nb self check

Проверяет текущую установку NocoBase CLI, определяет последнюю версию для выбранного канала релиза и сообщает, поддерживается ли самообновление.

## Использование

```bash
nb self check [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--channel` | string | Канал релиза для сравнения, по умолчанию `auto`; возможные значения: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--json` | boolean | Вывести в формате JSON |

## Способ установки

`nb self check` определяет текущий способ установки при выполнении команды. Исторический кэш `self-install-methods.json` не используется.

Команда может вывести такие способы установки:

| Способ установки | Описание |
| --- | --- |
| `npm-global` | CLI установлен в текущем `npm prefix -g`. |
| `pnpm-global` | CLI установлен в глобальном дереве `node_modules` pnpm. |
| `yarn-global` | CLI запускается из `yarn global bin` или установлен в `yarn global dir`. |
| `package-local` | CLI установлен в дереве зависимостей локального проекта. |
| `source` | CLI запущен из рабочей копии репозитория. |
| `unknown` | Установку CLI не удалось сопоставить с поддерживаемым способом установки. |

Самообновление поддерживается для `npm-global`, `pnpm-global` и `yarn-global`. Для `package-local` или `source` обновляйте родительский проект или рабочую копию репозитория.

## Примеры

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Связанные команды

- [`nb self update`](./update.md)
