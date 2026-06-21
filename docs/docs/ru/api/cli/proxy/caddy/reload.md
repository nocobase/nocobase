---
title: "nb proxy caddy reload"
description: "Справка по команде nb proxy caddy reload: перезагружает конфигурацию Caddy с текущим driver."
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,reload"
---

# nb proxy caddy reload

Перезагружает конфигурацию Caddy с текущим driver.

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
- Для `reload` Caddy уже должен быть запущен; если он еще не запущен, сначала выполните `nb proxy caddy start`
- Локальный driver перезагружает локальный Caddy, а Docker driver перезагружает Caddy внутри контейнера

## Связанные команды

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
