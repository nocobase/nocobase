---
title: "nb app autostart enable"
description: "Справочник по nb app autostart enable: включите автозапуск приложения для одного локального или Docker env."
keywords: "nb app autostart enable,NocoBase CLI,autostart,env"
---

# nb app autostart enable

Включает флаг автозапуска приложения для одного env.

Этот флаг применяется только к `local` или `docker` env, чей runtime управляется CLI на текущей машине. Он не запускает приложение немедленно. Вместо этого env добавляется в набор, который позже может быть запущен через `nb app autostart run`.

## Использование

```bash
nb app autostart enable [flags]
```

## Флаги

| Флаг | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env, который будет добавлен в автозапуск. Если флаг не указан, используется текущий env |
| `--yes`, `-y` | boolean | Пропускает интерактивное подтверждение, когда явный `--env` указывает на env, отличный от текущего |

## Примеры

```bash
nb app autostart enable
nb app autostart enable --env app1
nb app autostart enable --env app1 --yes
```

## Примечания

CLI проверяет, отличается ли целевой env от текущего, только если вы явно передали `--env`. В интерактивных терминалах сначала будет подтверждение. В неинтерактивных терминалах или потоках с AI-агентом вам нужно самостоятельно добавить `--yes` или сначала переключиться на нужный env через `nb env use <name>`.

Если целевой env не является управляемым CLI `local` или `docker` runtime на текущей машине, команда завершится ошибкой и не сохранит флаг автозапуска.

## Связанные команды

- [`nb app autostart disable`](./disable.md)
- [`nb app autostart list`](./list.md)
- [`nb app autostart run`](./run.md)
