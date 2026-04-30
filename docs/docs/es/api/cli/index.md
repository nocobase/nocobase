---
title: "NocoBase CLI"
description: "Referencia de NocoBase CLI (comando nb): inicialización, gestión de entornos, ejecución de aplicaciones, código fuente, base de datos, plugins, API, autoactualización del CLI y gestión de Skills."
keywords: "NocoBase CLI,nb,línea de comandos,referencia de comandos,gestión de entornos,gestión de plugins,API"
---

# NocoBase CLI

## Descripción

NocoBase CLI (`nb`) es el punto de entrada de línea de comandos de NocoBase, utilizado para inicializar, conectar y gestionar aplicaciones de NocoBase en el espacio de trabajo local.

Admite dos rutas comunes de inicialización:

- Conectar con una aplicación NocoBase existente y guardarla como un env del CLI
- Instalar una nueva aplicación NocoBase mediante Docker, npm o Git, y guardarla como un env del CLI

Al crear una nueva aplicación local, [`nb init`](./init.md) también puede instalar o actualizar las NocoBase AI coding skills. Si necesita omitir este paso, puede utilizar `--skip-skills`.

## Uso

```bash
nb [command]
```

El comando raíz se utiliza principalmente para mostrar la ayuda y para distribuir la invocación a los grupos de comandos o a los comandos independientes.

## Grupos de comandos (Topics)

`nb --help` muestra los siguientes grupos de comandos:

| Grupo de comandos | Descripción |
| --- | --- |
| [`nb api`](./api/index.md) | Invocar la API de NocoBase a través del CLI. |
| [`nb app`](./app/index.md) | Gestionar el estado de ejecución de la aplicación: iniciar, detener, reiniciar, registros y actualización. |
| [`nb db`](./db/index.md) | Gestionar la base de datos integrada del env seleccionado. |
| [`nb env`](./env/index.md) | Gestionar entornos, estado, detalles y comandos de tiempo de ejecución de proyectos NocoBase. |
| [`nb plugin`](./plugin/index.md) | Gestionar los plugins del env de NocoBase seleccionado. |
| [`nb scaffold`](./scaffold/index.md) | Generar andamiaje para el desarrollo de plugins de NocoBase. |
| [`nb self`](./self/index.md) | Comprobar o actualizar el propio NocoBase CLI. |
| [`nb skills`](./skills/index.md) | Comprobar o sincronizar las NocoBase AI coding skills del espacio de trabajo actual. |
| [`nb source`](./source/index.md) | Gestionar el proyecto de código fuente local: descarga, desarrollo, compilación y pruebas. |

## Comandos (Commands)

Comandos independientes expuestos directamente por el comando raíz actualmente:

| Comando | Descripción |
| --- | --- |
| [`nb init`](./init.md) | Inicializar NocoBase para que el coding agent pueda conectarse y trabajar. |

## Ver la ayuda

Ver la ayuda del comando raíz:

```bash
nb --help
```

Ver la ayuda de un comando o grupo de comandos:

```bash
nb init --help
nb app --help
nb api resource --help
```

## Ejemplos

Inicialización interactiva:

```bash
nb init
```

Inicialización mediante un formulario en el navegador:

```bash
nb init --ui
```

Crear una aplicación Docker de forma no interactiva:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Conectar con una aplicación existente:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
```

Iniciar la aplicación y refrescar los comandos de tiempo de ejecución:

```bash
nb app start -e app1
nb env update app1
```

Invocar la API:

```bash
nb api resource list --resource users -e app1
```

## Variables de entorno

Las siguientes variables de entorno afectan el comportamiento del CLI:

| Variable | Descripción |
| --- | --- |
| `NB_CLI_ROOT` | Directorio raíz donde el CLI guarda la configuración `.nocobase` y los archivos de aplicaciones locales. Por defecto, es el directorio home del usuario actual. |
| `NB_LOCALE` | Idioma de los mensajes del CLI y de la UI de inicialización local; admite `en-US` y `zh-CN`. |

Ejemplo:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## Archivo de configuración

Archivo de configuración por defecto:

```text
~/.nocobase/config.json
```

Tras establecer `NB_CLI_ROOT=/your/workspace`, la ruta del archivo de configuración será:

```text
/your/workspace/.nocobase/config.json
```

El CLI también es compatible con la lectura de la configuración antigua de proyecto del directorio de trabajo actual.

La caché de comandos de tiempo de ejecución se guarda en:

```text
.nocobase/versions/<hash>/commands.json
```

Este archivo es generado o refrescado por [`nb env update`](./env/update.md) y se utiliza para almacenar en caché los comandos de tiempo de ejecución sincronizados desde la aplicación de destino.

## Enlaces relacionados

- [Inicio rápido](../../ai/quick-start.mdx)
- [Instalación, actualización y migración](../../ai/install-upgrade-migration.mdx)
- [Variables de entorno globales](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Desarrollo de plugins](../../plugin-development/index.md)
