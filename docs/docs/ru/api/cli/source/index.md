---
title: "nb source"
description: "Справочник по команде nb source: управление локальным проектом исходного кода NocoBase, включая загрузку, разработку, сборку и тестирование."
keywords: "nb source,NocoBase CLI,исходный код,download,dev,build,test"
---

# nb source

Управление локальным проектом исходного кода NocoBase. Для env типа npm/Git используется локальный каталог исходного кода; для Docker env обычно достаточно [`nb app`](../app/index.md) для управления состоянием выполнения.

## Использование

```bash
nb source <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb source download`](./download.md) | Получает NocoBase из npm, Docker или Git |
| [`nb source dev`](./dev.md) | Запускает режим разработки в env с исходным кодом npm/Git |
| [`nb source build`](./build.md) | Собирает локальный проект исходного кода |
| [`nb source test`](./test.md) | Запускает тесты в каталоге выбранного приложения |

## Примеры

```bash
nb source download --source npm --version alpha
nb source download --source docker --version alpha --docker-platform auto
nb source dev --env app1
nb source build @nocobase/acl
nb source test --server --coverage
```

## Связанные команды

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
