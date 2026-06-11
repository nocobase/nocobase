---
title: "nb proxy caddy stop"
description: "Справка по команде nb proxy caddy stop: останавливает proxy Caddy с текущим driver."
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,stop"
---

# nb proxy caddy stop

Останавливает proxy Caddy с текущим driver.

## Использование

```bash
nb proxy caddy stop
```

## Примеры

```bash
nb proxy caddy stop
```

## Примечания

- С driver `local` эта команда останавливает локальный процесс Caddy
- С driver `docker` эта команда останавливает контейнер proxy
- Если proxy уже остановлен, команда сообщит об этом

## Связанные команды

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
