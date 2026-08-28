---
title: "nb proxy caddy reload"
description: "Справочник по команде nb proxy caddy reload: перезагрузка конфигурации Caddy с текущим драйвером."
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,reload"
---

# nb proxy caddy reload

Перезагружает конфигурацию Caddy с текущим драйвером.

## Использование

```bash
nb proxy caddy reload
```

## Примеры

```bash
nb proxy caddy reload
```

## Примечания

- Обычно эту команду используют после повторной генерации конфигурации
- Для `reload` Caddy уже должен быть запущен; если он ещё не запущен, сначала выполните `nb proxy caddy start`
- Локальный драйвер перезагружает локальный Caddy, а драйвер `docker` — Caddy внутри контейнера

## Связанные команды

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
