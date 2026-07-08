---
title: "nb source"
description: "Справочник по команде nb source: управление локальным проектом исходного кода NocoBase, включая загрузку, разработку, сборку и тестирование."
keywords: "nb source,NocoBase CLI,исходный код,загрузка,разработка,сборка,тестирование"
---

# nb source

Управление локальным проектом исходного кода NocoBase. Для окружений типов npm/Git используется локальный каталог исходного кода; для Docker-окружений обычно достаточно [`nb app`](../app/index.md) для управления средой выполнения.

## Использование

```bash
nb source <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb source download`](./download.md) | Загрузить NocoBase из npm, Docker или Git |
| [`nb source dev`](./dev.md) | Запустить режим разработки для окружений с исходным кодом npm/Git |
| [`nb source build`](./build.md) | Собрать локальный проект исходного кода |
| [`nb source test`](./test.md) | Запустить тесты в каталоге выбранного приложения |

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
