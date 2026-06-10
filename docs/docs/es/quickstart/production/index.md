---
title: "Despliegue en producción"
description: "Completa rápidamente el despliegue en producción de NocoBase: primero configura el autoarranque de la app y luego el reverse proxy."
keywords: "NocoBase,despliegue en producción,nb app autostart,nb proxy nginx,nb proxy caddy,Nginx,Caddy"
---

# Despliegue en producción

Si tu aplicación NocoBase ya puede ejecutarse con normalidad en el servidor, normalmente un despliegue en producción solo necesita dos cosas más:

1. asegurarte de que la aplicación pueda recuperarse automáticamente después de reiniciar la máquina
2. añadir un punto de entrada reverse proxy para que la aplicación pueda ser accesible desde fuera de forma estable

En NocoBase CLI, los grupos de comandos principales para esto son:

- `nb app autostart`
- `nb proxy`

Esta página explica primero el flujo general. Para detalles de Nginx o Caddy, continúa con las páginas específicas de cada proveedor.

## Paso 1: configurar el autoarranque de la app

En producción, la prioridad no es el dominio, sino asegurarse de que el servicio pueda recuperarse de forma fiable. De lo contrario, después de reiniciar la máquina, recrear contenedores o realizar operaciones de mantenimiento, la aplicación puede no volver automáticamente.

Los subcomandos más comunes de `nb app autostart` son:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Activar autoarranque para el env actual:

```bash
nb app autostart enable
```

Si el objetivo no es el env actual, indícalo explícitamente:

```bash
nb app autostart enable --env app1 --yes
```

Comprobar qué entornos están marcados para autoarranque:

```bash
nb app autostart list
```

Después del arranque del sistema, iniciar todos los entornos habilitados:

```bash
nb app autostart run
```

Si quieres una salida de arranque detallada durante la depuración:

```bash
nb app autostart run --verbose
```

:::tip Qué hace realmente este paso

`nb app autostart enable` marca un env gestionado por la CLI como permitido para iniciarse automáticamente. `nb app autostart run` inicia realmente todos los entornos que tengan el autoarranque activado.

En producción, normalmente todavía tendrás que conectar `nb app autostart run` a tu propio flujo de arranque del sistema, como `systemd`, un script de inicio de la plataforma de contenedores u otro mecanismo de autoarranque a nivel de host que ya utilices.

:::

### Aplicabilidad

`nb app autostart` solo funciona para entornos con una runtime gestionada por la CLI:

- `local`
- `docker`

Si un env es solo una conexión de API remota, o la aplicación no está gestionada localmente por la CLI en la máquina actual, este grupo de comandos no es la forma adecuada de gestionar el autoarranque.

## Paso 2: configurar el reverse proxy

Una vez que la aplicación puede recuperarse automáticamente, toca manejar el punto de entrada externo. En producción, el reverse proxy normalmente se encarga de:

- vincular el dominio o el puerto de entrada
- reenviar solicitudes HTTP y WebSocket a NocoBase
- gestionar HTTPS, certificados, caché o control de acceso

Los puntos de entrada recomendados de la CLI son:

- `nb proxy nginx`
- `nb proxy caddy`

### Flujo de trabajo predeterminado

Si la aplicación ya se ha guardado como un env de la CLI y ese env es `local` o `docker`, el camino habitual es dejar que la CLI genere la configuración directamente:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com

nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
```

Después, inicia el proveedor elegido:

```bash
nb proxy nginx start
nb proxy caddy start
```

La CLI también ayuda con detalles que es fácil pasar por alto en configuraciones escritas a mano, como:

- reenvío de WebSocket
- URLs de entrada y de recursos bajo subrutas
- páginas fallback de SPA
- archivos de configuración compartidos a nivel de proveedor

### Cuándo elegir Nginx o Caddy

| Escenario | Recomendación |
| --- | --- |
| Ya usas Nginx para gestionar sitios, caché, certificados o control de acceso | [Nginx](./reverse-proxy/nginx.md) |
| Ya tienes un dominio y quieres poner HTTPS en marcha rápidamente con menos detalles de TLS por mantener | [Caddy](./reverse-proxy/caddy.md) |
| Quieres ver primero la introducción general | [Reverse Proxy en producción](./reverse-proxy/index.md) |

Si más adelante cambias configuraciones del env como `app-port` o `app-public-path` que afecten al comportamiento del proxy, vuelve a ejecutar el subcomando de proxy correspondiente.

## Ruta predeterminada de despliegue

Para el despliegue en producción más sencillo, normalmente basta con esta secuencia:

1. confirmar que la aplicación ya puede iniciarse con normalidad en el propio servidor
2. ejecutar `nb app autostart enable`
3. conectar `nb app autostart run` al flujo de arranque del sistema
4. elegir Nginx o Caddy y ejecutar el subcomando `nb proxy` correspondiente
5. verificar el acceso externo mediante el dominio o la dirección de entrada

## Índice rápido

| Quiero... | Ir aquí |
| --- | --- |
| Leer primero la introducción general al reverse proxy | [Reverse Proxy en producción](./reverse-proxy/index.md) |
| Seguir usando Nginx en la capa de entrada | [Nginx](./reverse-proxy/nginx.md) |
| Usar Caddy para conseguir HTTPS más rápido | [Caddy](./reverse-proxy/caddy.md) |
| Ver operaciones de arranque, parada, logs y actualización de la app | [Gestionar la aplicación](../operations/manage-app.md) |
| Leer la referencia CLI de `nb proxy nginx` | [`nb proxy nginx`](../../api/cli/proxy/nginx/index.md) |
| Leer la referencia CLI de `nb proxy caddy` | [`nb proxy caddy`](../../api/cli/proxy/caddy/index.md) |

## Comandos relacionados

```bash
# Activar autoarranque para un env
nb app autostart enable --env app1 --yes

# Comprobar el estado del autoarranque
nb app autostart list

# Iniciar todos los entornos activados
nb app autostart run

# Elegir la runtime de Nginx y generar la configuración
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com
nb proxy nginx start

# Elegir la runtime de Caddy y generar la configuración
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
nb proxy caddy start
```
