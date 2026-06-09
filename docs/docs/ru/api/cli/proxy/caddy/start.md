---
title: "nb proxy caddy start"
description: "Справка по команде nb proxy caddy start: запускает proxy Caddy с текущим driver."
keywords: "nb proxy caddy start,NocoBase CLI,caddy,start"
---

# nb proxy caddy start

Запускает proxy Caddy с текущим driver.

## Использование

```bash
nb proxy caddy start
```

## Примеры

```bash
nb proxy caddy start
```

## Примечания

- С driver `local` эта команда запускает локальный процесс Caddy
- С driver `docker` эта команда запускает или создает Docker-контейнер
- Если proxy уже запущен, команда сообщит об этом

## Связанные команды

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy status`](./status.md)
