---
title: "nb env"
description: "Referencia del comando nb env: gestione los env de NocoBase CLI, incluyendo añadir, consultar el env actual, revisar estado, cambiar, autenticar y eliminar."
keywords: "nb env,NocoBase CLI,gestión de entornos,env,env actual,autenticación,OpenAPI"
---

# nb env

Gestiona los env de NocoBase CLI guardados. Cada env almacena la dirección de la API, la información de autenticación, las rutas locales de la aplicación, la configuración de la base de datos y la caché de comandos en tiempo de ejecución.

En el modelo actual, la CLI separa dos conceptos:

- `current env`: el env usado por la shell o el runtime de agente activo, aislado por `NB_SESSION_ID` cuando está disponible
- `last env`: el último env usado globalmente, utilizado como respaldo cuando el session mode no está habilitado

## Uso


nb env <command>

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb env add`](./add.md) | Guarda un endpoint de API de NocoBase y cambia a ese env |
| [`nb env current`](./current.md) | Muestra el env actualmente efectivo |
| [`nb env update`](./update.md) | Actualiza el OpenAPI Schema y la caché de comandos en tiempo de ejecución desde la aplicación |
| [`nb env list`](./list.md) | Lista los env configurados |
| [`nb env status`](./status.md) | Muestra el estado del env actual, de un env o de todos los env |
| [`nb env info`](./info.md) | Muestra la información detallada de un env concreto |
| [`nb env remove`](./remove.md) | Detiene el runtime gestionado si existe y luego elimina la configuración del env |
| [`nb env auth`](./auth.md) | Realiza el inicio de sesión OAuth para un env guardado |
| [`nb env use`](./use.md) | Cambia el env actual |

## Ejemplos


nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1

## Session mode

Session mode es la recomendación por defecto. Mantiene `current env` aislado entre distintos terminales, shells y runtimes de agente, para que el trabajo en paralelo no se afecte entre sí.

Cuando session mode no está habilitado, `nb env use` actualiza el `last env` global, y otras sesiones sin aislamiento también pueden verse afectadas.

Actívalo con [`nb session setup`](../session/setup.md).

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
