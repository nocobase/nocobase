---
title: "nb proxy nginx reload"
description: "Справочник по команде nb proxy nginx reload: перезагрузка конфигурации Nginx с текущим драйвером."
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,reload"
---

# nb proxy nginx reload

Перезагружает конфигурацию Nginx с текущим драйвером.

## Использование

```bash
nb proxy nginx reload
```

## Примеры

```bash
nb proxy nginx reload
```

## Примечания

- Обычно эту команду используют после повторной генерации конфигурации
- Для `reload` Nginx уже должен быть запущен; если он ещё не запущен, сначала выполните `nb proxy nginx start`
- Локальный драйвер перезагружает локальный Nginx, а драйвер `docker` — Nginx внутри контейнера

## Связанные команды

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
