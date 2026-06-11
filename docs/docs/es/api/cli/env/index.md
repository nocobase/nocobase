---
title: "nb env"
description: "Referencia del comando nb env: gestionar los envs guardados de NocoBase CLI, incluyendo añadir, ver el env actual, consultar el estado, cambiar, actualizar, autenticar y eliminar."
keywords: "nb env,NocoBase CLI,gestión de entornos,env,current env,autenticación,OpenAPI"
---

# nb env

Gestiona los envs guardados de NocoBase CLI. Un env guarda información de conexión y de ejecución local, como la dirección de la API, los datos de autenticación, la ruta de la aplicación local y la configuración de la base de datos.

Desde esta versión, la CLI separa dos conceptos:

- `current env`: el env que está usando actualmente el shell o runtime del agente activo, aislado mediante `NB_SESSION_ID` siempre que sea posible
- `last env`: el último env usado de forma global, que se utiliza como valor de respaldo cuando el modo session no está habilitado

## Uso

```bash
nb env <command>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb env add`](./add.md) | Guardar un endpoint de la API de NocoBase y cambiar a ese env |
| [`nb env current`](./current.md) | Ver el env que está actualmente en efecto |
| [`nb env update`](./update.md) | Actualizar la configuración de un env guardado y gestionar automáticamente la sincronización posterior cuando sea necesario |
| [`nb env list`](./list.md) | Listar los envs configurados |
| [`nb env status`](./status.md) | Ver el estado del env actual, de un env especificado o de todos los envs |
| [`nb env info`](./info.md) | Ver información detallada de un único env |
| [`nb env remove`](./remove.md) | Eliminar la configuración del env después de detener el runtime gestionado |
| [`nb env auth`](./auth.md) | Realizar un inicio de sesión OAuth para un env guardado |
| [`nb env use`](./use.md) | Cambiar el env actual |

## Ejemplos

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Modo session

Se recomienda habilitar el modo session por defecto. Esto permite que `current env` en distintos terminales, shells o runtimes de agentes permanezca aislado y no interfiera en paralelo.

Si el modo session no está habilitado, `nb env use` actualiza el `last env` global y también afecta a otras sesiones que no tengan aislamiento de sesión.

Consulta [`nb session setup`](../session/setup.md) para saber cómo habilitarlo.

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb proxy`](../proxy/index.md)
- [`nb session`](../session/index.md)
