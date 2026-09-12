---
title: "nb proxy caddy start"
description: "Справочник по команде nb proxy caddy start: запуск прокси Caddy с текущим драйвером."
keywords: "nb proxy caddy start,NocoBase CLI,caddy,start"
---

# nb proxy caddy start

Запускает прокси Caddy с текущим драйвером.

## Использование

```bash
nb proxy caddy start
```

## Примеры

```bash
nb proxy caddy start
```

## Примечания

- С драйвером `local` команда запускает локальный процесс Caddy
- С драйвером `docker` команда запускает или создаёт Docker-контейнер
- Если прокси уже запущен, команда сообщит об этом

## Связанные команды

- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy status`](./status.md)
