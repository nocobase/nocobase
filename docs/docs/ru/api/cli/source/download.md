---
title: "nb source download"
description: "Справочник по команде nb source download: загрузка исходного кода или образов NocoBase из npm, Docker или Git."
keywords: "nb source download,NocoBase CLI,загрузка,npm,Docker,Git"
---

# nb source download

Загружает NocoBase из npm, Docker или Git. `--version` — общий параметр для всех трёх типов источника: для npm используется версия пакета, для Docker — тег образа, для Git — git ref.

## Использование

```bash
nb source download [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Использовать значения по умолчанию и пропустить интерактивные запросы |
| `--verbose` | boolean | Показать подробный вывод команд |
| `--locale` | string | Язык подсказок CLI: `en-US` или `zh-CN` |
| `--source`, `-s` | string | Тип источника: `docker`, `npm` или `git` |
| `--version`, `-v` | string | Версия пакета npm, тег образа Docker или git ref |
| `--replace`, `-r` | boolean | Заменить целевой каталог, если он уже существует |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | Устанавливать ли devDependencies при установке npm/Git |
| `--output-dir`, `-o` | string | Целевой каталог загрузки или каталог для сохранения tarball Docker |
| `--git-url` | string | URL Git-репозитория |
| `--docker-registry` | string | Имя репозитория Docker-образа без тега |
| `--docker-platform` | string | Платформа Docker-образа: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | Сохранять ли загруженный Docker-образ как tarball |
| `--npm-registry` | string | Реестр для загрузки и установки зависимостей npm/Git |
| `--build` / `--no-build` | boolean | Выполнять ли сборку после установки зависимостей npm/Git |
| `--build-dts` | boolean | Генерировать ли файлы объявлений TypeScript при сборке npm/Git |
| `--hook-script` | string | Модуль хука, который запускается после npm-шаблона или git clone и перед установкой зависимостей; применяется только к источникам npm/Git |

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
nb source download -y --source git --version beta --hook-script ./hooks.mjs
```

## Хук перед установкой

`--hook-script` влияет только на текущий запуск `nb source download`. Если нужно сохранить хук вместе с окружением и повторно использовать его в `nb app upgrade` или при локальном восстановлении исходного кода, передайте его через [`nb init --hook-script`](../init.md).

Файл хука должен экспортировать объект по умолчанию с методом `beforeDependencyInstall(context)`:

```js
export default {
  beforeDependencyInstall: async ({ sourcePath, version, envConfig }) => {
    // Выполняется после git clone / npm-шаблона и перед yarn install.
  },
};
```

При прямом запуске `nb source download --hook-script` хук `beforeDependencyInstall` получает `context.phase` как `source-download` и `context.command` как `source:download`. Эта команда не запускает `beforeAppInstall` или `afterAppStart`; эти хуки относятся к установке, запуску, перезапуску и обновлению приложения.


## Псевдонимы версий

При использовании источника Git распространённые теги дистрибуции разрешаются в соответствующие ветки: `latest` → `main`, `beta` → `next`, `alpha` → `develop`.

## Связанные команды

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
