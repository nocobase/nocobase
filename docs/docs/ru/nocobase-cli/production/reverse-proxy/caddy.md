# Caddy

Если есть доменное имя и нужен HTTPS как можно скорее, обычно проще всего `nb proxy caddy`.

Вместо самостоятельной настройки сертификатов в Nginx Caddy — быстрый способ «сначала поднять входной слой».

## Когда уместнее Caddy

Caddy предпочтителен, если:

- есть домен и нужен HTTPS без лишней настройки;
- не хочется самому вести сертификаты и детали TLS;
- нужен простой стабильный входной слой.

Если Nginx уже ведёт много сайтов или нужны сложный кэш, контроль доступа и свои правила — смотрите [Nginx](./nginx.md).

## Сначала три команды

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy reload
```

При локальной установке Caddy — `nb proxy caddy use local`.

В большинстве случаев: `use` → `generate` → `reload`. Дополнительно — ниже и в справочнике CLI.

## Шаг 1. Как запускать Caddy

Если Caddy на этой машине — `use local`.

Для Caddy в Docker — `use docker`.

`local` / `docker` — режим работы **самого Caddy**.

Caddy в Docker:

```bash
nb proxy caddy use docker
```

Локальный Caddy:

```bash
nb proxy caddy use local
```

Текущий выбор:

```bash
nb proxy caddy current
```

## Шаг 2. Выполните `generate`

`generate` создаёт конфигурацию Caddy для указанного окружения:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

С портом входа:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Параметры:

- `--env` — для какого CLI-окружения сгенерировать конфигурацию;
- `--host` — доменное имя внешнего доступа;
- `--port` — порт входа прокси.

Для Caddy `--host` особенно важен: в производственном окружении укажите домен, который уже указывает на этот сервер — HTTPS подключится естественнее.

Если в окружении нет `appPort`:

```bash
nb env update test2 --app-port 56575
```

После смены `app-port`, `app-public-path` и других параметров, влияющих на прокси, снова выполните `generate`.

## Шаг 3. Выполните `reload`

```bash
nb proxy caddy reload
```

Обычно достаточно этой команды: если процесс не запущен — поднимется; если запущен — перезагрузится с новой конфигурацией.

## Какие файлы ведёт CLI

На примере `test2`:

| Путь | Назначение |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Полная конфигурация сайта от CLI |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Общий файл входа Caddy, импортирует `app.caddy` всех окружений |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | Резервная страница SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | Резервная страница SPA v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Каталог сборки фронтенда |
| `NB_CLI_ROOT/test2/storage/uploads` | Каталог загрузок приложения |

Примечание:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` — вспомогательные файлы, которые ведёт CLI;
- `NB_CLI_ROOT/test2/storage/...` — статика и загрузки приложения;
- `nocobase.caddy` — файл входа уровня провайдера, обычно не правится вручную;
- `app.caddy` — полная конфигурация сайта Caddy для окружения; повторный `generate` перезапишет файл целиком.

:::warning Примечание

Сайтовые настройки Caddy — заголовки, аутентификация, лимиты, сжатие — можно добавить в `app.caddy`, но следующий `generate` перезапишет этот файл.

:::

## Ручная настройка без CLI

Если приложение не размещено через CLI или вы ведёте полную конфигурацию Caddy сами — можно писать вручную.

Однако для NocoBase вход производственной среды обычно представляет собой не просто `reverse_proxy`. Помимо пересылки запросов API серверному приложению, полная конфигурация Caddy должна обрабатывать каталог загрузки, статические ресурсы интерфейса, маршрут доступа к файлам `/files/`, маршрутизацию `.well-known`, WebSocket и резервные страницы SPA.

На примере `test2` обычно задействованы:

- каталог резервных страниц SPA: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`;
- сборка фронтенда: `NB_CLI_ROOT/test2/storage/dist-client`;
- загрузки: `NB_CLI_ROOT/test2/storage/uploads`.

Ручная конфигурация обычно покрывает:

- `v`: перенаправить `/v` на `/v/`.
– `uploads`: открыть каталог загрузки.
- `dist`: открыть каталог продукта внешней сборки.
– `oauth well-known`: обработка путей обнаружения OAuth.
- `openid well-known`: обработка путей обнаружения OpenID.
- `files`: передача запросов доступа к файлам в `/files/` серверному приложению
- `api`: переслать запрос `/api/` серверному приложению.
- `ws`: пересылать запросы WebSocket серверному приложению.
- `spa v2`: предоставляет интерфейсную страницу ввода и возврата для `/v/`.
- `spa v1`: предоставляет интерфейсную страницу ввода и возврата для `/`.

Полная конфигурация — не только:

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Для CLI-окружения вроде `test2` ближе к реальному развёртыванию:

```text
c.local.nocobase.com {
    encode zstd gzip

    handle /v {
        redir * /v/ 302
    }

    handle_path /storage/uploads/* {
        root * NB_CLI_ROOT/test2/storage/uploads
        header Cache-Control public
        header X-Content-Type-Options nosniff
        file_server
    }

    handle_path /dist/* {
        root * NB_CLI_ROOT/test2/storage/dist-client
        header Cache-Control public
        file_server
    }

    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy host.docker.internal:56575
    }

    handle /files/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /api/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /ws {
        reverse_proxy host.docker.internal:56575
    }

    handle_path /v/* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v2.html
        file_server
    }

    handle_path /* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v1.html
        file_server
    }
}
```

Два ключевых момента:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` — каталог резервных страниц SPA, который ведёт CLI;
- `NB_CLI_ROOT/test2/storage/...` — каталог сборки и загрузок.

При развёртывании по подпути или когда статика, загрузки и входной слой «смотрят» по-разному, ручная конфигурация чаще даёт ошибки. Рекомендуется:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

и правки поверх результата.

Если сначала нужны пути и маршруты от CLI, обычно получается:

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

Примечание:

- `nocobase.caddy` объединяет `import */app.caddy`;
- `test2/app.caddy` — полная конфигурация сайта для окружения `test2`;
- `public/index-v1.html` и `index-v2.html` — резервные страницы SPA от CLI.

Разумный порядок:

1. Сгенерировать конфигурацию через CLI.
2. Проверить маршруты и пути по результату.
3. Донастроить под домен, режим работы и монтирование.

Обычно при этом меньше шансов пропустить детали, связанные с `/files/`, WebSockets, статическими ресурсами, каталогами загрузки, маршрутами `.well-known` или резервными страницами SPA, чем при написании конфигурации вручную с нуля.

:::warning Внимание

`/files/` — это маршрут приложения, который должен проходить авторизацию NocoBase. Не обрабатывайте его как статический каталог и не допускайте его попадания в резервную страницу SPA. Передавайте маршрут серверной части NocoBase и размещайте правило перед `handle_path /*` и другими правилами резервной обработки интерфейса.

Если настроен `APP_PUBLIC_PATH=/nocobase/`, также передавайте `/nocobase/files/*`. Сохраните корневое правило `/files/*` для совместимости с существующими URL файлов.

:::

## Проверка и перезагрузка конфигурации

После правок вручную — проверка и перезагрузка:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Без `systemd` используйте свой способ запуска и перезагрузки.

При управлении через `nb proxy caddy` предпочтительнее:

```bash
nb proxy caddy reload
```

Информация о драйвере, пути к файлу входа, корне выполнения, контейнере или локальном бинарнике:

```bash
nb proxy caddy info
```

Быстрая проверка, что процесс работает:

```bash
nb proxy caddy status
```

## Общие замечания

- `nb proxy caddy generate` — для приложений, установленных через `nb init`.
- При домене, который уже резолвится на сервер, Caddy часто самый быстрый путь к HTTPS.
- После смены `app-port`, `app-public-path` и других параметров, влияющих на прокси, снова выполните `generate`.

## Ссылки по теме

- [Обратный прокси производственного окружения](./index.md)
- [Nginx](./nginx.md)
- [Установить с помощью CLI (рекомендуется)](../../installation/cli.md)
- [Конфигурация приложения и `.env`](../../installation/env.md)
- [Справочник `nb proxy caddy`](../../../api/cli/proxy/caddy/index.md)
