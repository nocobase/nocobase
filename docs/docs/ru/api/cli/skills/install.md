---
title: "nb skills install"
description: "Справочник по команде nb skills install: глобальная установка AI coding Skills NocoBase."
keywords: "nb skills install,NocoBase CLI,установка Skills"
---

# nb skills install

Глобально устанавливает AI coding Skills NocoBase. Если они уже установлены, эта команда не выполняет обновление.

## Использование

```bash
nb skills install [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Пропустить подтверждение установки |
| `--json` | boolean | Вывести в формате JSON |
| `--verbose` | boolean | Показать подробный вывод процесса установки |

## Примеры

```bash
nb skills install
nb skills install --yes
nb skills install --json
```

## Связанные команды

- [`nb skills check`](./check.md)
- [`nb skills update`](./update.md)
