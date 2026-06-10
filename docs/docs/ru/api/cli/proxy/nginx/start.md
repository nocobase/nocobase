---
title: "nb proxy nginx start"
description: "Справка по команде nb proxy nginx start: запускает proxy Nginx с текущим driver."
keywords: "nb proxy nginx start,NocoBase CLI,nginx,start"
---

# nb proxy nginx start

Запускает proxy Nginx с текущим driver.

## Использование

```bash
nb proxy nginx start
```

## Примеры

```bash
nb proxy nginx start
```

## Примечания

- С driver `local` эта команда запускает локальный процесс Nginx
- С driver `docker` эта команда запускает или создает Docker-контейнер
- Если proxy уже запущен, команда сообщит об этом

## Связанные команды

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx status`](./status.md)
