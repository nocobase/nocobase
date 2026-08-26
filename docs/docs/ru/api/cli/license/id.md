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
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на env, отличающуюся от текущей env, пропускает интерактивное подтверждение |
| `--force` | boolean | Принудительно пересоздать instance ID, даже если он уже сохранён |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license id
nb license id --env app1
nb license id --env app1 --yes
nb license id --env app1 --force
nb license id --env app1 --json
```

`--force` только принудительно регенерирует ID экземпляра. Он не заменяет подтверждение при работе с другой env; если явно переданный `--env` указывает не на текущую env, вам всё равно потребуется подтверждение или `--yes`.

## Связанные команды

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
