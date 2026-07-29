---
title: "nb portal registry sync"
description: "Справочник nb portal registry sync: установка, сравнение и обновление элементов Registry из плагинов в AI Portal."
keywords: "nb portal registry sync,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry sync

Устанавливает элементы NocoBase Portal Registry в существующую рабочую область AI Portal. Команда получает индекс Registry от выбранного сервиса NocoBase, поэтому элементы новых включенных плагинов становятся доступны без их жесткого добавления в шаблон Portal.

## Использование

```bash
nb portal registry sync <portal> [элементы...] [флаги]
```

## Аргументы и флаги

| Аргумент или флаг | Тип | Описание |
| --- | --- | --- |
| `<portal>` | string | Обязательное имя или slug AI Portal |
| `[элементы...]` | string[] | Необязательные имена элементов Registry. Если не указаны, устанавливаются все элементы включенных плагинов. Поддерживаются формы `ai` и `@nocobase/ai` |
| `--env`, `-e` | string | Имя среды CLI; по умолчанию используется текущая среда |
| `--yes`, `-y` | boolean | Пропустить подтверждение, если `--env` указывает другую среду |
| `--overwrite` | boolean | Заменить установленные файлы Registry, сохранив существующие файлы `src/components/ui` |
| `--overwrite-ui` | boolean | Разрешить `--overwrite` также заменять `src/components/ui`; требует `--overwrite` |
| `--diff` | boolean | Показать различия, не изменяя Portal |
| `--build` | boolean | Выполнить `pnpm build` и `pnpm build:html` после установки |

## Примеры

Установить все еще не установленные доступные элементы:

```bash
nb portal registry sync customer
```

Установить выбранные элементы:

```bash
nb portal registry sync customer ai acl auth-sms
```

Сравнить установленный элемент с версией сервиса:

```bash
nb portal registry sync customer ai --diff
```

Обновить элемент, сохранив базовые UI-компоненты:

```bash
nb portal registry sync customer ai --overwrite
```

Перезаписать файлы Registry и базовые UI-компоненты:

```bash
nb portal registry sync customer --overwrite --overwrite-ui
```

Установить элементы и собрать Portal:

```bash
nb portal registry sync customer --build
```

Использовать другую среду в неинтерактивном процессе:

```bash
nb portal registry sync customer --env dev --yes
```

## Поведение

Сначала команда запрашивает индекс Registry у выбранного сервиса NocoBase. Сервер возвращает только элементы включенных плагинов. Затем Registry `@nocobase` добавляется в `components.json` Portal, а элементы устанавливаются локальной CLI shadcn из рабочей области Portal.

По умолчанию элементы, целевые файлы которых уже существуют, пропускаются. При добавлении отсутствующих элементов и зависимостей существующие файлы в `src/extensions` и `src/components/ui` защищаются.

Используйте `--overwrite` только для намеренного обновления установленных файлов Registry. Базовые UI-компоненты остаются защищены, пока дополнительно не указан `--overwrite-ui`. Перед перезаписью проверьте локальные изменения.

`--diff` работает только для чтения и не может сочетаться с `--overwrite`, `--overwrite-ui` или `--build`.

Если в Portal отсутствует `node_modules`, перед запуском shadcn выполняется `pnpm install --frozen-lockfile`.

## Связанные команды

- [`nb portal registry`](./index.md)
- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
