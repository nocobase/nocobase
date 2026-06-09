---
title: "nb proxy caddy use"
description: "Справка по команде nb proxy caddy use: переключает текущий driver provider Caddy."
keywords: "nb proxy caddy use,NocoBase CLI,caddy,driver"
---

# nb proxy caddy use

Переключает текущий driver provider Caddy.

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

- Эта команда сохраняет результат в `proxy.caddy-driver`
- Последующие команды, такие как `start`, `reload`, `stop`, `status` и `info`, будут использовать текущий driver

## Связанные команды

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
