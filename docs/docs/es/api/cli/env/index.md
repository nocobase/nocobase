---
title: "nb env"
description: "Referencia del comando nb env: gestione los env de NocoBase CLI, incluyendo añadir, actualizar, consultar, cambiar, autenticar y eliminar."
keywords: "nb env,NocoBase CLI,gestión de entornos,env,autenticación,OpenAPI"
---

# nb env

Gestiona los env de NocoBase CLI guardados. Cada env almacena la dirección de la API, la información de autenticación, la ruta local de la aplicación, la configuración de la base de datos y la caché de comandos en tiempo de ejecución.

## Uso

```bash
nb env <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb env add`](./add.md) | Guarda un endpoint de API de NocoBase y lo establece como env actual |
| [`nb env update`](./update.md) | Actualiza el OpenAPI Schema y la caché de comandos en tiempo de ejecución desde la aplicación |
| [`nb env list`](./list.md) | Lista los env configurados y el estado de autenticación de la API |
| [`nb env info`](./info.md) | Muestra la información detallada de un env concreto |
| [`nb env remove`](./remove.md) | Elimina la configuración de un env |
| [`nb env auth`](./auth.md) | Realiza el inicio de sesión OAuth para un env guardado |
| [`nb env use`](./use.md) | Cambia el env actual |

## Ejemplos

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env list
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
