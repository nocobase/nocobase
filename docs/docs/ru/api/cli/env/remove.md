---
title: "nb env remove"
description: "Справочник по команде nb env remove: удаление конфигурации указанного env NocoBase CLI."
keywords: "nb env remove,NocoBase CLI,удаление окружения,удаление конфигурации"
---

# nb env remove

Удаляет настроенный env. Эта команда удаляет только конфигурацию env CLI; для очистки локального приложения, контейнеров и storage используйте [`nb app down`](../app/down.md).

## Использование

```bash
nb env remove <name> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<name>` | string | Имя удаляемого окружения |
| `--force`, `-f` | boolean | Пропустить подтверждение и удалить сразу |
| `--verbose` | boolean | Показать подробный прогресс |

## Примеры

```bash
nb env remove staging
nb env remove staging -f
```

## Связанные команды

- [`nb app down`](../app/down.md)
- [`nb env list`](./list.md)
