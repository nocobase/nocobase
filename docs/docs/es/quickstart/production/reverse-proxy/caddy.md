---
title: "Caddy"
description: "Usa nb proxy caddy para generar y gestionar la configuración de reverse proxy de Caddy para entornos NocoBase gestionados por la CLI."
keywords: "NocoBase,nb proxy caddy,reverse proxy,Caddy,producción"
---

# Caddy

Si ya tienes un dominio y quieres poner HTTPS en marcha rápidamente, `nb proxy caddy` suele ser la ruta de entrada más sencilla.

Comparado con mantener tú mismo la configuración de certificados en Nginx, Caddy se parece más al atajo predeterminado para poner la capa de entrada en línea rápidamente.

## Cuándo Caddy encaja mejor

En la práctica, Caddy suele ser la mejor opción cuando:

- ya tienes un dominio y quieres activar HTTPS rápidamente
- no quieres gestionar demasiados detalles de certificados y TLS por tu cuenta
- lo que necesitas es sobre todo una capa de entrada simple y estable

Si ya usas Nginx para gestionar muchos sitios en el mismo servidor, o si todavía necesitas caché más pesada, control de acceso o reglas personalizadas, [Nginx](./nginx.md) suele encajar mejor.

## Orden recomendado: elegir driver, generar configuración y luego iniciar

Para un env gestionado por la CLI de tipo `local` o `docker`, este suele ser el orden recomendado:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

O con un proceso local:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Los comandos de seguimiento más comunes son:

```bash
nb proxy caddy current
nb proxy caddy status
nb proxy caddy info
nb proxy caddy reload
nb proxy caddy restart
nb proxy caddy stop
```

En la mayoría de los casos:

- `current` es la forma más rápida de confirmar el driver de runtime activo
- `status` muestra si Caddy está funcionando con normalidad
- `info` muestra la ruta de configuración actual, la raíz de runtime y otros detalles de runtime
- después de regenerar la configuración, `reload` suele ser el primer comando que debes usar
- usa `restart` cuando necesites un reinicio completo

## Qué necesita `generate` como entrada

La forma más común es:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Si además quieres especificar el puerto de entrada:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Donde:

- `--env`: para qué env de la CLI se generará la configuración
- `--host`: el dominio público
- `--port`: el puerto de entrada del proxy

En Caddy, `--host` es especialmente importante porque la dirección del sitio afecta directamente al flujo de HTTPS. En producción, lo ideal es pasar un dominio que ya resuelva correctamente al servidor actual.

Si el comando indica que falta `appPort`, guárdalo primero:

```bash
nb env update test2 --app-port 56575
```

Si más adelante cambias configuraciones como `app-port` o `app-public-path` que afecten al comportamiento del proxy, vuelve a ejecutar `generate`.

## Archivos que mantiene la CLI

Tomando `test2` como ejemplo, el flujo de Caddy normalmente mantiene:

| Ruta | Propósito |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Configuración completa del sitio generada por la CLI |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Archivo de entrada de Caddy a nivel de proveedor que importa todos los `app.caddy` de los entornos |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | Página fallback de SPA para v1 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | Página fallback de SPA para v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Salida de compilación frontend de la aplicación actual |
| `NB_CLI_ROOT/test2/storage/uploads` | Directorio de uploads de la aplicación actual |

Donde:

- los archivos bajo `NB_CLI_ROOT/.nocobase/proxy/caddy/...` son archivos auxiliares del proxy gestionados por la CLI
- los archivos bajo `NB_CLI_ROOT/test2/storage/...` pertenecen a la propia aplicación
- `nocobase.caddy` es el archivo de entrada a nivel de proveedor y normalmente no necesita edición manual
- `app.caddy` es la configuración completa del sitio para un env y se sobrescribe por completo cuando se vuelve a generar

:::warning Nota

Si necesitas configuración de Caddy a nivel de sitio, como headers adicionales, autenticación, limitación de tasa o políticas de compresión, puedes usar `app.caddy` como base. Pero recuerda que ese archivo se sobrescribirá si vuelves a ejecutar `generate`.

:::

## Configuración manual: cuando no usas la CLI

Si la aplicación no está gestionada por la CLI, o si intencionalmente quieres mantener toda la configuración de Caddy por tu cuenta, también puedes escribirla a mano.

Sin embargo, para NocoBase, una entrada lista para producción suele ser más que un `reverse_proxy` simple. Además de reenviar solicitudes de API a la aplicación backend, una configuración completa de Caddy normalmente necesita manejar conjuntamente uploads, recursos frontend, rutas `.well-known`, WebSocket y páginas fallback de SPA.

Usando `test2` como ejemplo, estas son las rutas clave relacionadas con Caddy:

- Directorio de fallback de SPA: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Salida de compilación frontend: `NB_CLI_ROOT/test2/storage/dist-client`
- Directorio de uploads: `NB_CLI_ROOT/test2/storage/uploads`

En otras palabras, una configuración manual normalmente necesita cubrir al menos estas áreas de entrada:

- `v`: redirigir `/v` a `/v/`
- `uploads`: exponer el directorio de uploads
- `dist`: exponer la salida de compilación frontend
- `oauth well-known`: manejar la ruta de descubrimiento de OAuth
- `openid well-known`: manejar la ruta de descubrimiento de OpenID
- `api`: reenviar solicitudes `/api/` a la aplicación backend
- `ws`: reenviar solicitudes WebSocket a la aplicación backend
- `spa v2`: servir `/v/` con la entrada y fallback de v2
- `spa v1`: servir `/` con la entrada y fallback de v1

Así que una configuración completa de Caddy suele ser bastante más que un ejemplo genérico como este:

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Para una aplicación gestionada por la CLI como `test2`, una estructura de despliegue más realista suele parecerse más a esto:

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

    @oauth path_regexp oauth ^/\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
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

Aquí también importan especialmente dos detalles:

- los archivos bajo `NB_CLI_ROOT/.nocobase/proxy/caddy/...` son archivos fallback de SPA gestionados por la CLI
- los archivos bajo `NB_CLI_ROOT/test2/storage/...` pertenecen a la salida de compilación y a los uploads de la aplicación

Si la aplicación usa despliegue bajo subruta, o si los recursos frontend, los uploads y la capa de entrada no comparten la misma visión de rutas, la configuración manual se vuelve más fácil de romper. En esos casos, normalmente es más seguro generar primero la configuración:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Y luego usar el resultado generado como base para ajustes manuales.

Si quieres que la CLI deje primero funcionando rutas y paths, la estructura generada normalmente se verá así:

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

Donde:

- `nocobase.caddy` importa todos los archivos `*/app.caddy`
- `test2/app.caddy` es la configuración completa del sitio para el env `test2`
- `public/index-v1.html` y `public/index-v2.html` son páginas fallback de SPA generadas por la CLI

El flujo más seguro suele ser:

1. dejar que la CLI genere primero la configuración de Caddy
2. usar el resultado generado para confirmar la estructura de rutas y las rutas reales del sistema de archivos
3. ajustar después según tu dominio, driver de runtime y diseño de montajes

Normalmente esto es menos propenso a errores que escribir toda la configuración desde cero.

## Validar y recargar la configuración

Si escribes o ajustas la configuración de Caddy manualmente, valídala primero y luego recárgala:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Si no usas `systemd` para gestionar Caddy, sustituye eso por tu propio flujo de inicio y recarga.

Si gestionas la capa de entrada mediante `nb proxy caddy`, la opción habitual es:

```bash
nb proxy caddy reload
```

Si quieres ver el driver actual, la ruta del archivo principal de configuración, la raíz de runtime y los detalles del contenedor o del binario local, ejecuta:

```bash
nb proxy caddy info
```

Si solo quieres confirmar rápidamente si Caddy ya está en ejecución, usa:

```bash
nb proxy caddy status
```

## Notas comunes

- `nb proxy caddy generate` solo funciona para entornos gestionados por la CLI cuya runtime sea accesible desde la máquina actual, es decir, `local` o `docker`
- si el comando indica que falta `appPort`, ejecuta primero `nb env update <name> --app-port <port>`
- si ya tienes un dominio que resuelve correctamente al servidor actual, Caddy suele ser la forma más rápida de conseguir HTTPS
- si más adelante cambias configuraciones como `app-port` o `app-public-path` que afecten al comportamiento del proxy, vuelve a ejecutar `generate`

## Enlaces relacionados

- [Reverse Proxy en producción](./index.md)
- [Nginx](./nginx.md)
- [Instalar con la CLI](../../installation/cli.md)
- [Instalar con Docker Compose](../../installation/docker-compose.md)
- [Variables de entorno](../../installation/env.md)
