---
title: "Reverse Proxy en producción"
description: "Usa nb proxy nginx y nb proxy caddy para generar y gestionar la configuración de reverse proxy para entornos NocoBase gestionados por la CLI."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,reverse proxy,Nginx,Caddy,producción"
---

# Reverse Proxy en producción

En NocoBase CLI, los puntos de entrada recomendados para reverse proxy en producción son:

- `nb proxy nginx`
- `nb proxy caddy`

Donde:

- `proxy` gestiona la capa de entrada
- `nginx` y `caddy` son las implementaciones del proveedor
- `docker` y `local` son los drivers de runtime
- `--env <name>` selecciona para qué env de la CLI se genera la configuración

Siempre que tu aplicación se haya guardado como un env gestionado por la CLI y ese env sea `local` o `docker`, normalmente basta con dejar que la CLI genere y gestione la configuración del reverse proxy. Este enfoque mantiene alineados en un solo lugar el manejo de WebSocket, las subrutas, las páginas fallback de SPA y las actualizaciones posteriores.

Si la aplicación no está gestionada por la CLI, o si intencionalmente quieres mantener toda la configuración del proxy a mano, pasa a las secciones de configuración manual en las páginas específicas del proveedor.

## Antes de empezar

Asegúrate de que:

- la aplicación ya pueda alcanzarse internamente, por ejemplo `http://127.0.0.1:13000`
- la aplicación ya se haya guardado como un env de la CLI y ese env sea `local` o `docker`
- el env ya tenga guardado `appPort`

Si el comando indica que falta `appPort`, actualízalo primero con [`nb env update`](../../../api/cli/env/update.md).

Si más adelante cambias configuraciones como `app-port` o `app-public-path` que afecten al comportamiento del proxy, vuelve a ejecutar el comando `generate` correspondiente.

## Flujo de trabajo predeterminado

Para Nginx:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Para Caddy:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Los roles de estos pasos son:

- `use docker|local`: elegir el driver de runtime del proveedor actual
- `generate --env <name> --host <domain>`: generar la configuración de reverse proxy para un env
- `start`: iniciar el proceso local o el contenedor Docker del proveedor actual

Si actualizas la configuración más tarde, `reload` suele ser la primera opción. Usa `restart` cuando necesites un reinicio completo de la capa de entrada.

## Cómo se divide este grupo de comandos

Tomando Nginx como ejemplo:

| Comando | Propósito |
| --- | --- |
| `nb proxy nginx use docker` | Cambiar la runtime de Nginx a Docker |
| `nb proxy nginx use local` | Cambiar la runtime de Nginx a un proceso local |
| `nb proxy nginx current` | Mostrar el driver de runtime actual |
| `nb proxy nginx generate --env <name> --host <domain>` | Generar la configuración de Nginx para un env |
| `nb proxy nginx start` | Iniciar Nginx |
| `nb proxy nginx reload` | Recargar la configuración de Nginx |
| `nb proxy nginx restart` | Reiniciar Nginx |
| `nb proxy nginx stop` | Detener Nginx |
| `nb proxy nginx status` | Mostrar el estado de Nginx |
| `nb proxy nginx info` | Mostrar la configuración actual, rutas y detalles de runtime |

Caddy usa el mismo conjunto de acciones, pero con una implementación de proveedor distinta.

## Qué mantiene la CLI

La CLI hace más que producir un único fragmento de proxy. También mantiene alineados con el proveedor los archivos auxiliares y la estructura de entrada del sitio:

- Nginx mantiene `snippets` compartidos, `app.conf`, `public/index-v1.html` y `public/index-v2.html`
- Caddy mantiene `nocobase.caddy`, `app.caddy`, `public/index-v1.html` y `public/index-v2.html`, donde `app.caddy` es la configuración completa del sitio para un env

:::warning Nota

Si necesitas añadir configuración a nivel de sitio, normalmente editas `app.conf` para Nginx y usas `app.caddy` como base para Caddy. No edites directamente los archivos auxiliares gestionados por la CLI. Ten en cuenta además que `app.caddy` se sobrescribe por completo cuando vuelves a ejecutar `generate`, mientras que `nocobase.caddy` sirve principalmente como archivo de entrada a nivel de proveedor.

:::

## Qué página abrir primero

| Quiero... | Ir aquí |
| --- | --- |
| Seguir usando Nginx para sitios, certificados, caché o control de acceso | [Nginx](./nginx.md) |
| Poner HTTPS en marcha rápidamente con menos detalles de TLS por mantener | [Caddy](./caddy.md) |
| Ajustar configuraciones del env que puedan afectar el comportamiento del proxy, como `app-port` o `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Instalar primero la aplicación como un env gestionado por la CLI | [Instalar con la CLI](../../installation/cli.md) |

## Cuándo la ruta de la CLI no es la adecuada

En estos casos, las secciones de configuración manual en las páginas específicas del proveedor suelen encajar mejor:

- la aplicación no está gestionada por la CLI
- el env es solo una conexión API remota o un env SSH
- quieres mantener por tu cuenta toda la configuración de Nginx o todo el `Caddyfile`

Mientras la aplicación se haya guardado como un env de la CLI y su runtime sea accesible desde la máquina actual, este grupo de comandos sigue siendo la opción predeterminada recomendada. Normalmente es mucho más fácil de mantener cuando más adelante necesites cambiar el dominio, añadir configuración a nivel de sitio, cambiar drivers o regenerar los archivos de entrada.

## Enlaces relacionados

- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [Variables de entorno](../../installation/env.md)
- [Instalar con la CLI](../../installation/cli.md)
