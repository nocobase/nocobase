---
title: 'nb env proxy nginx'
description: 'Справка по команде nb env proxy nginx: генерация файлов конфигурации прокси Nginx и вспомогательных файлов для одного CLI-managed env.'
keywords: 'nb env proxy nginx,NocoBase CLI,nginx,reverse proxy,конфигурация прокси'
---

# nb env proxy nginx

`nb env proxy nginx` генерирует файлы конфигурации прокси Nginx и вспомогательные файлы для одного CLI-managed env. Эта команда хорошо подходит в тех случаях, когда вы уже используете Nginx для управления сайтами или хотите и дальше сами управлять сертификатами, кэшированием и контролем доступа.

Команда работает только для управляемых env, чей runtime доступен с текущей машины, то есть для `local` или `docker`. Сейчас она не поддерживает env, у которых есть только удаленное API-подключение, а также SSH env.

## Использование

```bash
nb env proxy nginx [name] [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `[name]` | string | Имя настроенного env, для которого нужно сгенерировать прокси-конфигурацию. Если не указано, используется текущий env |
| `--env`, `-e` | string | Явно указывает имя env. Обычно рекомендуется использовать именно эту форму |
| `--host` | string | Хост, записываемый во входную конфигурацию, например `example.com` или `localhost` |
| `--port` | string | Порт, записываемый во входную конфигурацию. Это входной порт прокси, а не `appPort` самого приложения NocoBase |
| `--install` | boolean | Устанавливает общую прокси-конфигурацию в основную конфигурацию Nginx |
| `--reload` | boolean | Проверяет и перезагружает Nginx после записи файлов |
| `--print` | boolean | Выводит сгенерированный `app.conf` напрямую вместо записи файлов |

## Вывод по умолчанию

`nb env proxy nginx` поддерживает следующие файлы в каталоге `~/.nocobase/proxy/nginx/`:

| Файл | Назначение |
| --- | --- |
| `~/.nocobase/proxy/nginx/<env>/app.conf` | Редактируемый входной файл сайта. CLI обновляет в нем managed-блок, а вокруг этого блока вы можете добавлять конфигурацию уровня сайта |
| `~/.nocobase/proxy/nginx/<env>/public/index-v1.html` | SPA fallback page для v1, сгенерированная из `index.html` текущего активного клиента |
| `~/.nocobase/proxy/nginx/<env>/public/index-v2.html` | SPA fallback page для v2, сгенерированная из `v/index.html` текущего активного клиента |
| `~/.nocobase/proxy/nginx/nocobase.conf` | Общая основная конфигурация, которая подключает `app.conf` всех env |
| `~/.nocobase/proxy/nginx/snippets/` | Общая директория snippets, скопированная из встроенных шаблонов |

Где:

- `app.conf` можно редактировать, но managed-блок между `# BEGIN NocoBase managed config` и `# END NocoBase managed config` лучше сохранять
- `index-v1.html` и `index-v2.html` автоматически переписывают asset URL в зависимости от текущего подпути env, активной версии клиента и `CDN_BASE_URL`
- `nocobase.conf` в основном используется вместе с `--install`
- Файлы в `public/` и `snippets/` обычно не предназначены для ручного редактирования и будут повторно синхронизированы при следующем запуске команды

:::warning Важно

Если вам нужно добавить Nginx-конфигурацию уровня сайта, редактируйте `app.conf`. Не меняйте вручную файлы под управлением CLI внутри `public/` или `snippets/`, потому что они будут перезаписаны при следующем запуске `nb env proxy nginx`.

:::

## Связанные параметры конфигурации

Эти параметры CLI-конфигурации напрямую влияют на сгенерированный вывод Nginx:

| Параметр конфигурации | Значение по умолчанию | Описание |
| --- | --- | --- |
| `proxy.nb-cli-root` | Корень CLI, обычно домашний каталог текущего пользователя | Сопоставляет путь `.nocobase` с корневым путем, который реально видит Nginx |
| `proxy.upstream-host` | `127.0.0.1` | Хост, который прокси использует для обратной передачи трафика в приложение NocoBase |
| `bin.nginx` | `nginx` | Путь к исполняемому файлу Nginx, используемому в `--install` или `--reload` |

В большинстве случаев менять `proxy.nb-cli-root` не нужно. Обычно это требуется только тогда, когда Nginx работает в другом контейнере, с другим корнем монтирования или с другим представлением путей.

## Примечания

- `--port` должен быть целым числом от `1` до `65535`
- Порт upstream-приложения NocoBase берется из сохраненного в env `appPort`, а не из `--port`
- Если команда сообщает, что у env отсутствует `appPort`, сначала выполните `nb env update <name>` или явно сохраните его через `nb env update <name> --app-port <port>`
- Если вы меняете такие параметры, как `app-port` или `app-public-path`, через `nb env update`, после этого обычно нужно заново выполнить `nb env proxy nginx`
- `--print` нельзя сочетать с `--install` или `--reload`
- Provider Nginx не поддерживает `--output`

## Примеры

```bash
# Сгенерировать конфигурацию Nginx для текущего env
nb env proxy nginx

# Сгенерировать конфигурацию для одного env
nb env proxy nginx --env demo

# Записать публичные host и port во входную конфигурацию
nb env proxy nginx --env demo --host demo.local.nocobase.com --port 8080

# Вывести сгенерированный app.conf без записи файлов
nb env proxy nginx --env demo --print

# Сопоставить путь .nocobase, когда Nginx работает под другим корнем монтирования
nb config set proxy.nb-cli-root /workspace

# Установить общую конфигурацию в main config Nginx и сразу перезагрузить
nb env proxy nginx --env demo --install --reload
```

## Связанные команды

- [`nb env proxy`](./index.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
