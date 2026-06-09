---
title: "Nginx"
description: "Usa nb proxy nginx para generar y gestionar la configuración de reverse proxy de Nginx para entornos NocoBase gestionados por la CLI."
keywords: "NocoBase,nb proxy nginx,reverse proxy,Nginx,producción"
---

# Nginx

Si ya usas Nginx en el servidor para gestionar sitios, o si todavía quieres gestionar tú mismo certificados, caché y control de acceso, `nb proxy nginx` es la ruta recomendada.

Si tu objetivo es simplemente poner HTTPS en funcionamiento lo antes posible y no quieres mantener demasiados detalles del proxy por tu cuenta, [Caddy](./caddy.md) suele ser la opción más simple. Pero si Nginx ya forma parte de tu infraestructura, esta página es la ruta predeterminada.

## Cuándo Nginx encaja mejor

En la práctica, Nginx suele ser la mejor opción cuando:

- ya usas Nginx para gestionar varios sitios en el mismo servidor
- todavía necesitas mantener por tu cuenta certificados, caché, control de acceso u otras reglas personalizadas
- quieres que la capa de entrada siga alineada con tu flujo operativo actual de Nginx

Si el único objetivo es poner HTTPS en línea rápidamente con menos trabajo de TLS, [Caddy](./caddy.md) suele ser la ruta más simple.

## Orden recomendado: elegir driver, generar configuración y luego iniciar

Para un env gestionado por la CLI de tipo `local` o `docker`, este suele ser el orden recomendado:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

O con un proceso local:

```bash
nb proxy nginx use local
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Los comandos de seguimiento más comunes son:

```bash
nb proxy nginx current
nb proxy nginx status
nb proxy nginx info
nb proxy nginx reload
nb proxy nginx restart
nb proxy nginx stop
```

En la mayoría de los casos:

- `current` es la forma más rápida de confirmar el driver de runtime activo
- `status` muestra si Nginx está funcionando con normalidad
- `info` muestra la ruta de configuración actual, la raíz de runtime y otros detalles de runtime
- después de regenerar la configuración, `reload` suele ser el primer comando que debes usar
- usa `restart` cuando necesites un reinicio completo

## Qué necesita `generate` como entrada

La forma más común es:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Si además quieres especificar el puerto de entrada:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Donde:

- `--env`: para qué env de la CLI se generará la configuración
- `--host`: el dominio público
- `--port`: el puerto de entrada del proxy, no el `appPort` de la propia aplicación

El puerto upstream de la aplicación viene del `appPort` guardado en ese env. Si el comando indica que falta `appPort`, guárdalo primero:

```bash
nb env update test2 --app-port 56575
```

Si más adelante cambias configuraciones como `app-port` o `app-public-path` que afecten al comportamiento del proxy, vuelve a ejecutar `generate`.

## Archivos que mantiene la CLI

Tomando `test2` como ejemplo, el flujo de Nginx normalmente mantiene:

| Ruta | Propósito |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Directorio compartido de snippets de Nginx |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Configuración de entrada del sitio editable |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | Página fallback de SPA para v1 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | Página fallback de SPA para v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Salida de compilación frontend de la aplicación actual |
| `NB_CLI_ROOT/test2/storage/uploads` | Directorio de uploads de la aplicación actual |

Donde:

- los archivos bajo `NB_CLI_ROOT/.nocobase/proxy/nginx/...` son archivos auxiliares del proxy gestionados por la CLI
- los archivos bajo `NB_CLI_ROOT/test2/storage/...` pertenecen a la propia aplicación
- `app.conf` puede editarse, pero el bloque gestionado por NocoBase debe permanecer intacto
- `index-v1.html` e `index-v2.html` se reescriben según la subruta del env actual, la versión activa del cliente y `CDN_BASE_URL`

:::warning Nota

Si necesitas configuración de Nginx a nivel de sitio como limitación de tasa, headers adicionales o control de acceso, edita `app.conf`. Los archivos auxiliares gestionados por la CLI se actualizarán de nuevo cuando regeneres la configuración.

:::

## Configuración manual: cuando no usas la CLI

Si la aplicación no está gestionada por la CLI, o si intencionalmente quieres mantener toda la configuración de Nginx por tu cuenta, también puedes escribirla a mano.

Sin embargo, para NocoBase, un reverse proxy listo para producción normalmente es más que un único `proxy_pass`. Además de reenviar solicitudes de API a la aplicación backend, una configuración completa suele necesitar manejar conjuntamente uploads, recursos frontend, WebSocket, rutas `.well-known` y páginas fallback de SPA.

Usando `test2` como ejemplo, estos son los archivos y directorios de Nginx más importantes:

- Snippets de Nginx: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Configuración de entrada editable: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- Página fallback de SPA para v1: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- Página fallback de SPA para v2: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Salida de compilación frontend: `NB_CLI_ROOT/test2/storage/dist-client`
- Directorio de uploads: `NB_CLI_ROOT/test2/storage/uploads`

En otras palabras, una configuración manual normalmente necesita cubrir al menos estas áreas de entrada:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

Así que una configuración completa de Nginx suele ser bastante más que un reverse proxy genérico como este:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Para una aplicación gestionada por la CLI como `test2`, una estructura de despliegue más realista suele parecerse más a esto:

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

    location ~ ^/\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
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

Aquí importan especialmente dos detalles:

- los archivos bajo `NB_CLI_ROOT/.nocobase/proxy/nginx/...` son archivos auxiliares del proxy gestionados por la CLI
- los archivos bajo `NB_CLI_ROOT/test2/storage/...` pertenecen a la salida de compilación y a los uploads de la aplicación

Si la aplicación usa despliegue bajo subruta, o si los recursos frontend, los uploads y el reverse proxy no comparten la misma visión de rutas, la configuración manual se vuelve más fácil de romper. En esos casos, normalmente es más seguro generar primero la configuración:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Y luego usar el resultado generado como base para ajustes manuales.

El flujo más seguro suele ser:

1. dejar que la CLI genere primero la configuración de Nginx
2. usar el resultado generado para confirmar la estructura de rutas y las rutas reales del sistema de archivos
3. ajustar después según tu dominio, driver de runtime y diseño de montajes

Normalmente esto es menos propenso a errores que escribir toda la configuración desde cero.

## Validar y recargar la configuración

Si escribes o ajustas la configuración de Nginx manualmente, valídala primero y luego recárgala:

```bash
nginx -t
systemctl reload nginx
```

Si no usas `systemd` para gestionar Nginx, sustituye eso por tu propio flujo de recarga.

Si gestionas la capa de entrada mediante `nb proxy nginx`, la opción habitual es:

```bash
nb proxy nginx reload
```

## Cómo manejar HTTPS

Si ya has decidido seguir con Nginx, también puedes mantener HTTPS allí. Un patrón habitual es ampliar `listen 80` a una configuración `80/443` y añadir después las rutas de certificados y la configuración TLS.

Si el objetivo es simplemente obtener HTTPS utilizable rápidamente sin gestionar tú mismo la emisión y renovación de certificados, cambiar a [Caddy](./caddy.md) suele ser más sencillo.

## Notas comunes

- `nb proxy nginx generate` solo funciona para entornos gestionados por la CLI cuya runtime sea accesible desde la máquina actual, es decir, `local` o `docker`
- si el comando indica que falta `appPort`, ejecuta primero `nb env update <name> --app-port <port>`
- si ya tienes una configuración principal grande de Nginx, la configuración generada por la CLI suele encajar mejor como fragmento de sitio que como reemplazo de toda la configuración principal
- si más adelante cambias configuraciones como `app-port` o `app-public-path` que afecten al comportamiento del proxy, vuelve a ejecutar `generate`

## Enlaces relacionados

- [Reverse Proxy en producción](./index.md)
- [Caddy](./caddy.md)
- [Instalar con la CLI](../../installation/cli.md)
- [Instalar con Docker Compose](../../installation/docker-compose.md)
- [Variables de entorno](../../installation/env.md)
