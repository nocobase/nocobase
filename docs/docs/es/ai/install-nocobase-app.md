---
title: Instalar la aplicación NocoBase
description: Instale NocoBase CLI y cree rápidamente una nueva aplicación NocoBase con `nb init --ui`, para que su AI Agent pueda empezar a trabajar enseguida.
---

# Instalar la aplicación NocoBase

Si todavía no tiene una aplicación NocoBase, la forma más rápida es instalar primero `@nocobase/cli` y luego ejecutar una vez `nb init --ui`. En la mayoría de los casos, la configuración por defecto del asistente es suficiente.

## Requisitos previos

- Node.js >= 22
- Yarn 1.x
- Si piensa instalar con Docker, asegúrese primero de que Docker ya esté en ejecución

## Paso 1: Instalar CLI

Primero instale NocoBase CLI de forma global:

```bash
npm install -g @nocobase/cli
nb --version
```

Si suele trabajar con varios terminales al mismo tiempo o quiere operar en paralelo con AI Agents, también le recomendamos ejecutar `nb session setup` una vez. Así, cada sesión mantendrá su propio `current env` y será menos probable que se interfieran entre sí.

## Paso 2: Inicializar la aplicación

La opción recomendada es abrir directamente el asistente visual:

```bash
nb init --ui
```

En el asistente, complete estos pasos en orden:

1. Defina el nombre de la aplicación - también será el nombre del env en la CLI
2. Seleccione "Instalación nueva"
3. Elija el método de instalación - Docker, npm o Git
4. Configure el puerto, la base de datos y la cuenta del administrador
5. Espere a que finalicen la descarga, la instalación y el arranque

Si prefiere trabajar desde la terminal, también puede ejecutar:

```bash
nb init
```

Si necesita inicializar en scripts o en CI, utilice el modo no interactivo:

```bash
nb init --yes --env app1
```

:::tip Instalación en un servidor remoto

Si ejecuta `nb init --ui` en un servidor, le recomendamos cambiar primero el host por defecto a la IP actual del servidor. Así podrá abrir el asistente desde su navegador local.

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

:::

## Paso 3: Confirmar que la aplicación está lista

Después de la instalación, normalmente conviene confirmar primero estas tres cosas:

- Que el env se haya guardado correctamente
- Que la aplicación se haya iniciado con normalidad
- Que pueda iniciar sesión con la cuenta de administrador

Los comandos más comunes son:

```bash
nb env list
nb env status
nb app logs
```

Si se trata de una instalación local con la configuración por defecto, normalmente podrá abrir `http://localhost:13000` directamente en el navegador. Después de iniciar sesión, abra una nueva sesión del AI Agent o reinicie la actual, y la IA podrá empezar a trabajar con esta aplicación NocoBase.

La configuración de la CLI se guarda por defecto en `~/.nocobase/`, por lo que los AI Agents normalmente pueden acceder a ella desde cualquier directorio de trabajo.

Si esta aplicación va a exponerse a usuarios reales más adelante, no recomendamos mantenerla a largo plazo usando directamente `IP + port`. El siguiente paso habitual es colocarla detrás de un proxy inverso y habilitar HTTPS.

## Qué hacer después

- Si ya tiene una instancia NocoBase en funcionamiento, consulte directamente la [Guía de integración para AI Agent](./quick-start.mdx)
- Si quiere continuar con un despliegue en producción, consulte [Instalar con CLI](../nocobase-cli/installation/cli.md) y [Resumen del despliegue en producción](../nocobase-cli/production/index.md)
- Si quiere que la IA empiece a construir la aplicación a continuación, consulte [AI Builder](../ai-builder/index.md)
