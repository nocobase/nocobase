---
title: "nb proxy caddy use"
description: "Справочник по команде nb proxy caddy use: переключение текущего драйвера провайдера Caddy."
keywords: "nb proxy caddy use,NocoBase CLI,caddy,драйвер"
---

# nb proxy caddy use

Переключает текущий драйвер провайдера Caddy.

## Использование

```bash
nb proxy caddy use <driver>
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<driver>` | string | Поддерживаются `local` и `docker` |

## Примеры

```bash
nb proxy caddy use local
nb proxy caddy use docker
```

## Примечания

- Команда сохраняет результат в `proxy.caddy-driver`
- Последующие команды, такие как `start`, `reload`, `stop`, `status` и `info`, используют текущий драйвер

## Связанные команды

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
