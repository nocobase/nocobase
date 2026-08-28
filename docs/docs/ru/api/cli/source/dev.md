---
title: "nb source dev"
description: "Справочник по команде nb source dev: запуск режима разработки NocoBase для окружений с исходным кодом npm или Git."
keywords: "nb source dev,NocoBase CLI,режим разработки,горячая перезагрузка"
---

# nb source dev

Запускает режим разработки для окружений с исходным кодом npm или Git. Для Docker-окружений используйте [`nb app logs`](../app/logs.md) для просмотра логов среды выполнения.

## Использование

```bash
nb source dev [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI-окружения для входа в режим разработки; если не указано, используется текущее окружение |
| `--db-sync` | boolean | Синхронизировать базу данных перед запуском режима разработки |
| `--port`, `-p` | string | Порт сервера разработки |
| `--client`, `-c` | boolean | Запустить только клиент |
| `--server`, `-s` | boolean | Запустить только сервер |
| `--inspect`, `-i` | string | Порт отладки Node.js inspect для сервера |

## Примеры

```bash
nb source dev
nb source dev --env app1
nb source dev --env app1 --db-sync
nb source dev --env app1 --port 12000
nb source dev --env app1 --client
nb source dev --env app1 --server
nb source dev --env app1 --inspect 9229
```

## Связанные команды

- [`nb source download`](./download.md)
- [`nb app start`](../app/start.md)
- [`nb app logs`](../app/logs.md)
