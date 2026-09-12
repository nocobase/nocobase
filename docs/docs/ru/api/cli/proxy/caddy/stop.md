---
title: "nb proxy caddy stop"
description: "Справочник по команде nb proxy caddy stop: остановка прокси Caddy с текущим драйвером."
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,stop"
---

# nb proxy caddy stop

Останавливает прокси Caddy с текущим драйвером.

## Использование

```bash
nb proxy caddy stop
```

## Примеры

```bash
nb proxy caddy stop
```

## Примечания

- С драйвером `local` команда останавливает локальный процесс Caddy
- С драйвером `docker` команда останавливает контейнер прокси
- Если прокси уже остановлен, команда сообщит об этом

## Связанные команды

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
