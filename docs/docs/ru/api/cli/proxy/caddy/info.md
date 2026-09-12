---
title: "nb proxy caddy info"
description: "Справочник по команде nb proxy caddy info: вывод текущего драйвера провайдера Caddy, путей конфигурации и сведений о среде выполнения."
keywords: "nb proxy caddy info,NocoBase CLI,caddy,пути,конфигурация"
---

# nb proxy caddy info

Показывает текущий драйвер провайдера Caddy, пути конфигурации и сведения о среде выполнения.

## Использование

```bash
nb proxy caddy info
```

## Вывод

Обычно вывод включает следующие поля:

- `driver`
- `configFile`
- `runtimeRoot`
- `upstreamHost`
- `caddyBinary` или `container`
- `image`

При этом:

- для драйвера `local` выводится `caddyBinary`
- для драйвера `docker` выводятся `container` и `image`

## Примеры

```bash
nb proxy caddy info
```

## Связанные команды

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy status`](./status.md)
