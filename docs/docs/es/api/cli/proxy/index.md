---
title: "nb proxy"
description: "Referencia del grupo de comandos nb proxy: elegir el proveedor Nginx o Caddy y gestionar los puntos de entrada reverse proxy para entornos gestionados por la CLI."
keywords: "nb proxy,NocoBase CLI,nginx,caddy,reverse proxy,configuración de proxy"
---

# nb proxy

En NocoBase CLI, `nb proxy` es el punto de entrada unificado para la gestión del reverse proxy.

Separa la gestión del env de la gestión de la capa de entrada:

- `nb env` guarda y mantiene los entornos de la aplicación
- `nb proxy` genera y administra los puntos de entrada de Nginx o Caddy para esos entornos gestionados por la CLI

Siempre que tu aplicación ya se haya guardado como un env gestionado por la CLI y ese env sea `local` o `docker`, normalmente basta con elegir un subcomando del proveedor.

## Uso

```bash
nb proxy <provider> <command>
```

## Árbol de comandos

```bash
nb proxy nginx use <local|docker>
nb proxy nginx current
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
nb proxy nginx start
nb proxy nginx restart
nb proxy nginx reload
nb proxy nginx stop
nb proxy nginx status
nb proxy nginx info

nb proxy caddy use <local|docker>
nb proxy caddy current
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
nb proxy caddy start
nb proxy caddy restart
nb proxy caddy reload
nb proxy caddy stop
nb proxy caddy status
nb proxy caddy info
```

## Proveedores

| Quiero... | Ir aquí |
| --- | --- |
| Seguir usando Nginx para sitios, certificados, caché o control de acceso | [`nb proxy nginx`](./nginx/index.md) |
| Poner HTTPS en marcha rápidamente y mantener menos detalles de TLS por mi cuenta | [`nb proxy caddy`](./caddy/index.md) |
| Ajustar configuraciones del env que puedan afectar el resultado del proxy, como `app-port` o `app-public-path` | [`nb env update`](../env/update.md) |

## Notas

- `nb proxy` no tiene flags independientes
- Usa `nb proxy nginx` o `nb proxy caddy` para generar y gestionar puntos de entrada
- Ambos proveedores solo funcionan para entornos gestionados cuya runtime sea accesible desde la máquina actual, es decir, `local` o `docker`
- Ambos proveedores admiten dos drivers: `local` y `docker`
- `use` guarda el driver predeterminado, y `current` imprime directamente el driver actual
- `generate` escribe o actualiza archivos de configuración de entrada y no inicia automáticamente el proceso del proxy
- `start`, `restart`, `reload`, `stop`, `status` e `info` operan todos sobre la runtime del driver actual
- Si cambias configuraciones como `app-port` o `app-public-path` con `nb env update`, normalmente tendrás que volver a ejecutar después el comando `generate` correspondiente
- Este grupo de comandos todavía no funciona para entornos que solo tienen una conexión de API remota ni para entornos SSH

## Flujo típico

```bash
# 1. Elegir proveedor y driver de runtime
nb proxy nginx use docker

# 2. Generar la configuración de entrada para un env gestionado por la CLI
nb proxy nginx generate --env app1 --host app1.example.com

# 3. Iniciar el proxy
nb proxy nginx start

# 4. Revisar el estado y la información de rutas
nb proxy nginx status
nb proxy nginx info

# 5. Recargar después de cambios de configuración
nb proxy nginx reload
```

Si eliges Caddy, sustituye `nginx` por `caddy` en los comandos anteriores.

## Diferencias comunes entre comandos

| Comando | Propósito |
| --- | --- |
| `use` | Cambiar el driver predeterminado del proveedor actual |
| `current` | Imprimir el driver actual del proveedor, como `local` o `docker` |
| `generate` | Generar o actualizar archivos de entrada del proxy para un env |
| `start` | Iniciar el proxy con el driver actual |
| `reload` | Recargar la configuración sin detener el servicio |
| `restart` | Detener y volver a iniciar |
| `stop` | Detener el proxy |
| `status` | Mostrar el estado de runtime |
| `info` | Mostrar el driver, la ruta del archivo de configuración, la raíz de runtime, el host upstream y otros detalles de runtime |

## Ejemplos

```bash
# Generar e iniciar Nginx para un env
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# Generar e iniciar Caddy para un env
nb proxy caddy use local
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy start
```

## Comandos relacionados

- [`nb proxy nginx`](./nginx/index.md)
- [`nb proxy caddy`](./caddy/index.md)
- [`nb env update`](../env/update.md)
- [`nb env info`](../env/info.md)
- [`nb config`](../config/index.md)
