---
title: 'nb app'
description: 'Справочник по команде nb app: управление средой выполнения приложения NocoBase, включая запуск, остановку, перезапуск, логи и обновление.'
keywords: 'nb app,NocoBase CLI,запуск,остановка,перезапуск,логи,обновление'
---

# nb app

Управление средой выполнения приложения NocoBase. В npm/Git-окружениях команды приложения выполняются в локальном каталоге исходного кода; в Docker-окружениях контейнеры приложения управляются на основе сохранённой конфигурации.

## Использование

```bash
nb app <command>
```

## Подкоманды

| Команда                          | Описание                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| [`nb app start`](./start.md)     | Запускает приложение или пересоздаёт Docker-контейнер                                |
| [`nb app stop`](./stop.md)       | Останавливает приложение или очищает Docker-контейнер                                |
| [`nb app restart`](./restart.md) | Сначала останавливает, затем запускает приложение                                    |
| [`nb app autostart`](./autostart/index.md) | Управляет флагами автозапуска и запускает все включённые окружения |
| [`nb app logs`](./logs.md)       | Просматривает логи приложения                                                        |
| [`nb app upgrade`](./upgrade.md) | Останавливает приложение, заменяет исходный код или образ, затем снова запускает его |

## Примеры

```bash
nb app start --env app1
nb app restart --env app1
nb app autostart enable --env app1 --yes
nb app autostart run
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app stop --env app1 --with-db
```

## Связанные команды

- [`nb env info`](../env/info.md)
- [`nb env remove`](../env/remove.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
