---
title: "nb app down"
description: "Справочник по команде nb app down: остановка и очистка локальных runtime-ресурсов указанного env."
keywords: "nb app down,NocoBase CLI,очистка ресурсов,удаление контейнера,storage"
---

# nb app down

Остановка и очистка локальных runtime-ресурсов указанного env. По умолчанию данные storage и конфигурация env сохраняются; для удаления всего содержимого необходимо явно передать `--all --yes`.

## Использование

```bash
nb app down [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env для очистки; если не указано, используется текущий env |
| `--all` | boolean | Удалить всё содержимое этого env, включая данные storage и сохранённую конфигурацию env |
| `--yes`, `-y` | boolean | Пропустить подтверждение деструктивных операций, обычно используется вместе с `--all` |
| `--verbose` | boolean | Показать вывод низкоуровневых команд остановки и очистки |

## Примеры

```bash
nb app down --env app1
nb app down --env app1 --all --yes
```

## Связанные команды

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
