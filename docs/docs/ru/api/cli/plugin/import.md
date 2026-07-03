---
title: "nb plugin import"
description: "Справочник по команде nb plugin import: импорт упакованного архива плагина или npm-пакета в каталог storage/plugins выбранного окружения NocoBase или в пользовательский путь хранилища."
keywords: "nb plugin import,NocoBase CLI,импорт плагина,storage-path,npm-registry"
---

# nb plugin import

Импортирует упакованный архив плагина или npm-пакет в `storage/plugins`. Команда только помещает плагин в целевой каталог и не включает его автоматически.

## Использование

```bash
nb plugin import <archive> [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<archive>` | string | Источник плагина; обязательный параметр. Поддерживаются локальный путь `.tgz`, удалённый URL архива `http(s)` или имя npm-пакета / тег |
| `--env`, `-e` | string | Имя CLI-окружения; если не указано, обычно используется текущее окружение. Если явно передан `--storage-path`, `--env` можно не указывать |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на окружение, отличное от текущего, пропускает интерактивное подтверждение |
| `--storage-path` | string | Переопределяет корневой путь целевого хранилища; фактический каталог импорта — `<storage-path>/plugins` |
| `--npm-registry` | string | Указывает реестр npm, который нужно использовать, если источник — имя или тег npm-пакета |

## Примеры

```bash
# Удалённый архив
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# Локальный архив
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm-пакет или тег
nb plugin import @my-scope/plugin-auth-cas@beta

# Приватный реестр npm
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# Запись напрямую в локальный путь хранилища без привязки к текущему окружению
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## Примечания

Если целевое окружение уже выбрано, путь по умолчанию — `storage/plugins` этого окружения.

Если нужно только записать плагин в локальный каталог хранилища, передайте `--storage-path`. В этом случае `--env` можно опустить, и CLI запишет файлы напрямую в `<storage-path>/plugins`.

После завершения импорта обычно следует перезапустить приложение, а затем решить, нужно ли также включить плагин. В большинстве случаев:

- при первой установке сначала выполните [`nb app restart`](../app/restart.md), а затем [`nb plugin enable`](./enable.md);
- если вы только повторно импортировали более новый архив, сначала перезапустите приложение, а затем проверьте, что новая версия загрузилась.

Если источник находится в приватном реестре npm, сначала выполните вход, а затем импортируйте пакет:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning Примечание

Вручную распаковывать что-либо в `storage/plugins` не нужно: `nb plugin import` автоматически поместит плагин в правильный каталог.

:::

## Связанные команды

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`Установка и обновление сторонних плагинов`](../../../nocobase-cli/plugins/third-party.md)
