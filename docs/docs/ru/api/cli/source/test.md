---
title: "nb source test"
description: "Справочник по команде nb source test: запуск тестов в каталоге выбранного приложения с автоматической подготовкой встроенной тестовой базы данных."
keywords: "nb source test,NocoBase CLI,тестирование,Vitest,база данных"
---

# nb source test

Запускает тесты в каталоге выбранного приложения. Перед выполнением тестов CLI заново создаёт встроенную тестовую базу данных Docker и внедряет используемые внутренне переменные окружения `DB_*`.

## Использование

```bash
nb source test [paths...] [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[paths...]` | string[] | Пути к тестовым файлам или glob, передаваемые в тестовый раннер |
| `--cwd`, `-c` | string | Каталог приложения для запуска тестов, по умолчанию текущий каталог |
| `--watch`, `-w` | boolean | Запустить Vitest в режиме watch |
| `--run` | boolean | Однократный запуск без режима watch |
| `--allowOnly` | boolean | Разрешить тесты с `.only` |
| `--bail` | boolean | Остановить выполнение при первом сбое |
| `--coverage` | boolean | Включить отчёт о покрытии |
| `--single-thread` | string | Передать режим single-thread базовому тестовому раннеру |
| `--server` | boolean | Принудительно использовать режим серверных тестов |
| `--client` | boolean | Принудительно использовать режим клиентских тестов |
| `--db-clean`, `-d` | boolean | Очищать базу данных, если базовая команда приложения это поддерживает |
| `--db-dialect` | string | Тип встроенной тестовой базы данных: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--db-image` | string | Docker-образ встроенной тестовой базы данных |
| `--db-port` | string | TCP-порт хоста, на который публикуется встроенная тестовая база данных |
| `--db-database` | string | Имя базы данных, внедряемое в тесты |
| `--db-user` | string | Пользователь базы данных, внедряемый в тесты |
| `--db-password` | string | Пароль базы данных, внедряемый в тесты |
| `--verbose` | boolean | Показать вывод базового Docker и тестового раннера |

## Примеры

```bash
nb source test
nb source test --cwd /path/to/app
nb source test packages/core/server/src/__tests__/foo.test.ts
nb source test --server --coverage
nb source test --db-port 5433
```

## Связанные команды

- [`nb source build`](./build.md)
- [`nb db ps`](../db/ps.md)
