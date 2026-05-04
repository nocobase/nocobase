---
title: "nb license id"
description: "Справочник по команде nb license id: отображение или повторная генерация instance ID коммерческой лицензии для выбранного env."
keywords: "nb license id,NocoBase CLI,instance id"
---

# nb license id

Показывает instance ID коммерческой лицензии для выбранного env. Если сохранённого instance ID ещё нет, CLI автоматически создаст и сохранит его.

## Использование

```bash
nb license id [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env; если не указано, используется текущий env |
| `--force` | boolean | Принудительно пересоздать instance ID, даже если он уже сохранён |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license id
nb license id --env app1
nb license id --env app1 --force
nb license id --env app1 --json
```

## Связанные команды

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
