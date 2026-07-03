---
title: "nb proxy caddy restart"
description: "Справочник по команде nb proxy caddy restart: перезапуск прокси Caddy с текущим драйвером."
keywords: "nb proxy caddy restart,NocoBase CLI,caddy,restart"
---

# nb proxy caddy restart

Перезапускает прокси Caddy с текущим драйвером.

## Использование

```bash
nb proxy caddy restart
```

## Примеры

```bash
nb proxy caddy restart
```

## Примечания

- Команда сначала останавливает прокси, а затем запускает его снова
- С драйверами `local` или `docker` она работает с локальным процессом или Docker-контейнером текущего драйвера

## Связанные команды

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy reload`](./reload.md)
