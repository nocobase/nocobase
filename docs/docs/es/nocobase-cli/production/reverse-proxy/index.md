---
title: "Proxy inverso del entorno de producción"
description: "Genere y administre la configuración de proxy inverso para el entorno NocoBase alojado en CLI basado en nb proxy nginx y nb proxy caddy."
keywords: "NocoBase, nb proxy nginx, nb proxy caddy, proxy inverso, Nginx, Caddy, entorno de producción"
---


# Proxy inverso

Este artículo solo se aplica a las aplicaciones instaladas con `nb init`.

En NocoBase, el proxy inverso del entorno de producción hace más que simplemente reenviar solicitudes al proceso de solicitud. A menudo, los detalles de WebSockets, subrutas, recursos estáticos de front-end, directorios de carga y páginas alternativas de SPA también se manejan al mismo tiempo.

La función de `nb proxy` es recopilar estos detalles que fácilmente se pasan por alto en un conjunto estable de entradas de comando.

## Proceso central

Si solo nos fijamos en el proceso central, basta con recordar estos tres comandos:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Si está utilizando Caddy, simplemente reemplace `nginx` en el comando con `caddy`.

Si Nginx o Caddy se han instalado localmente, simplemente cambie `use docker` en el primer elemento a `use local`.

En la mayoría de los escenarios, basta con ejecutar `use` primero, luego `generate` y finalmente `reload`. Para obtener detalles sobre Nginx o Caddy, continúe en sus respectivas páginas.

## Cuándo elegir Nginx y cuándo elegir Caddy

Por lo general, se puede juzgar así:

| Escenario | Recomendación |
| --- | --- |
| Ya estás usando Nginx para administrar tu sitio, certificados, caché o control de acceso | [Nginx](./nginx.md) |
| Ya tiene un nombre de dominio y desea ejecutar HTTPS lo antes posible y guardar algunos detalles de TLS para mantener | [Caddy](./caddy.md) |

## Continúe leyendo a continuación

| Quiero... | Dónde buscar |
| --- | --- |
| Siga la entrada del sitio de administración de Nginx | [Nginx](./nginx.md) |
| Conecte HTTPS lo antes posible | [Caddy](./caddy.md) |
| Primero ajuste la configuración del entorno que afectará los resultados del proxy, como `app-port`, `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Primero confirme la instalación y configuración ambiental de la aplicación | [Instalar usando CLI (recomendado)](../../installation/cli.md) |
