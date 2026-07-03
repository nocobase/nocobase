# Nginx

Если на сервере уже используется Nginx или позже понадобятся сертификаты, кэш и контроль доступа, путь по умолчанию — `nb proxy nginx`.

Если нужен HTTPS как можно скорее и не хочется самому поддерживать много деталей прокси, проще [Caddy](./caddy.md). Пока выбран Nginx — этот документ основной.

## Когда уместнее Nginx

Обычно Nginx предпочтителен, если:

- на сервере через Nginx уже ведётся несколько сайтов;
- позже сами будете поддерживать сертификаты, кэш, контроль доступа или свои правила;
- входной слой должен остаться в привычной схеме эксплуатации Nginx.

Если цель — быстрее получить HTTPS без глубокой настройки TLS, [Caddy](./caddy.md) обычно проще.

## Сначала три команды

Чтобы поднять входной слой Nginx:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

При локальной установке Nginx первая команда — `nb proxy nginx use local`.

В большинстве случаев: `use` → `generate` → `reload`. Дополнительно — ниже и в справочнике CLI.

## Шаг 1. Как запускать Nginx

Если Nginx уже на этой машине — `use local`.

Для Nginx в Docker — `use docker`.

`local` / `docker` здесь — режим работы **самого Nginx**.

Nginx в Docker:

```bash
nb proxy nginx use docker
```

Локальный Nginx:

```bash
nb proxy nginx use local
```

Текущий выбор:

```bash
nb proxy nginx current
```

## Шаг 2. Выполните `generate`

`generate` создаёт конфигурацию входа Nginx для указанного окружения:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

С указанием порта входа:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Параметры:

- `--env` — для какого CLI-окружения сгенерировать конфигурацию;
- `--host` — доменное имя внешнего доступа;
- `--port` — порт входа прокси, не `appPort` самого приложения NocoBase.

Порт приложения берётся из сохранённого в окружении `appPort`. Если его нет:

```bash
nb env update test2 --app-port 56575
```

После смены `app-port`, `app-public-path` и других параметров, влияющих на прокси, снова выполните `generate`.

## Шаг 3. Выполните `reload`

```bash
nb proxy nginx reload
```

Обычно достаточно этой команды: если процесс не запущен — поднимется; если запущен — перезагрузится с новой конфигурацией.

## Какие файлы ведёт CLI

На примере `test2`:

| Путь | Назначение |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Общие фрагменты Nginx |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Редактируемая конфигурация входа сайта |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | Резервная страница SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | Резервная страница SPA v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Каталог сборки фронтенда |
| `NB_CLI_ROOT/test2/storage/uploads` | Каталог загрузок приложения |

Примечание:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` — вспомогательные файлы, которые ведёт CLI;
- `NB_CLI_ROOT/test2/storage/...` — статика и загрузки приложения;
- `app.conf` можно править, но блок, управляемый NocoBase, нужно сохранить;
- `index-v1.html` и `index-v2.html` переписывают адреса ресурсов по подпути окружения, версии клиента и `CDN_BASE_URL`.

:::warning Примечание

Сайтовые настройки Nginx — лимиты, заголовки, контроль доступа — добавляйте в `app.conf`. Вспомогательные файлы CLI обновляются при следующих пересборках.

:::

## Ручная настройка без CLI

Если приложение не размещено через CLI или вы ведёте полную конфигурацию Nginx сами — можно писать вручную.

Для NocoBase рабочий обратный прокси — не просто `proxy_pass`. Кроме API нужны каталог загрузок, статика фронтенда, WebSocket, маршрут `.well-known` и резервная страница SPA.

На примере `test2` обычно задействованы:

- фрагменты Nginx: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`;
- конфигурация входа: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`;
- резервные страницы SPA (v1/v2): `.../public/index-v1.html`, `index-v2.html`;
- сборка фронтенда: `NB_CLI_ROOT/test2/storage/dist-client`;
- загрузки: `NB_CLI_ROOT/test2/storage/uploads`.

Ручная конфигурация обычно покрывает:

- `uploads` — каталог загрузок через `alias`;
- `dist` — каталог сборки фронтенда через `alias`;
- `well-known` — пути обнаружения OAuth / OpenID;
- `api` — пересылка `/api/` на приложение;
- `ws` — WebSocket на приложение;
- `spa` — вход фронтенда и `try_files` для `/` и `/v/`.

Полная конфигурация — не только:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Для CLI-окружения вроде `test2` ближе к реальному развёртыванию такая структура:

```nginx
server {
    listen 80;
    server_name c.local.nocobase.com;

    # Add custom directives or locations above the managed block as needed.

    client_max_body_size 0;

    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/mime-types.conf;
    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/gzip.conf;

    location /storage/uploads/ {
        alias NB_CLI_ROOT/test2/storage/uploads/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/uploads-location.conf;
    }

    location ^~ /dist/ {
        alias NB_CLI_ROOT/test2/storage/dist-client/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/dist-location.conf;
    }

    location ~ ^/\\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
        rewrite ^ /$resource_path/.well-known/$well_known break;
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /ws {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /v {
        return 302 /v/$is_args$args;
    }

    location ^~ /v/ {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v2.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    location ^~ / {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v1.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    # Add custom directives or locations below the managed block as needed.
}
```

Два ключевых момента:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` — файлы, которые ведёт CLI;
- `NB_CLI_ROOT/test2/storage/...` — каталог сборки и загрузок.

При развёртывании по подпути или когда статика, загрузки и прокси «смотрят» по-разному, ручная конфигурация чаще даёт ошибки. Рекомендуется:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

и правки поверх результата.

Разумный порядок:

1. Сгенерировать конфигурацию через CLI.
2. Проверить маршруты и пути по результату.
3. Донастроить под домен, режим работы и монтирование.

Так реже пропускают WebSocket, статику, загрузки или резервные страницы SPA.

## HTTPS

При продолжении работы с Nginx HTTPS настраивается там же — часто расширяют `listen 80` до `80/443` и добавляют сертификат и TLS.

Если нужен быстрый HTTPS без самостоятельного выпуска и продления сертификатов, проще [Caddy](./caddy.md).

## Общие замечания

- `nb proxy nginx generate` — для приложений, установленных через `nb init`.
- После смены `app-port`, `app-public-path` и других параметров, влияющих на прокси, снова выполните `generate`.

## Ссылки по теме

- [Обратный прокси производственного окружения](./index.md)
- [Caddy](./caddy.md)
- [Установить с помощью CLI (рекомендуется)](../../installation/cli.md)
- [Конфигурация приложения и `.env`](../../installation/env.md)
- [Справочник `nb proxy nginx`](../../../api/cli/proxy/nginx/index.md)
