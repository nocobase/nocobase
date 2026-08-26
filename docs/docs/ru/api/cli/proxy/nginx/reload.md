---
title: "nb proxy nginx reload"
description: "Справка по команде nb proxy nginx reload: перезагружает конфигурацию Nginx с текущим driver."
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,reload"
---

# nb proxy nginx reload

Перезагружает конфигурацию Nginx с текущим driver.

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
- Для `reload` Nginx уже должен быть запущен; если он еще не запущен, сначала выполните `nb proxy nginx start`
- Локальный driver перезагружает локальный Nginx, а Docker driver перезагружает Nginx внутри контейнера

## Связанные команды

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
