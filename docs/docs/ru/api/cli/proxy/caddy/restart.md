---
title: "nb proxy caddy restart"
description: "Справка по команде nb proxy caddy restart: перезапускает proxy Caddy с текущим driver."
keywords: "nb proxy caddy restart,NocoBase CLI,caddy,restart"
---

# nb proxy caddy restart

Перезапускает proxy Caddy с текущим driver.

## Использование

```bash
nb proxy caddy restart
```

## Примеры

```bash
nb proxy caddy restart
```

## Примечания

- Эта команда сначала останавливает proxy, а затем запускает его снова
- При `local` или `docker` она работает с локальным процессом или Docker-контейнером, соответствующим текущему driver

## Связанные команды

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy reload`](./reload.md)
