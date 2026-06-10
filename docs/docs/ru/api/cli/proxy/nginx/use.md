---
title: "nb proxy nginx use"
description: "Справка по команде nb proxy nginx use: переключает текущий driver provider Nginx."
keywords: "nb proxy nginx use,NocoBase CLI,nginx,driver"
---

# nb proxy nginx use

Переключает текущий driver provider Nginx.

## Использование

```bash
nb proxy nginx use <driver>
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<driver>` | string | Поддерживаются `local` и `docker` |

## Примеры

```bash
nb proxy nginx use local
nb proxy nginx use docker
```

## Примечания

- Эта команда сохраняет результат в `proxy.nginx-driver`
- Последующие команды, такие как `start`, `reload`, `stop`, `status` и `info`, будут использовать текущий driver

## Связанные команды

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
