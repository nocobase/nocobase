---
title: "nb proxy nginx stop"
description: "Справочник по команде nb proxy nginx stop: остановка прокси Nginx с текущим драйвером."
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,stop"
---

# nb proxy nginx stop

Останавливает прокси Nginx с текущим драйвером.

## Использование

```bash
nb proxy nginx stop
```

## Примеры

```bash
nb proxy nginx stop
```

## Примечания

- С драйвером `local` команда останавливает локальный процесс Nginx
- С драйвером `docker` команда останавливает контейнер прокси
- Если прокси уже остановлен, команда сообщит об этом

## Связанные команды

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
