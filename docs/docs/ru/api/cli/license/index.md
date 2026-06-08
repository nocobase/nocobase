---
title: "nb license"
description: "Справочник по команде nb license: управление коммерческими лицензиями и лицензированными плагинами NocoBase."
keywords: "nb license,NocoBase CLI,commercial licensing"
---

# nb license

Управляет коммерческим лицензированием NocoBase, включая активацию с существующим license key, Instance ID, статус лицензии и лицензированные плагины.

## Использование

```bash
nb license <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb license activate`](./activate.md) | Активировать коммерческую лицензию для текущего env с существующим license key |
| [`nb license id`](./id.md) | Показать или сгенерировать instance ID для текущего env |
| [`nb license status`](./status.md) | Показать статус коммерческой лицензии для текущего env |
| [`nb license plugins`](./plugins/index.md) | Управлять коммерческими плагинами, разрешёнными текущей лицензией |

## Примеры

```bash
nb license id --env app1
nb license activate --env app1 --key-file ./license.txt
nb license status --env app1
nb license plugins list --env app1
nb license plugins sync --env app1
```

## Связанные команды

- [`nb config`](../config/index.md)
- [`nb plugin`](../plugin/index.md)
- [`nb db check`](../db/check.md)
