---
title: "nb config"
description: "Справочник по команде nb config: управление настройками CLI по умолчанию."
keywords: "nb config,NocoBase CLI,configuration"
---

# nb config

Управление настройками CLI по умолчанию. В настоящее время поддерживаются следующие ключи:

- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`

## Использование

```bash
nb config <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb config get`](./get.md) | Получить эффективное значение ключа конфигурации |
| [`nb config set`](./set.md) | Установить значение конфигурации |
| [`nb config delete`](./delete.md) | Удалить явно заданное значение |
| [`nb config list`](./list.md) | Показать список явно заданных значений |

## Примеры

```bash
nb config list
nb config get docker.network
nb config set docker.network nocobase
nb config delete docker.container-prefix
```

## Связанные команды

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
