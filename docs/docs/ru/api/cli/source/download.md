---
title: "nb source download"
description: "Справочник по команде nb source download: получение исходного кода или образа NocoBase из npm, Docker или Git."
keywords: "nb source download,NocoBase CLI,скачивание,npm,Docker,Git"
---

# nb source download

Получает NocoBase из npm, Docker или Git. `--version` — общий параметр версии для всех трёх источников: для npm используется версия пакета, для Docker — tag образа, для Git — git ref.

## Использование

```bash
nb source download [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Использовать значения по умолчанию и пропустить интерактивные подсказки |
| `--verbose` | boolean | Показать подробный вывод команд |
| `--locale` | string | Язык подсказок CLI: `en-US` или `zh-CN` |
| `--source`, `-s` | string | Способ получения: `docker`, `npm` или `git` |
| `--version`, `-v` | string | Версия пакета npm, tag образа Docker или Git ref |
| `--replace`, `-r` | boolean | Заменить, если целевой каталог уже существует |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | Устанавливать ли devDependencies при установке npm/Git |
| `--output-dir`, `-o` | string | Целевой каталог скачивания или каталог для сохранения tarball Docker |
| `--git-url` | string | Адрес Git-репозитория |
| `--docker-registry` | string | Имя Docker-репозитория без tag |
| `--docker-platform` | string | Платформа Docker-образа: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | Сохранять ли Docker-образ как tarball после загрузки |
| `--npm-registry` | string | Registry для скачивания и установки зависимостей npm/Git |
| `--build` / `--no-build` | boolean | Выполнять ли сборку после установки зависимостей npm/Git |
| `--build-dts` | boolean | Генерировать ли файлы объявлений TypeScript при сборке npm/Git |

## Примеры

```bash
nb source download
nb source download -y --source npm --version alpha
nb source download -y --source npm --version alpha --no-build
nb source download --source npm --version alpha --output-dir=./app
nb source download --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64
nb source download -y --source docker --version alpha --docker-save -o ./docker-images
nb source download --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git
nb source download --source git --version fix/cli-v2
nb source download -y --source npm --version alpha --build-dts
nb source download -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com
```

## Псевдонимы версий

При использовании источника Git распространённые dist-tag разрешаются в соответствующие ветки: `latest` → `main`, `beta` → `next`, `alpha` → `develop`.

## Связанные команды

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
