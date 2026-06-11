---
title: "nb license status"
description: "Справочник по команде nb license status: отображение статуса коммерческой лицензии для выбранного env."
keywords: "nb license status,NocoBase CLI,license status"
---

# nb license status

Показывает статус коммерческой лицензии для выбранного env.

## Использование

```bash
nb license status [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env; если не указано, используется текущий env |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на env, отличающуюся от текущей env, пропускает интерактивное подтверждение |
| `--doctor` | boolean | Запустить дополнительные диагностические проверки и подсказки |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license status
nb license status --env app1
nb license status --env app1 --yes
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Примечания

Новый CLI пока не полностью реализует backend-проверки статуса лицензии. Команда всё ещё может вернуть базовый контекст и диагностические заполнители, но не полный вердикт по лицензии.

Если вы явно передаёте `--env`, и она отличается от текущей env, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях AI-агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
