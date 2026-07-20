---
title: "nb proxy nginx info"
description: "Справочник по команде nb proxy nginx info: вывод текущего драйвера провайдера Nginx, путей конфигурации и сведений о среде выполнения."
keywords: "nb proxy nginx info,NocoBase CLI,nginx,пути,конфигурация"
---

# nb proxy nginx info

Показывает текущий драйвер провайдера Nginx, пути конфигурации и сведения о среде выполнения.

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
