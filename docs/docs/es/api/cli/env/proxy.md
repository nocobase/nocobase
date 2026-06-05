---
title: 'nb env proxy'
description: 'Referencia del comando nb env proxy: genera una configuración de proxy Nginx o Caddy para un env gestionado por la CLI.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,configuración de proxy'
---

# nb env proxy

En NocoBase CLI, `nb env proxy` genera una configuración de proxy inverso para un env gestionado por la CLI. Lo normal es usar `nginx`. Cambia a `caddy` solo si ya usas Caddy o si necesitas específicamente un Caddyfile.

Este comando solo funciona para envs gestionados cuyo runtime es accesible desde la máquina actual, es decir, `local` o `docker`. Por ahora no admite envs que solo tengan una conexión de API remota ni envs SSH.

## Uso

```bash
nb env proxy [name] [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `[name]` | string | Nombre del env configurado para el que se va a generar la configuración de proxy. Si se omite, se usa el env actual |
| `--output`, `-o` | string | Ruta del archivo de salida. El valor predeterminado es `~/.nocobase/proxy/<provider>/<env>/generated.<ext>` |
| `--provider` | string | Proveedor de proxy: `nginx` o `caddy` |
| `--host` | string | Host que se escribe en la configuración de entrada, como `example.com` o `localhost` |
| `--port` | string | Puerto que se escribe en la configuración de entrada. Es el puerto de entrada del proxy, no el puerto de la aplicación NocoBase upstream |
| `--install` | boolean | Instala la configuración proxy compartida en la configuración principal del proveedor |
| `--reload` | boolean | Valida y recarga el proveedor después de escribir la configuración |
| `--print` | boolean | Imprime la configuración generada en stdout en lugar de escribir archivos |

## Archivos de salida predeterminados

Si no pasas `--output`, la CLI mantiene tres tipos de archivos en `~/.nocobase/proxy/<provider>/`:

| Proveedor | Archivo generado | Archivo de entrada editable | Configuración principal compartida |
| --- | --- | --- | --- |
| `nginx` | `~/.nocobase/proxy/nginx/<env>/generated.conf` | `~/.nocobase/proxy/nginx/<env>/app.conf` | `~/.nocobase/proxy/nginx/nocobase.conf` |
| `caddy` | `~/.nocobase/proxy/caddy/<env>/generated.caddy` | `~/.nocobase/proxy/caddy/<env>/app.caddy` | `~/.nocobase/proxy/caddy/nocobase.caddy` |

En concreto:

- `generated.*` está gestionado por la CLI y se sobrescribirá la próxima vez que ejecutes `nb env proxy`
- `app.conf` / `app.caddy` es el archivo de entrada editable, pero debes conservar la referencia a la configuración generated que mantiene la CLI
- `nocobase.conf` / `nocobase.caddy` es la configuración principal compartida que incluye los archivos de entrada de todos los envs

Si pasas `--output`, la CLI solo escribe la configuración generada en ese archivo y no crea ni actualiza el archivo de entrada ni la configuración principal compartida.

## Elementos de configuración relacionados

| Elemento de configuración | Valor predeterminado | Descripción |
| --- | --- | --- |
| `proxy.provider` | `nginx` | Proveedor predeterminado usado por `nb env proxy` |
| `proxy.nb-cli-root` | Raíz de la CLI, normalmente el directorio home del usuario actual | Mapea la ruta `.nocobase` a la ruta raíz visible para el proceso del proxy |
| `proxy.upstream-host` | `127.0.0.1` | Host que usa el proxy para reenviar el tráfico de vuelta a la aplicación NocoBase |
| `bin.caddy` | `caddy` | Ruta del ejecutable de Caddy usada por `--install` o `--reload` |
| `bin.nginx` | `nginx` | Ruta del ejecutable de Nginx usada por `--install` o `--reload` |

La mayoría de los entornos no necesitan cambiar `proxy.nb-cli-root`. Normalmente solo hace falta cuando Nginx o Caddy se ejecutan en otro contenedor, otra raíz de montaje o una vista de rutas distinta.

## Notas

- `--port` debe ser un número entero entre `1` y `65535`
- El puerto de la aplicación NocoBase upstream viene del `appPort` guardado en el env, no de `--port`
- Si el comando indica que al env le falta `appPort`, primero ejecuta `nb env update <name>` o guárdalo explícitamente con `nb env update <name> --app-port <port>`
- `--print` no se puede combinar con `--install` ni con `--reload`
- `--output` no se puede combinar con `--install` ni con `--reload`
- `--install` conecta la configuración compartida con la configuración principal del proveedor. `--reload` valida y recarga el proveedor. En la práctica, estas dos opciones suelen usarse juntas

## Ejemplos

```bash
# Genera la configuración nginx predeterminada para el env actual
nb env proxy

# Genera una configuración para un env específico
nb env proxy demo

# Imprime la configuración generada sin escribir archivos
nb env proxy demo --print

# Escribe host y puerto en la configuración de entrada
nb env proxy demo --host demo.local.nocobase.com --port 8080

# Genera una configuración de Caddy
nb env proxy demo --provider caddy --host demo.local.nocobase.com

# Cambia el proveedor predeterminado y el host upstream
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal

# Mapea la ruta .nocobase cuando el proveedor se ejecuta bajo otra ruta raíz
nb config set proxy.nb-cli-root /workspace

# Instala la configuración compartida en la configuración principal del proveedor y recárgalo
nb env proxy demo --install --reload
```

## Comandos relacionados

- [`nb env update`](./update.md)
- [`nb env info`](./info.md)
- [`nb config`](../config/index.md)
- [`nb app start`](../app/start.md)
