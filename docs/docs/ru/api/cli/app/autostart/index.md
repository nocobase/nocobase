---
title: "nb app autostart"
description: "Справочник по группе команд nb app autostart: включайте или отключайте автозапуск для локальных или Docker env и запускайте все включенные env одним действием."
keywords: "nb app autostart,NocoBase CLI,autostart,local,docker"
---

# nb app autostart

Управляет настройками автозапуска приложения.

Эта группа команд охватывает два типа задач:

- включение или отключение флага автозапуска для одного env
- запуск всех env, для которых автозапуск уже включен

`nb app autostart` применяется только к env с runtime, управляемым CLI на текущей машине, то есть `local` и `docker`. Если env — это только удаленное API-подключение, или это не управляемый CLI runtime приложения, который можно запустить на этой машине, он не может участвовать в этом процессе автозапуска.

## Использование

```bash
nb app autostart <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb app autostart enable`](./enable.md) | Включает флаг автозапуска для одного env |
| [`nb app autostart disable`](./disable.md) | Отключает флаг автозапуска для одного env |
| [`nb app autostart list`](./list.md) | Показывает состояние автозапуска всех env |
| [`nb app autostart run`](./run.md) | Запускает все env с включенным автозапуском |

## Примечания

`nb app autostart enable` только помечает env как разрешенный для автоматического запуска. Сам по себе этот флаг не встраивает env в системный процесс загрузки. В реальной production-конфигурации обычно все равно нужно вызывать `nb app autostart run` из собственного механизма запуска хоста, например через `systemd`, стартовый скрипт контейнерной платформы или другой уже используемый boot-процесс.

Кроме того, `nb app autostart run` проверяет каждый включенный env по очереди. Env, которые можно запустить, продолжают работу через `nb app start --env <name> --yes`. Env, которые не должны автоматически запускаться на текущей машине, появятся в таблице результатов как `skipped` или `failed`.

## Примеры

```bash
nb app autostart enable
nb app autostart enable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Связанные команды

- [`nb app start`](../start.md)
- [`nb app stop`](../stop.md)
- [`nb env list`](../../env/list.md)
- [`nb env use`](../../env/use.md)
