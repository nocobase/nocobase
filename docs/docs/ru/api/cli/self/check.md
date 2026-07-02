---
title: "nb self check"
description: "Справочник по команде nb self check: проверка версии установленного NocoBase CLI и поддержки автообновления."
keywords: "nb self check,NocoBase CLI,проверка версии"
---

# nb self check

Проверяет текущую установку NocoBase CLI, определяет последнюю версию выбранного channel и сообщает о поддержке автоматического самообновления.

## Использование

```bash
nb self check [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--channel` | string | Channel релиза для сравнения, по умолчанию `auto`; возможные значения: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--json` | boolean | Вывести в формате JSON |

## Метод установки

`nb self check` определяет текущий метод установки во время выполнения. Исторический cache `self-install-methods.json` не используется.

Команда может вывести такие методы установки:

| Метод установки | Значение |
| --- | --- |
| `npm-global` | CLI установлен в текущем `npm prefix -g`. |
| `pnpm-global` | CLI установлен в глобальном дереве `node_modules` pnpm. |
| `yarn-global` | CLI запускается из `yarn global bin` или установлен в `yarn global dir`. |
| `package-local` | CLI установлен в дереве зависимостей локального проекта. |
| `source` | CLI запущен из checkout репозитория. |
| `unknown` | Установку CLI не удалось сопоставить с поддерживаемым методом установки. |

Самообновление поддерживается для `npm-global`, `pnpm-global` и `yarn-global`. Для `package-local` или `source` обновляйте родительский проект или checkout репозитория.

## Примеры

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Связанные команды

- [`nb self update`](./update.md)
