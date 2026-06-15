---
title: "nb app autostart disable"
description: "Справочник по nb app autostart disable: отключите автозапуск приложения для одного env."
keywords: "nb app autostart disable,NocoBase CLI,autostart,env"
---

# nb app autostart disable

Отключает флаг автозапуска приложения для одного env.

После отключения этот env больше не будет участвовать в `nb app autostart run`. Эта команда сама по себе не останавливает уже работающее приложение. Если вы также хотите остановить текущий runtime, отдельно используйте `nb app stop`.

## Использование

```bash
nb app autostart disable [flags]
```

## Флаги

| Флаг | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env, который будет удален из автозапуска. Если флаг не указан, используется текущий env |
| `--yes`, `-y` | boolean | Пропускает интерактивное подтверждение, когда явный `--env` указывает на env, отличный от текущего |

## Примеры

```bash
nb app autostart disable
nb app autostart disable --env app1
nb app autostart disable --env app1 --yes
```

## Примечания

Эта команда меняет только сохраненный флаг автозапуска. Она не останавливает приложение напрямую. Если для env автозапуск и так не был включен, команда просто оставит его в отключенном состоянии.

Как и в случае с `enable`, CLI проверяет меж-env подтверждение только при явной передаче `--env`. В неинтерактивных терминалах или потоках с AI-агентом при необходимости добавляйте `--yes` самостоятельно.

## Связанные команды

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart list`](./list.md)
- [`nb app stop`](../stop.md)
