---
title: "nb plugin import"
description: "Справочник по команде nb plugin import: импортирует упакованный архив плагина или npm-пакет в каталог storage/plugins выбранного env NocoBase или в пользовательский путь storage."
keywords: "nb plugin import,NocoBase CLI,импорт плагина,storage-path,npm-registry"
---

# nb plugin import

Импортирует упакованный архив плагина или npm-пакет в `storage/plugins`. Эта команда только помещает плагин в целевой каталог. Автоматически она его не включает.

## Использование

```bash
nb plugin import <archive> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<archive>` | string | Источник плагина. Обязательный параметр. Поддерживается локальный путь `.tgz`, удалённый URL архива `http(s)` или имя / tag npm-пакета |
| `--env`, `-e` | string | Имя CLI env. Если параметр не указан, обычно используется текущий env. Если ты явно передаёшь `--storage-path`, `--env` можно не указывать |
| `--yes`, `-y` | boolean | Пропускает интерактивное подтверждение, если явно переданный `--env` указывает на env, отличный от текущего |
| `--storage-path` | string | Переопределяет корневой путь целевого storage. Фактический каталог импорта — `<storage-path>/plugins` |
| `--npm-registry` | string | Указывает, какой npm registry использовать, если источник — это имя или tag npm-пакета |

## Примеры

```bash
# Удалённый архив
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# Локальный архив
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm-пакет или tag
nb plugin import @my-scope/plugin-auth-cas@beta

# Приватный npm registry
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# Запись прямо в локальный путь storage без привязки к текущему env
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## Примечания

Если целевой env уже выбран, обычно достаточно импортировать плагин прямо в `storage/plugins` этого env.

Если тебе нужно только записать плагин в локальный каталог storage, передай `--storage-path`. В этом случае `--env` можно опустить, и CLI запишет файлы прямо в `<storage-path>/plugins`.

После импорта следующим обычным шагом будет перезапуск приложения, а затем решение, нужно ли ещё и включать плагин. В большинстве случаев:

- При первой установке сначала запусти [`nb app restart`](../app/restart.md), а потом [`nb plugin enable`](./enable.md)
- Если ты просто повторно импортировал более новую версию, сначала перезапусти приложение, а затем проверь, что новая версия уже загрузилась

Если источник находится в приватном npm registry, сначала выполни вход, а потом запускай импорт:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning Примечание

Тебе не нужно вручную распаковывать что-либо в `storage/plugins`. `nb plugin import` сам поместит плагин в правильный каталог.

:::

## Связанные команды

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`Установка и обновление сторонних плагинов`](../../../quickstart/plugins/third-party.md)
