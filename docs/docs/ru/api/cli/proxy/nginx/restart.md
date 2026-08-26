---
title: "nb proxy nginx restart"
description: "Справка по команде nb proxy nginx restart: перезапускает proxy Nginx с текущим driver."
keywords: "nb proxy nginx restart,NocoBase CLI,nginx,restart"
---

# nb proxy nginx restart

Перезапускает proxy Nginx с текущим driver.

## Использование

```bash
nb proxy nginx restart
```

## Примеры

```bash
nb proxy nginx restart
```

## Примечания

- Эта команда сначала останавливает proxy, а затем запускает его снова
- При `local` или `docker` она работает с локальным процессом или Docker-контейнером, соответствующим текущему driver

## Связанные команды

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx reload`](./reload.md)
