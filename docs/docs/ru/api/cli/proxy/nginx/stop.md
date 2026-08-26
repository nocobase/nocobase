---
title: "nb proxy nginx stop"
description: "Справка по команде nb proxy nginx stop: останавливает proxy Nginx с текущим driver."
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,stop"
---

# nb proxy nginx stop

Останавливает proxy Nginx с текущим driver.

## Использование

```bash
nb proxy nginx stop
```

## Примеры

```bash
nb proxy nginx stop
```

## Примечания

- С driver `local` эта команда останавливает локальный процесс Nginx
- С driver `docker` эта команда останавливает контейнер proxy
- Если proxy уже остановлен, команда сообщит об этом

## Связанные команды

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
