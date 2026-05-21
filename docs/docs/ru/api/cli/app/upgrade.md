---
title: "nb app upgrade"
description: "Справочник по команде nb app upgrade: обновление исходников или образа и перезапуск указанного приложения NocoBase."
keywords: "nb app upgrade,NocoBase CLI,обновление,апгрейд,Docker-образ"
---

# nb app upgrade

Обновление указанного приложения NocoBase. Установки npm/Git обновляют сохранённые исходники и перезапускаются в режиме quickstart; установки Docker обновляют сохранённый образ и пересоздают контейнер приложения.

## Использование

```bash
nb app upgrade [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env для обновления; если не указано, используется текущий env |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на env, отличающуюся от текущей env, пропускает интерактивное подтверждение |
| `--skip-code-update`, `-s` | boolean | Перезапустить с использованием уже сохранённых локальных исходников или Docker-образа, не загружая обновления заново |
| `--version` | string | Переопределяет сохранённую `downloadVersion`; после успешного обновления новая версия будет записана обратно в конфигурацию env |
| `--verbose` | boolean | Показать вывод низкоуровневых команд обновления и перезапуска |

## Примеры

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

Если вы явно передаёте `--env`, и она отличается от текущей env, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях AI-агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
