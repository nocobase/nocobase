---
title: "nb self update"
description: "Справочник по команде nb self update: обновление NocoBase CLI, глобально установленного через npm, pnpm или yarn."
keywords: "nb self update,NocoBase CLI,обновление,самообновление"
---

# nb self update

Обновляет установленный NocoBase CLI, если текущий CLI управляется стандартной глобальной установкой через npm, pnpm или yarn.

## Использование

```bash
nb self update [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--channel` | string | Канал релиза для обновления, по умолчанию `auto`; возможные значения: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Пропустить подтверждение обновления |
| `--json` | boolean | Вывести в формате JSON |
| `--skills` | boolean | Также обновить глобально установленные навыки ИИ-разработки NocoBase |
| `--verbose` | boolean | Показать подробный вывод процесса обновления |

## Поведение обновления

`nb self update` сначала определяет текущий способ установки при выполнении команды. Исторический кэш `self-install-methods.json` не используется.

Когда доступно обновление, команда использует тот же менеджер пакетов, который управляет текущей глобальной установкой CLI:

| Способ установки | Команда обновления |
| --- | --- |
| `npm-global` | `npm install -g @nocobase/cli@<channel>` |
| `pnpm-global` | `pnpm add -g @nocobase/cli@<channel>` |
| `yarn-global` | `yarn global add @nocobase/cli@<channel>` |

В интерактивном режиме по умолчанию предлагается подтверждение. Используйте `--yes`, чтобы пропустить запрос подтверждения в сценариях.

## Примеры

```bash
nb self update
nb self update --yes
nb self update --skills
nb self update --channel alpha --json
```

## Связанные команды

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
