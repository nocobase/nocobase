---
title: "nb db check"
description: "Справочник по команде nb db check: проверка доступности базы данных через текущий env или явные флаги базы данных."
keywords: "nb db check,NocoBase CLI,database connection"
---

# nb db check

Проверяет, доступна ли база данных. Можно использовать сохранённые настройки базы данных из env или передать явные флаги `--db-*`.

## Использование

```bash
nb db check [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Считать настройки базы данных из CLI env; если не указано, нужно передать все обязательные флаги `--db-*` |
| `--db-dialect` | string | Диалект базы данных: `postgres`, `kingbase`, `mysql` или `mariadb` |
| `--db-host` | string | Имя хоста или IP-адрес базы данных |
| `--db-port` | string | TCP-порт базы данных |
| `--db-database` | string | Имя базы данных |
| `--db-user` | string | Имя пользователя базы данных |
| `--db-password` | string | Пароль базы данных |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb db check --env app1
nb db check --env app1 --db-password new-secret --json
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
```

## Примечания

Если выбранный env использует встроенную базу данных, управляемую CLI, CLI сначала определит фактический адрес подключения, а затем выполнит проверку.

## Связанные команды

- [`nb db ps`](./ps.md)
- [`nb env info`](../env/info.md)
