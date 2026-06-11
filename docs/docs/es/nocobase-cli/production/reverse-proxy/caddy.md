#Caddie

Si ya tiene un nombre de dominio y desea configurar HTTPS lo antes posible, entonces `nb proxy caddy` suele ser el método de entrada más sencillo.

En lugar de mantener usted mismo la configuración del certificado de Nginx, Caddy se parece más al acceso directo predeterminado para "ejecutar primero a través de la capa de entrada".

## ¿Cuándo es más apropiado utilizar Caddy?

En términos generales, Caddy tiene prioridad en las siguientes situaciones:

- Ya tienes un nombre de dominio y quieres acceder a HTTPS lo antes posible
- No desea mantener demasiados certificados y detalles TLS usted mismo
- Todo lo que necesitas es una capa de entrada sencilla y estable.

Si ya ha utilizado Nginx para administrar muchos sitios en el servidor, o necesita realizar un almacenamiento en caché más intensivo, control de acceso y reglas de personalización más adelante, será más sencillo continuar buscando [Nginx] (./nginx.md).

## Primero sigue estos tres comandos.

Si solo deseas ejecutar primero la capa de entrada de Caddy, basta con recordar estos tres comandos por defecto:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy reload
```

Si Caddy se instaló localmente, simplemente cambie la primera entrada a `nb proxy caddy use local`.

En la mayoría de los escenarios, basta con ejecutar `use` primero, luego `generate` y finalmente `reload`. Para obtener más detalles y más comandos, consulte los siguientes capítulos o la referencia de CLI.

## Paso 1: Elige cómo ejecutar Caddy tú mismo

Si Caddy ya está instalado en la máquina actual, simplemente use `use local`.

Si desea utilizar la versión Docker de Caddy, utilice `use docker`.

El `local` / `docker` aquí se refiere a la forma en que **Caddy opera**.

Usando la versión Docker de Caddy:

```bash
nb proxy caddy use docker
```

Usando una instalación local de Caddy:

```bash
nb proxy caddy use local
```

Si olvida qué método está seleccionado actualmente más adelante, puede ejecutar:

```bash
nb proxy caddy current
```

## Paso 2: Ejecutar `generate`

`generate` se utiliza para generar la configuración de Caddy de acuerdo con el entorno especificado. La forma más común de escribirlo es:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Si también desea especificar el puerto de entrada, también puede escribirlo juntos:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

El significado de los parámetros aquí es:

- `--env`: especifique para qué entorno CLI generar la configuración
- `--host`: Especifique el nombre de dominio para acceso externo
- `--port`: Especifique el puerto de entrada del proxy

Para Caddy, `--host` es especialmente importante. En un entorno formal, intente pasar un nombre de dominio que se haya resuelto al servidor actual de forma predeterminada, para que el acceso HTTPS sea más natural.

Si el comando indica que falta env `appPort`, ejecute primero:

```bash
nb env update test2 --app-port 56575
```

Si luego cambia configuraciones como `app-port` y `app-public-path` que afectarán los resultados del proxy, recuerde volver a ejecutar `generate`.

## Paso 3: Ejecutar `reload`

Después de generar la configuración, ejecute directamente:

```bash
nb proxy caddy reload
```

En la mayoría de los escenarios, utilice este comando directamente. Si aún no se está ejecutando, el inicio se procesará internamente primero; si ya se está ejecutando, se recargará según la última configuración.

## ¿Qué archivos mantendrá la CLI?

Tomando `test2` como ejemplo, los comandos relacionados con Caddy generalmente mantienen estos archivos y directorios:

| camino | función |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Configuración completa del sitio generada por CLI |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Archivo de entrada general Caddy, responsable de importar todos los env's `app.caddy` |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | Página alternativa de SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | Página alternativa de SPA v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Directorio de productos de compilación front-end utilizados actualmente |
| `NB_CLI_ROOT/test2/storage/uploads` | El directorio de carga de la aplicación actual |

en:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` Los siguientes son archivos auxiliares del agente mantenidos por CLI
- `NB_CLI_ROOT/test2/storage/...` Los siguientes son los recursos estáticos y los directorios de carga propios de la aplicación.
- `nocobase.caddy` es un archivo de entrada a nivel de proveedor y normalmente no es necesario modificarlo manualmente.
- `app.caddy` es la configuración completa del sitio Caddy de un determinado entorno. Volver a ejecutar `generate` sobrescribirá todo el

:::nota de advertencia

Si desea compensar la configuración a nivel de sitio de Caddy, como encabezados adicionales, autenticación, limitación de velocidad o estrategias de compresión, primero puede realizar ajustes según `app.caddy`; sin embargo, tenga en cuenta que las reejecuciones posteriores de `generate` sobrescribirán este archivo.

:::

## Configuración manuscrita: qué hacer sin CLI

Si su aplicación no está alojada en CLI o desea explícitamente mantener usted mismo la configuración completa de Caddy, también puede escribirla a mano.

Sin embargo, para NocoBase, la entrada del entorno de producción generalmente no es solo un simple `reverse_proxy`. Además de reenviar solicitudes de API a la aplicación de backend, una configuración de Caddy completa y funcional generalmente también necesita manejar el directorio de carga, los recursos estáticos de front-end, el enrutamiento `.well-known`, WebSocket y la página alternativa de SPA.

Tomando `test2` como ejemplo, los directorios clave relacionados con Caddy generalmente incluyen:

- Directorio de páginas alternativas de SPA: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Directorio de productos de compilación front-end: `NB_CLI_ROOT/test2/storage/dist-client`
- Directorio de carga: `NB_CLI_ROOT/test2/storage/uploads`

En otras palabras, la configuración escrita a mano normalmente debe cubrir al menos los siguientes tipos de entradas:

- `v`: Redirigir `/v` a `/v/`
- `uploads`: exponer directorio de carga
- `dist`: exponer el directorio de productos de compilación front-end
- `oauth well-known`: Manejar rutas de descubrimiento de OAuth
- `openid well-known`: Manejar rutas de descubrimiento de OpenID
- `api`: reenviar la solicitud `/api/` a la aplicación backend
- `ws`: reenvía solicitudes de WebSocket a la aplicación backend
- `spa v2`: proporciona entrada frontal y página de retorno para `/v/`
- `spa v1`: proporciona entrada frontal y página de retorno para `/`

Por lo tanto, una configuración completa de Caddy generalmente no se escribe simplemente de la siguiente manera general:

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Para una aplicación alojada en CLI como `test2`, una estructura más cercana a una implementación real normalmente tendría este aspecto:

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

También hay dos puntos clave aquí:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` El siguiente es el directorio de la página de reversión de SPA mantenido por CLI
- `NB_CLI_ROOT/test2/storage/...` El siguiente es el uso de su propio directorio de productos de compilación y directorio de carga.

Si su aplicación utiliza una implementación de subruta, o los recursos de front-end, el directorio de carga y la capa de entrada no están en la misma perspectiva de ruta, la configuración escrita a mano será más propensa a errores. En este escenario suele ser más recomendable ejecutar:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Luego haga ajustes basados ​​en los resultados generados.

Si desea dejar que la CLI le ayude a recorrer los caminos y rutas primero, la estructura generada normalmente será:

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

en:

- `nocobase.caddy` es responsable de unificar `import */app.caddy`
- `test2/app.caddy` es la configuración completa del sitio de este entorno `test2`
- `public/index-v1.html` y `public/index-v2.html` son páginas alternativas de SPA generadas por CLI

Un enfoque más prudente suele ser:

1. Primero deje que la CLI genere la configuración de Caddy.
2. Confirme la estructura de enrutamiento y la ruta real según los resultados generados.
3. Luego realice ajustes manuales según su nombre de dominio, modo de ejecución y ruta de montaje.

Por lo general, es menos probable que se pierdan detalles relacionados con WebSockets, recursos estáticos, directorios de carga, rutas `.well-known` o páginas de respaldo de SPA que escribir a mano una configuración desde cero.

## Verificar y recargar la configuración

Si escribe o ajusta manualmente la configuración de Caddy, verifíquela primero después de realizar los cambios y luego vuelva a cargarla:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Si no está utilizando `systemd` para administrar Caddy, puede usar sus propios métodos de inicio y recarga.

Si administra la capa de entrada a través de `nb proxy caddy`, generalmente se prefiere usar:

```bash
nb proxy caddy reload
```

Si desea ver el controlador actual, la ruta total del archivo de entrada, el directorio raíz de tiempo de ejecución y el contenedor o información binaria local, puede ejecutar:

```bash
nb proxy caddy info
```

Si solo desea confirmar rápidamente si se está ejecutando, puede ejecutar:

```bash
nb proxy caddy status
```

## Instrucciones comunes

- `nb proxy caddy generate` es para aplicaciones instaladas por `nb init`
- Si ya tiene un nombre de dominio que se puede resolver normalmente en el servidor, Caddy suele ser la forma más rápida de obtener HTTPS.
- Si posteriormente cambia configuraciones como `app-port` y `app-public-path` que afectarán los resultados del proxy, recuerde volver a ejecutar `generate`

## Enlaces relacionados

- [Proxy inverso del entorno de producción] (./index.md)
-[Nginx](./nginx.md)
- [Instalar usando CLI (recomendado)](../../installation/cli.md)
- [Configuración de la aplicación con `.env`](../../installation/env.md)
- [`nb proxy caddy` Referencia de comando](../../../api/cli/proxy/caddy/index.md)
