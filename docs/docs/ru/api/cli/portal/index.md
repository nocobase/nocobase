---
title: "nb portal"
description: "Справочник по nb portal: управление рабочими пространствами Portal, включая настройку, создание, разработку, синхронизацию исходного кода, развёртывание и удаление."
keywords: "nb portal,NocoBase CLI,Portal,workspace,source storage,deploy"
---

# nb portal

`nb portal` управляет рабочими пространствами Portal. Portal может иметь собственный frontend-код, путь входа и результат развёртывания; эта группа команд связывает запись Portal в NocoBase с локальным рабочим пространством и source storage.

Типовой процесс: создать локальное рабочее пространство, запустить режим разработки, отправить изменения исходного кода в source storage, затем выполнить build и deploy. Если вы берёте существующий Portal, сначала выполните `pull`.

## Использование

```bash
nb portal <command>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb portal config`](./config.md) | Обновляет конфигурацию исходного кода локального рабочего пространства Portal и по возможности синхронизирует её с удалённой записью Portal |
| [`nb portal create`](./create.md) | Создаёт локальное рабочее пространство Portal из шаблона и создаёт или обновляет запись Portal |
| [`nb portal deploy`](./deploy.md) | Собирает и развёртывает указанное рабочее пространство Portal |
| [`nb portal destroy`](./destroy.md) | Удаляет запись Portal и локальное рабочее пространство |
| [`nb portal dev`](./dev.md) | Запускает режим разработки для указанного рабочего пространства Portal |
| [`nb portal info`](./info.md) | Показывает сведения об указанной записи Portal и локальном рабочем пространстве |
| [`nb portal list`](./list.md) | Выводит записи Portal и состояние синхронизации локальных рабочих пространств |
| [`nb portal pull`](./pull.md) | Загружает исходный код Portal из source storage в локальное рабочее пространство |
| [`nb portal push`](./push.md) | Отправляет локальные изменения исходного кодa Portal в source storage |

## Типовой процесс

Создать Portal с именем `customer`:

```bash
nb portal create customer -e dev --yes
```

Запустить локальный режим разработки:

```bash
nb portal dev customer -e dev --yes
```

Проверить локальное рабочее пространство и удалённую запись:

```bash
nb portal info customer -e dev --yes
nb portal list -e dev --yes
```

Отправить исходный код и развернуть:

```bash
nb portal push customer -e dev --yes --message "Update customer portal"
nb portal deploy customer -e dev --yes
```

Взять существующий Portal в работу:

```bash
nb portal list -e dev --yes
nb portal pull customer -e dev --yes
nb portal dev customer -e dev --yes
```

Переключить source storage:

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal push customer -e dev --yes --message "Move customer portal source to Git"
```

## source storage

При создании Portal выберите, где будет управляться исходный код:

| Режим | Описание |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the Portal source should be reviewed, versioned, or built through an existing team workflow.

The Portal name and source configuration are written to `portal.config.json` in the local workspace. `create`, `pull`, and `config` maintain this file; `push` and `deploy` read it to sync source or deployment output.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Режим | Описание |
| --- | --- |
| `local` | The workspace is independent of app storage. Source and deployment output are synced through APIs. |
| `docker` | The workspace does not depend on a Docker volume. Source and deployment output are synced through APIs. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support Portal management in the current version.

## Local Workspace Path

`create` defaults to a portal-named child of the current directory. The first `pull` uses the same location; if the current directory already contains `portal.config.json`, `pull` uses the current directory directly:

```text
<current-directory>/<portal>
```

`dev`, `push`, `deploy`, `config`, `destroy`, `info`, and `list` use the current directory as the local Portal workspace by default. Pass `--dir <path>` to any of these commands to select a workspace explicitly; relative paths are resolved from the current directory. The CLI does not derive the local workspace from the env `storagePath`.

The main app access path is usually:

```text
<appPublicPath>/x/<portal>/
```

A sub-app access path is usually:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

## Env Confirmation

Most `nb portal` subcommands support `--env` and `--yes`:

| Параметр | Описание |
| --- | --- |
| `--env`, `-e` | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | Skip cross-env confirmation when an explicit `--env` targets a different env from the current env. |

In scripts or AI agent workflows, pass `--env` and `--yes` explicitly to avoid stopping at an interactive confirmation.

## Связанные команды

- [`nb env`](../env/index.md)
- [`nb app`](../app/index.md)
- [`nb source`](../source/index.md)
