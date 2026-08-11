---
title: "nb portal deploy"
description: "Справочник команды nb portal deploy: сборка и развёртывание указанного рабочего пространства Portal."
keywords: "nb portal deploy,NocoBase CLI,Portal,сборка,развёртывание"
---

# nb portal deploy

Собирает и развёртывает указанное рабочее пространство Portal. Обычно используется после завершения локальной разработки, когда Portal нужно обновить в целевом env.

При выполнении команда сначала обновляет `.env` и `.env.local` в рабочем пространстве, затем запускает `pnpm build`. Артефакт сборки должен содержать `dist/client/index.html`.

## Использование

```bash
nb portal deploy <portal> [flags]
```

## Параметр

| Параметр | Тип | Описание |
| --- | --- | --- |
| `<portal>` | string | Имя или slug Portal |
| `--env`, `-e` | string | Имя CLI env. Если не указано, используется текущий env |
| `--no-install` | boolean | Пропустить `pnpm install` перед сборкой |
| `--yes`, `-y` | boolean | Пропустить интерактивное подтверждение, когда явно заданный `--env` отличается от текущего env |

## Примеры

Развернуть Portal в текущем env:

```bash
nb portal deploy customer
```

Развернуть Portal в указанном env:

```bash
nb portal deploy customer --env dev --yes
```

Пропустить установку зависимостей, только пересобрать и развернуть:

```bash
nb portal deploy customer --no-install
```

## Примечания

`deploy` предназначен для уже существующего рабочего пространства разработки Portal. Если локального рабочего пространства ещё нет, сначала создайте его через [`nb portal create`](./create.md) или загрузите из source storage с помощью [`nb portal pull`](./pull.md).

Развёртывание собирает Portal из пути разработки, записанного в конфигурации CLI env, и синхронизирует артефакты сборки в каталог развёртывания в storage целевого приложения.

Развёртывание не изменяет source storage или настройки Git. Эти настройки обновляются в удалённой записи Portal командой [`nb portal config`](./config.md).

## Связанные команды

- [`nb portal create`](./create.md)
- [`nb portal config`](./config.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
