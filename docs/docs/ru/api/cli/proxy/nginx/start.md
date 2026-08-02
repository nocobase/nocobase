---
title: "nb proxy nginx start"
description: "Справочник по команде nb proxy nginx start: запуск прокси Nginx с текущим драйвером."
keywords: "nb proxy nginx start,NocoBase CLI,nginx,start"
---

# nb proxy nginx start

Запускает прокси Nginx с текущим драйвером.

## Использование

```bash
nb proxy nginx start
```

## Примеры

```bash
nb proxy nginx start
```

## Примечания

- С драйвером `local` команда запускает локальный процесс Nginx
- С драйвером `docker` команда запускает или создаёт Docker-контейнер
- Если прокси уже запущен, команда сообщит об этом

## Связанные команды

- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx status`](./status.md)
