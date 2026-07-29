---
title: "nb portal"
description: "Referencia de nb portal: gestionar workspaces de Portal, incluida configuración, creación, desarrollo, sincronización de código fuente, despliegue y eliminación."
keywords: "nb portal,NocoBase CLI,Portal,workspace,source storage,deploy"
---

# nb portal

`nb portal` gestiona workspaces de Portal. Un Portal puede tener su propio código fuente frontend, ruta de entrada y resultado de despliegue; este grupo conecta el registro de Portal en NocoBase con el workspace local y el source storage.

El flujo habitual es crear un workspace local, iniciar el modo de desarrollo, enviar cambios al source storage y luego compilar y desplegar. Si vas a trabajar con un Portal existente, primero ejecútalo con `pull` hacia local.

## Uso

```bash
nb portal <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb portal config`](./config.md) | Actualiza la configuración de código fuente del workspace local de Portal y la sincroniza con el registro remoto cuando sea posible |
| [`nb portal create`](./create.md) | Crea un workspace local de Portal desde una plantilla y crea o actualiza el registro de Portal |
| [`nb portal deploy`](./deploy.md) | Compila y despliega el workspace de Portal especificado |
| [`nb portal destroy`](./destroy.md) | Elimina el registro de Portal y el workspace local |
| [`nb portal dev`](./dev.md) | Inicia el modo de desarrollo para el workspace de Portal especificado |
| [`nb portal info`](./info.md) | Muestra detalles del registro de Portal especificado y del workspace local |
| [`nb portal list`](./list.md) | Lista registros de Portal y el estado de sincronización del workspace local |
| [`nb portal pull`](./pull.md) | Trae el código fuente de Portal desde el source storage al workspace local |
| [`nb portal push`](./push.md) | Envía los cambios locales del código fuente de Portal al source storage |
| [`nb portal registry`](./registry/index.md) | Administra integraciones de Registry publicadas por plugins NocoBase habilitados |

## Flujo típico

Crear un Portal llamado `customer`:

```bash
nb portal create customer -e dev --yes
```

Iniciar el modo de desarrollo local:

```bash
nb portal dev customer -e dev --yes
```

Inspeccionar el workspace local y el registro remoto:

```bash
nb portal info customer -e dev --yes
nb portal list -e dev --yes
```

Enviar el código fuente y desplegar:

```bash
nb portal push customer -e dev --yes --message "Update customer portal"
nb portal deploy customer -e dev --yes
```

Trabajar con un Portal existente:

```bash
nb portal list -e dev --yes
nb portal pull customer -e dev --yes
nb portal dev customer -e dev --yes
```

Cambiar el source storage:

```bash
nb portal config customer -e dev --yes --source-storage git --git-repo git@github.com:nocobase/customer-portal.git
nb portal push customer -e dev --yes --message "Move customer portal source to Git"
```

## source storage

Al crear un Portal, elige dónde se gestiona el código fuente:

| Modo | Descripción |
| --- | --- |
| `nocobase` | Default mode. Source code is managed by NocoBase source storage. |
| `git` | Source code is stored in a Git repository, configured with `--git-repo`, `--git-branch`, and `--git-path`. |

For quick creation and development, the default `nocobase` storage is usually enough. Use `git` when the Portal source should be reviewed, versioned, or built through an existing team workflow.

Source configuration is written to `portal.config.json` in the local workspace. `create`, `pull`, and `config` maintain this file; `push` and `deploy` read it to sync source or deployment output.

## Env Types

`nb portal` currently supports `local`, `docker`, and `http` envs:

| Modo | Descripción |
| --- | --- |
| `local` | The workspace and app storage are on the current machine. With default `nocobase` storage, `pull`/`push` usually do not need extra sync. |
| `docker` | The workspace is shared with the app through a Docker volume. With default `nocobase` storage, `pull`/`push` usually do not need extra sync. |
| `http` | Source and deployment output are synced through APIs. `pull` downloads a source archive, and `push` uploads one. |

`ssh` envs do not support Portal management in the current version.

## Local Workspace Path

Portals are stored under the selected env storage:

```text
<storagePath>/portals/<app>/<portal>
```

The main app access path is usually:

```text
<appPublicPath>/x/<portal>/
```

A sub-app access path is usually:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

## Env Confirmation

Most `nb portal` subcommands support `--env` and `--yes`:

| Parámetro | Descripción |
| --- | --- |
| `--env`, `-e` | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | Skip cross-env confirmation when an explicit `--env` targets a different env from the current env. |

In scripts or AI agent workflows, pass `--env` and `--yes` explicitly to avoid stopping at an interactive confirmation.

## Comandos relacionados

- [`nb env`](../env/index.md)
- [`nb app`](../app/index.md)
- [`nb source`](../source/index.md)
