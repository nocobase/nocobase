---
title: "nb proxy nginx use"
description: "Справочник по команде nb proxy nginx use: переключение текущего драйвера провайдера Nginx."
keywords: "nb proxy nginx use,NocoBase CLI,nginx,драйвер"
---

# nb proxy nginx use

Переключает текущий драйвер провайдера Nginx.

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

- Команда сохраняет результат в `proxy.nginx-driver`
- Последующие команды, такие как `start`, `reload`, `stop`, `status` и `info`, используют текущий драйвер

## Связанные команды

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
