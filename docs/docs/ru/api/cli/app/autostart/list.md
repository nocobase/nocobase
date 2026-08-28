---
title: "nb app autostart list"
description: "Справочник по команде nb app autostart list: вывод состояния автозапуска для всех настроенных окружений."
keywords: "nb app autostart list,NocoBase CLI,autostart,список окружений"
---

# nb app autostart list

Вывод состояния автозапуска для всех настроенных окружений.

Выходная таблица включает:

- `Current`: помечает текущее окружение знаком `*`
- `Env`: имя окружения
- `Kind`: тип окружения
- `Source`: тип установки или источник
- `Autostart`: включён ли автозапуск

## Использование

```bash
nb app autostart list
```

## Пример

```bash
nb app autostart list
```

## Примечания

Если пока нет ни одного сохранённого окружения, команда выведет `No environments are configured.`.

Эта команда показывает только сохранённое состояние CLI. Она не проверяет, запущено ли приложение в данный момент, и не проверяет, вызывает ли уже системный процесс загрузки `nb app autostart run`. Её основная цель — показать, какие окружения помечены для автозапуска в конфигурации CLI.

## Связанные команды

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
