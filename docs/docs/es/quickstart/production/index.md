---
title: "Despliegue en producción"
description: "Despliega NocoBase en producción con dos pasos finales: habilitar el inicio automático de la aplicación y configurar un proxy inverso."
keywords: "NocoBase,despliegue en producción,nb app autostart,nb env proxy,Nginx,Caddy"
---

# Despliegue en producción

Si tu aplicación NocoBase ya funciona correctamente en el servidor, normalmente solo faltan dos pasos para ponerla en producción:

1. Asegurarte de que la aplicación se inicie automáticamente después de reiniciar la máquina
2. Colocar un proxy inverso delante de la aplicación para ofrecer un acceso externo estable

En NocoBase CLI, los comandos principales son:

- `nb app autostart`
- `nb env proxy`

Esta página explica primero el flujo general. Para los detalles de Nginx o Caddy, continúa con sus páginas correspondientes.

## Paso 1: habilitar el inicio automático de la aplicación

En producción, la primera prioridad no es el dominio, sino asegurarte de que el servicio pueda recuperarse de forma fiable después de reinicios, recreación de contenedores o tareas de mantenimiento.

En la CLI, `nb app autostart` es un grupo de comandos. Los más comunes son:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Habilita el inicio automático para el env actual:

```bash
nb app autostart enable
```

Si quieres apuntar explícitamente a otro env:

```bash
nb app autostart enable --env app1 --yes
```

Después puedes comprobar qué envs están marcados para inicio automático:

```bash
nb app autostart list
```

Después de arrancar el sistema, ejecuta el siguiente comando para iniciar todos los envs que tengan el inicio automático habilitado:

```bash
nb app autostart run
```

Si quieres ver la salida subyacente del arranque para depuración:

```bash
nb app autostart run --verbose
```

:::tip Qué hace realmente esto

`nb app autostart enable` marca un env gestionado por la CLI como permitido para iniciarse automáticamente.  
`nb app autostart run` es el comando que realmente inicia todos los envs que se marcaron para inicio automático.

En otras palabras, en un entorno de producción real normalmente también necesitas integrar `nb app autostart run` en tu propio flujo de arranque del sistema, como `systemd`, un script de inicio de tu plataforma de contenedores o cualquier otro mecanismo de arranque del host que ya utilices.

:::

### Alcance

`nb app autostart` solo se aplica a los envs con un runtime gestionado por la CLI en la máquina actual:

- `local`
- `docker`

Si el env es solo una conexión a una API remota, o si la aplicación no está gestionada localmente por la CLI en esta máquina, estos comandos no son la herramienta adecuada para el inicio automático.

## Paso 2: configurar un proxy inverso

Una vez que la aplicación pueda recuperarse automáticamente, el siguiente paso es gestionar el punto de entrada externo. En producción, el proxy inverso suele encargarse de:

- asociar el dominio o el puerto público
- reenviar tráfico HTTP y WebSocket a NocoBase
- gestionar HTTPS, certificados, caché o control de acceso

En NocoBase CLI, los puntos de entrada recomendados son:

- `nb env proxy nginx`
- `nb env proxy caddy`

### Enfoque predeterminado

Si tu aplicación ya está guardada como un env de la CLI y es un env `local` o `docker`, normalmente basta con dejar que la CLI genere la configuración del proxy:

```bash
nb env proxy nginx --env app1 --host app.example.com
nb env proxy caddy --env app1 --host app.example.com
```

Si el env actual ya es el env de destino, puedes omitir `--env`:

```bash
nb env proxy nginx --host app.example.com
```

La CLI ayuda a cubrir detalles que es fácil pasar por alto en configuraciones escritas a mano, por ejemplo:

- reenvío de WebSocket
- rutas de entrada y de recursos estáticos en despliegues bajo subruta
- páginas de fallback para SPA
- archivos de configuración compartidos del proveedor

### Cuándo elegir Nginx o Caddy

Normalmente puedes decidir así:

| Escenario | Recomendado |
| --- | --- |
| Ya usas Nginx para sitios, caché, certificados o control de acceso | [Nginx](./reverse-proxy/nginx.md) |
| Ya tienes un dominio y quieres poner HTTPS en marcha rápidamente con menos mantenimiento de TLS | [Caddy](./reverse-proxy/caddy.md) |
| Primero quieres ver la explicación general de este grupo de comandos | [Production Reverse Proxy](./reverse-proxy/index.md) |

Si cambias configuraciones del env que afecten al resultado del proxy, como `app-port` o `app-public-path`, recuerda volver a ejecutar el subcomando de proxy correspondiente.

## Ruta recomendada de despliegue

Si quieres la ruta más sencilla para producción, este orden suele funcionar bien:

1. Asegúrate de que la aplicación ya pueda arrancar correctamente en el propio servidor
2. Ejecuta `nb app autostart enable`
3. Añade `nb app autostart run` a tu proceso de arranque del sistema
4. Elige Nginx o Caddy y ejecuta el subcomando `nb env proxy` correspondiente
5. Verifica el acceso externo a través del dominio final o de la dirección pública

## Enlaces rápidos

| Quiero... | Lee esto |
| --- | --- |
| Empezar por la explicación general del proxy inverso | [Production Reverse Proxy](./reverse-proxy/index.md) |
| Seguir usando Nginx para la capa de entrada | [Nginx](./reverse-proxy/nginx.md) |
| Usar Caddy para una configuración HTTPS más rápida | [Caddy](./reverse-proxy/caddy.md) |
| Gestionar arranque, parada, logs y actualizaciones | [Manage Apps](../operations/manage-app.md) |
| Leer la referencia CLI de `nb env proxy` | [`nb env proxy`](../../api/cli/env/proxy/index.md) |

## Comandos relacionados

```bash
# Habilitar inicio automático para un env
nb app autostart enable --env app1 --yes

# Listar el estado del inicio automático
nb app autostart list

# Iniciar todos los envs con inicio automático habilitado
nb app autostart run

# Generar la configuración de proxy inverso para Nginx
nb env proxy nginx --env app1 --host app.example.com

# Generar la configuración de proxy inverso para Caddy
nb env proxy caddy --env app1 --host app.example.com
```
