---
title: "nb app stop"
description: "Справочник по команде nb app stop: остановка приложения NocoBase или Docker-контейнера указанного env."
keywords: "nb app stop,NocoBase CLI,остановка приложения,Docker"
---

# nb app stop

Остановка приложения NocoBase указанного env. Установки npm/Git останавливают локальные процессы приложения, установки Docker останавливают сохранённый контейнер приложения.

## Использование

```bash
nb app stop [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env для остановки; если не указано, используется текущий env |
| `--verbose` | boolean | Показать вывод низкоуровневых локальных или Docker-команд |

## Примеры

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Связанные команды

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
