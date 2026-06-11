---
title: "nb proxy nginx info"
description: "Справка по команде nb proxy nginx info: показать текущий драйвер provider Nginx, пути конфигурации и runtime-детали."
keywords: "nb proxy nginx info,NocoBase CLI,nginx,пути,конфигурация"
---

# nb proxy nginx info

Показывает текущий драйвер provider Nginx, пути конфигурации и runtime-детали.

## Использование

```bash
nb proxy nginx info
```

## Вывод

Обычно вывод включает следующие поля:

- `driver`
- `configFile`
- `snippetsDir`
- `runtimeRoot`
- `upstreamHost`
- `nginxBinary` или `container`
- `image`

При этом:

- для драйвера `local` выводится `nginxBinary`
- для драйвера `docker` выводятся `container` и `image`

## Примеры

```bash
nb proxy nginx info
```

## Связанные команды

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx status`](./status.md)
