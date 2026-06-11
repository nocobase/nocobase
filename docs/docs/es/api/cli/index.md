---
title: 'NocoBase CLI'
description: 'Referencia de NocoBase CLI (comando `nb`): inicialización, copia de seguridad y restauración, configuración, gestión de entornos, tiempo de ejecución de la aplicación, código fuente, base de datos, plugins, licencia comercial, API, autoactualización de la CLI y gestión de Skills.'
keywords: 'NocoBase CLI,nb,línea de comandos,referencia de comandos,copia de seguridad,restauración,gestión de entornos,gestión de plugins,licencia comercial,API'
---

# NocoBase CLI

## Descripción

NocoBase CLI (`nb`) es el punto de entrada de línea de comandos de NocoBase, utilizado para inicializar, conectar y gestionar aplicaciones de NocoBase en un espacio de trabajo local.

Admite dos rutas de inicialización comunes:

- Conectarse a una aplicación de NocoBase existente y guardarla como un env de CLI
- Instalar una nueva aplicación de NocoBase mediante Docker, npm o Git, y luego guardarla como un env de CLI

Al crear una nueva aplicación local, [`nb init`](./init.md) también puede instalar o actualizar NocoBase AI coding skills. Si necesitas omitir este paso, puedes usar `--skip-skills`.

## Uso

```bash
nb [command]
```

El comando raíz se utiliza principalmente para mostrar ayuda y distribuir las invocaciones a grupos de comandos o comandos independientes.

## Grupos de comandos (Topics)

`nb --help` muestra los siguientes grupos de comandos:

| Grupo de comandos                    | Descripción                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [`nb api`](./api/index.md)           | Llama a las API de NocoBase mediante la CLI.                                                                                 |
| [`nb app`](./app/index.md)           | Gestiona el estado de ejecución de la aplicación: iniciar, detener, reiniciar, registros y actualización.                    |
| [`nb backup`](./backup/index.md)     | Crea copias de seguridad y las descarga localmente, o restaura un archivo de copia de seguridad local al env de destino.     |
| [`nb config`](./config/index.md)     | Gestiona la configuración predeterminada de la CLI.                                                                          |
| [`nb db`](./db/index.md)             | Gestiona la base de datos integrada del env seleccionado.                                                                    |
| [`nb env`](./env/index.md)           | Gestiona los entornos de proyecto de NocoBase, el env actual, el estado, los detalles y los comandos de tiempo de ejecución. |
| [`nb license`](./license/index.md)   | Gestiona las licencias comerciales y los plugins con licencia.                                                               |
| [`nb plugin`](./plugin/index.md)     | Gestiona los plugins del env de NocoBase seleccionado.                                                                       |
| [`nb scaffold`](./scaffold/index.md) | Genera scaffolding para el desarrollo de plugins de NocoBase.                                                                |
| [`nb self`](./self/index.md)         | Comprueba o actualiza la propia NocoBase CLI.                                                                                |
| [`nb session`](./session/index.md)   | Configura `NB_SESSION_ID` para que el env actual quede aislado por shell o por agent runtime.                                |
| [`nb skills`](./skills/index.md)     | Comprueba o sincroniza las NocoBase AI coding skills del espacio de trabajo actual.                                          |
| [`nb source`](./source/index.md)     | Gestiona proyectos de código fuente locales: descarga, desarrollo, compilación y pruebas.                                    |

## Comandos

Comandos independientes actualmente expuestos directamente por el comando raíz:

| Comando                | Descripción                                                               |
| ---------------------- | ------------------------------------------------------------------------- |
| [`nb init`](./init.md) | Inicializa NocoBase para que el coding agent pueda conectarse y trabajar. |

## Ver ayuda

Ver la ayuda del comando raíz:

```bash
nb --help
```

Ver la ayuda de un comando o grupo de comandos:

```bash
nb init --help
nb app --help
nb backup --help
nb config --help
nb api resource --help
nb license --help
```

## Ejemplos

Inicialización interactiva:

```bash
nb init
```

Inicializar usando un formulario del navegador:

```bash
nb init --ui
```

Crear una aplicación Docker de forma no interactiva:

```bash
nb init --env app1 --yes --source docker --version alpha
```

Conectarse a una aplicación existente:

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env status
```

Volver a sincronizar el estado del env después de iniciar la aplicación:

```bash
nb app start -e app1
nb env update app1
```

Llamar a una API:

```bash
nb api resource list --resource users -e app1
```

Ver la configuración predeterminada de la CLI:

```bash
nb config list
nb config get docker.network
```

Ver el estado de la licencia comercial:

```bash
nb license status -e app1
nb license plugins list -e app1
```

Crear y descargar una copia de seguridad:

```bash
nb backup create -e app1 --output ./backups
```

Restaurar una copia de seguridad local:

```bash
nb backup restore -e app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Variables de entorno

Las siguientes variables de entorno afectan el comportamiento de la CLI:

| Variable        | Descripción                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NB_CLI_ROOT`   | Directorio raíz donde la CLI guarda la configuración `.nocobase` y los archivos de la aplicación local. El valor predeterminado es el directorio personal del usuario actual. |
| `NB_LOCALE`     | Idioma de los mensajes de la CLI e idioma de la interfaz de inicialización local. Admite `en-US` y `zh-CN`.                                                                   |
| `NB_SESSION_ID` | ID de sesión del shell actual o del agent runtime. Cuando está configurado, `nb env use` y `nb env current` quedan aislados por sesión.                                       |

Ejemplo:

```bash
export NB_CLI_ROOT=/your/workspace
export NB_LOCALE=zh-CN
```

## Archivo de configuración

Archivo de configuración predeterminado:

```text
~/.nocobase/config.json
```

Después de establecer `NB_CLI_ROOT=/your/workspace`, la ruta del archivo de configuración pasa a ser:

```text
/your/workspace/.nocobase/config.json
```

La CLI también es compatible con la lectura de la configuración heredada del project en el directorio de trabajo actual.

La caché a nivel de sesión del env actual se almacena en:

```text
.nocobase/sessions/<NB_SESSION_ID>.json
```

El último env usado globalmente se guarda en el campo `lastEnv` de `config.json`. Cuando no hay `NB_SESSION_ID`, la CLI recurre a este valor global.

La caché de comandos de tiempo de ejecución se almacena en:

```text
.nocobase/versions/<hash>/commands.json
```

Este archivo es generado o actualizado por [`nb env update`](./env/update.md) y se utiliza para almacenar en caché los comandos de tiempo de ejecución sincronizados desde la aplicación de destino.

## Enlaces relacionados

- [Inicio rápido](../../ai/quick-start.mdx)
- [Variables de entorno globales](../app/env.md)
- [AI Builder](../../ai-builder/index.md)
- [Desarrollo de plugins](../../plugin-development/index.md)
