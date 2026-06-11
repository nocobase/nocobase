---
title: "Descripción general de la implementación del entorno de producción"
description: "Instrucciones generales para la implementación del entorno de producción: después de confirmar que la aplicación se está ejecutando normalmente, agregue las entradas de inicio automático y proxy inverso de la aplicación."
keywords: "NocoBase, implementación del entorno de producción, descripción general, inicio automático de la aplicación, proxy inverso, Nginx, Caddy"
---


# Descripción general de la implementación del entorno de producción

Si su NocoBase ya puede ejecutarse normalmente en el servidor, generalmente necesitará agregar dos capacidades más antes de su lanzamiento oficial:

1. Permita que la aplicación reanude su ejecución automáticamente después de reiniciar la máquina.
2. Conecte la entrada del proxy inverso a la aplicación para proporcionar acceso estable al mundo exterior.

Correspondiente a la CLI de NocoBase, consta principalmente de los dos conjuntos de comandos siguientes:

- `nb app autostart`
- `nb proxy`

Este conjunto de documentos se divide principalmente en dos partes:

1. Inicio automático de la aplicación: permita que la aplicación reanude su ejecución después de que se reinicie la máquina.
2. Proxy inverso: proporciona una entrada de acceso externo estable para las aplicaciones

Primero puede ver qué pieza necesita más actualmente y luego ingresar a la página correspondiente.

## ¿Qué problemas resuelven estas dos piezas en el entorno de producción?

Es decir:

- `nb app autostart` resuelve el problema de "cómo reanudar el funcionamiento de las aplicaciones después del inicio del sistema"
- `nb proxy` resuelve el problema de "cómo proporcionar acceso estable al mundo exterior"

:::consejo ¿Por qué no utiliza directamente Docker, PM2 o ​​la configuración de inicio automático del Supervisor aquí?

`nb app autostart` no pasa por alto estos métodos de gestión de procesos, sino que adapta uniformemente diferentes métodos de gestión de procesos y luego los converge en un conjunto estable de entradas de gestión de inicio automático. De esta manera, no es necesario recordar un conjunto diferente de configuraciones de inicio automático porque la capa subyacente es Docker, PM2 o ​​Supervisor, que puede ser compatible en el futuro.

Cuando el sistema inicie esta capa, seguirá siendo procesada por `systemd`, `launchd` o el script de inicio del host. Se encargan de ejecutarse una vez cuando arranca la máquina:

```bash
nb app autostart run
```

Este comando abrirá todas las aplicaciones que tengan habilitado el inicio automático.

Aquí hay dos capas de cosas que no deben mezclarse:

- Capacidades como Docker, PM2 y Supervisor están más cerca de "cómo se ejecutan normalmente las aplicaciones y cómo gestionar los procesos de las aplicaciones".
- Capacidades como `systemd`, `launchd` y scripts de inicio del host están más cerca de "qué comando ejecutar cuando se inicia el sistema"

Si se encuentra atascado aquí "¿Por qué necesita `nb app autostart`", simplemente continúe leyendo [Inicio automático de la aplicación](./autostart.md) y [nb intención de diseño de la aplicación](../cli-design/nb-app-design-intent.md).

:::

## ¿Qué página debería mirar ahora?

| Quiero... | Dónde buscar |
| --- | --- |
| Deje que el servidor se reinicie primero y luego la aplicación podrá reanudar su ejecución automáticamente | [Inicio automático de la aplicación](./autostart.md) |
| Primero comprenda la relación de entrada de Nginx/Caddy en esta CLI | [Proxy inverso](./reverse-proxy/index.md) |
| Continuar usando Nginx para administrar la entrada al sitio | [Nginx](./reverse-proxy/nginx.md) |
| Conecte HTTPS lo antes posible y mantenga menos detalles TLS | [Caddy](./reverse-proxy/caddy.md) |
| Ver el inicio, detención, registros y actualizaciones de la propia aplicación | [Administrar aplicación](../operations/manage-app.md) |

## Antes de ingresar al entorno de producción, confirme estos requisitos previos

- La aplicación se ha guardado como entorno CLI.
- La aplicación se puede iniciar normalmente en el propio servidor.
- Si vas a conectarte al proxy inverso, `appPort` se ha guardado en env
- Si estás listo para abrirlo oficialmente al mundo exterior, ya has planificado el nombre de dominio, el puerto de entrada y la solución HTTPS.

Si no ha completado la instalación de CLI o la inicialización del entorno, regrese a [Instalación mediante CLI (recomendado)] (../installation/cli.md).

Si el comando indica que falta env `appPort`, primero ejecute [`nb env update`](../../api/cli/env/update.md) para completarlo.

## Enlaces relacionados

- [Inicio automático de la aplicación](./autostart.md)
- [Proxy inverso](./reverse-proxy/index.md)
- [Nginx](./reverse-proxy/nginx.md)
- [Caddy](./reverse-proxy/caddy.md)
- [Administrar aplicación] (../operations/manage-app.md)
