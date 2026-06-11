#Nginx

Si ha utilizado Nginx para administrar el sitio en el servidor, o necesita manejar certificados, cachés y control de acceso más adelante, entonces `nb proxy nginx` es la ruta recomendada predeterminada.

Si solo desea configurar HTTPS lo antes posible y no desea mantener demasiados detalles del proxy, entonces [Caddy](./caddy.md) estará más libre de preocupaciones. Pero siempre que utilice Nginx, este documento es la ruta predeterminada.

## ¿Cuándo es más adecuado utilizar Nginx?

En términos generales, las siguientes situaciones dan prioridad a seguir utilizando Nginx:

- Ha utilizado Nginx para administrar varios sitios en el servidor.
- Necesitará mantener usted mismo los certificados, cachés, controles de acceso o más reglas personalizadas más adelante
- Quiere que la capa de entrada continúe usando el método de operación y mantenimiento de Nginx existente.

Si su objetivo es simplemente transmitir HTTPS lo más rápido posible y no desea mantener demasiados detalles de TLS, entonces [Caddy](./caddy.md) estará más libre de preocupaciones.

## Primero sigue estos tres comandos.

Si solo desea ejecutar primero la capa de entrada de Nginx, basta con recordar estos tres comandos de forma predeterminada:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Si Nginx se instaló localmente, simplemente cambie la primera entrada a `nb proxy nginx use local`.

En la mayoría de los escenarios, basta con ejecutar `use` primero, luego `generate` y finalmente `reload`. Para obtener más detalles y más comandos, consulte los siguientes capítulos o la referencia de CLI.

## Paso 1: Primero seleccione cómo ejecutar Nginx usted mismo

Si Nginx ya está instalado en la máquina actual, simplemente use `use local`.

Si desea utilizar la versión Docker de Nginx, utilice `use docker`.

`local` / `docker` aquí se refiere al modo de ejecución del propio **Nginx**.

Usando la versión Docker de Nginx:

```bash
nb proxy nginx use docker
```

Usando un Nginx instalado localmente:

```bash
nb proxy nginx use local
```

Si olvida qué método está seleccionado actualmente más adelante, puede ejecutar:

```bash
nb proxy nginx current
```

## Paso 2: Ejecutar `generate`

`generate` se utiliza para generar la configuración de entrada de Nginx de acuerdo con el entorno especificado. La forma más común de escribirlo es:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Si también desea especificar el puerto de entrada, también puede escribirlo juntos:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

El significado de los parámetros aquí es:

- `--env`: especifique para qué entorno CLI generar la configuración
- `--host`: Especifique el nombre de dominio para acceso externo
- `--port`: Especifica el puerto de entrada del proxy, no el `appPort` de la propia aplicación NocoBase.

El puerto de la aplicación ascendente proviene del `appPort` guardado de este entorno. Si el comando indica que falta env `appPort`, ejecute:

```bash
nb env update test2 --app-port 56575
```

Si luego cambia configuraciones como `app-port` y `app-public-path` que afectarán los resultados del proxy, recuerde volver a ejecutar `generate`.

## Paso 3: Ejecutar `reload`

Después de generar la configuración, ejecute directamente:

```bash
nb proxy nginx reload
```

En la mayoría de los escenarios, utilice este comando directamente. Si aún no se está ejecutando, el inicio se procesará internamente primero; si ya se está ejecutando, se recargará según la última configuración.

## ¿Qué archivos mantendrá la CLI?

Tomando `test2` como ejemplo, los comandos relacionados con Nginx generalmente mantienen estos archivos y directorios:

| camino | función |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Directorio de fragmentos compartidos de Nginx |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Configuración de entrada de sitio editable |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | Página alternativa de SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | Página alternativa de SPA v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Directorio de productos de compilación front-end utilizados actualmente |
| `NB_CLI_ROOT/test2/storage/uploads` | El directorio de carga de la aplicación actual |

en:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` Los siguientes son archivos auxiliares del agente mantenidos por CLI
- `NB_CLI_ROOT/test2/storage/...` Los siguientes son los recursos estáticos y los directorios de carga propios de la aplicación.
- `app.conf` se puede cambiar, pero se debe conservar el bloque administrado de NocoBase
- `index-v1.html` y `index-v2.html` reescribirán automáticamente las direcciones de recursos de acuerdo con la subruta del entorno actual, la versión del cliente activo y `CDN_BASE_URL`

:::nota de advertencia

Si desea agregar configuración de Nginx a nivel de sitio, como limitación actual, encabezados adicionales y control de acceso, simplemente cambie `app.conf`. Los archivos auxiliares administrados por CLI se actualizan sincrónicamente en reconstrucciones posteriores.

:::

## Configuración manuscrita: qué hacer sin CLI

Si su aplicación no está alojada en CLI o desea explícitamente mantener usted mismo la configuración completa de Nginx, también puede escribirla a mano.

Sin embargo, para NocoBase, el proxy inverso de producción suele ser más que un simple `proxy_pass`. Además de reenviar solicitudes de API a la aplicación de backend, una configuración completa y utilizable generalmente necesita manejar el directorio de carga, los recursos estáticos de front-end, WebSocket, la ruta `.well-known` y la página alternativa de SPA.

Tomando `test2` como ejemplo, los archivos y directorios clave relacionados con Nginx generalmente incluyen:

- Fragmentos de Nginx: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Configuración de entrada editable: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- Página alternativa de SPA (v1): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- Página alternativa de SPA (v2): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Directorio de productos de compilación front-end: `NB_CLI_ROOT/test2/storage/dist-client`
- Directorio de carga: `NB_CLI_ROOT/test2/storage/uploads`

En otras palabras, la configuración escrita a mano normalmente debe cubrir al menos los siguientes tipos de entradas:

- `uploads`: exponer el directorio de carga a través de `alias`
- `dist`: exponer el directorio de productos de compilación front-end a través de `alias`
- `well-known`: Manejar rutas de descubrimiento relacionadas con OAuth/OpenID
- `api`: reenviar la solicitud `/api/` a la aplicación backend
- `ws`: reenvía solicitudes de WebSocket a la aplicación backend
- `spa`: proporciona entrada frontal y `try_files` respaldo para `/` y `/v/`

Por lo tanto, una configuración completa de Nginx generalmente no es solo el siguiente método general de escritura de proxy inverso:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Para una aplicación alojada en CLI como `test2`, una estructura más cercana a una implementación real normalmente tendría este aspecto:

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

Hay dos puntos clave aquí:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` Los siguientes son archivos auxiliares del agente mantenidos por CLI
- `NB_CLI_ROOT/test2/storage/...` Lo siguiente es utilizar su propio directorio de productos y directorio de carga

Si su aplicación utiliza una implementación de subruta, o los recursos de front-end, el directorio de carga y el proxy inverso no están en la misma perspectiva de ruta, la configuración escrita a mano será más propensa a errores. En este escenario suele ser más recomendable ejecutar:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Luego haga ajustes basados ​​en los resultados generados.

Un enfoque más prudente suele ser:

1. Primero deje que la CLI genere la configuración de Nginx.
2. Confirme la estructura de enrutamiento y la ruta real según los resultados generados.
3. Luego realice ajustes manuales según su nombre de dominio, modo de ejecución y ruta de montaje.

Por lo general, es menos probable que se pierdan detalles relacionados con WebSockets, recursos estáticos, directorios de carga o páginas de respaldo de SPA que escribir a mano una configuración desde cero.

## Cómo manejar HTTPS

Si has decidido seguir usando Nginx, HTTPS también se puede seguir configurando en Nginx. Una práctica común es expandir `listen 80` a `80/443` entrada dual y luego agregar la ruta del certificado y la configuración TLS.

Sin embargo, si solo desea tener HTTPS disponible lo antes posible y no desea manejar la solicitud y renovación del certificado usted mismo, entonces será más fácil usar [Caddy](./caddy.md) directamente.

## Instrucciones comunes

- `nb proxy nginx generate` es para aplicaciones instaladas por `nb init`
- Si posteriormente cambia configuraciones como `app-port` y `app-public-path` que afectarán los resultados del proxy, recuerde volver a ejecutar `generate`

## Enlaces relacionados

- [Proxy inverso del entorno de producción] (./index.md)
- [Caddy](./caddy.md)
- [Instalar usando CLI (recomendado)](../../installation/cli.md)
- [Configuración de la aplicación con `.env`](../../installation/env.md)
- [`nb proxy nginx` Referencia de comando](../../../api/cli/proxy/nginx/index.md)
