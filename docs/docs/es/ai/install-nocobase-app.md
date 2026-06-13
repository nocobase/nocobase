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

![2026-06-11-20-14-32](https://static-docs.nocobase.com/2026-06-11-20-14-32.png)

Según la ruta de setup que siga, los pasos pueden variar un poco. Si sigue la ruta predeterminada `Install a new app`, normalmente verá estos seis pasos:

1. `Getting started` - definir el identificador `--env` y elegir `Install a new app`
2. `App environment` - configurar los datos básicos de la app, la ubicación de almacenamiento y el puerto de ejecución
3. `App source and version` - elegir cómo obtener la app y qué origen y versión usar
4. `Configure the database` - elegir la base de datos integrada o una base de datos personalizada
5. `Create an admin account` - configurar la primera cuenta de administrador
6. `Connection & authentication` - introducir la URL de acceso de la app y elegir un método de autenticación

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
nb env info
nb app logs
```

Si se trata de una instalación local con la configuración por defecto, normalmente podrá abrir `http://localhost:13000` directamente en el navegador. Después de iniciar sesión, abra una nueva sesión del AI Agent o reinicie la actual, y la IA podrá empezar a trabajar con esta aplicación NocoBase.

La configuración de la CLI se guarda por defecto en `~/.nocobase/`, por lo que los AI Agents normalmente pueden acceder a ella desde cualquier directorio de trabajo.

Si esta aplicación va a exponerse a usuarios reales más adelante, no recomendamos mantenerla a largo plazo usando directamente `IP + port`. El siguiente paso habitual es colocarla detrás de un proxy inverso y habilitar HTTPS.

## Enlaces relacionados

- [Comparación de métodos de instalación y versiones](../get-started/quickstart.md) — Compare primero los métodos de instalación y los canales de versión, y luego decida cómo instalar
- [Guía de integración para AI Agent](./quick-start.mdx) — Conecte una app NocoBase existente y deje que su AI Agent empiece a trabajar
- [Referencia del comando `nb init`](../api/cli/init.md) — Inicializar una app nueva, hacerse cargo de una app local existente o conectar una app remota
- [Referencia del comando `nb env info`](../api/cli/env/info.md) — Ver los detalles de conexión y la configuración de ejecución del env actual
- [NocoBase CLI](../api/cli/index.md) — Referencia completa de todos los comandos `nb`
- [Gestión de entornos múltiples](../nocobase-cli/operations/multi-environment.md) — Operaciones habituales cuando mantiene varios env al mismo tiempo
