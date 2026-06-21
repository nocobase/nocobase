---
title: "nb app autostart list"
description: "Справочник по nb app autostart list: покажите состояние автозапуска для всех настроенных env."
keywords: "nb app autostart list,NocoBase CLI,autostart,список env"
---

# nb app autostart list

Показывает состояние автозапуска для всех настроенных env.

Выходная таблица включает:

- `Current`: помечает текущий env знаком `*`
- `Env`: имя env
- `Kind`: тип env
- `Source`: тип установки или источник
- `Autostart`: включен ли автозапуск

## Использование

```bash
nb app autostart list
```

## Пример

```bash
nb app autostart list
```

## Примечания

Если пока нет ни одного сохраненного env, команда выведет `No environments are configured.`.

Эта команда показывает только сохраненное состояние CLI. Она не проверяет, запущено ли приложение в данный момент, и не проверяет, вызывает ли уже системный процесс запуска `nb app autostart run`. Ее основная цель — показать, какие env помечены для автозапуска в конфигурации CLI.

## Связанные команды

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
