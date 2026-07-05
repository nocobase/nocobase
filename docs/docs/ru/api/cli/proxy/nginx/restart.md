---
title: "nb proxy nginx restart"
description: "Справочник по команде nb proxy nginx restart: перезапуск прокси Nginx с текущим драйвером."
keywords: "nb proxy nginx restart,NocoBase CLI,nginx,restart"
---

# nb proxy nginx restart

Перезапускает прокси Nginx с текущим драйвером.

## Использование

```bash
nb proxy nginx restart
```

## Примеры

```bash
nb proxy nginx restart
```

## Примечания

- Команда сначала останавливает прокси, а затем запускает его снова
- С драйверами `local` или `docker` она работает с локальным процессом или Docker-контейнером текущего драйвера

## Связанные команды

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx reload`](./reload.md)
