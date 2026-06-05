---
title: 'nb env'
description: 'Referencia del comando nb env: gestiona los env de NocoBase CLI, incluyendo agregar, ver el current env, comprobar el estado, cambiar, actualizar, generar configuraciones de proxy, autenticar y eliminar.'
keywords: 'nb env,NocoBase CLI,gestión de entornos,env,current env,proxy,autenticación,OpenAPI'
---

# nb env

Gestiona los env guardados de NocoBase CLI. Un env guarda información de conexión y de ejecución local, como la dirección de la API, la información de autenticación, la ruta de la aplicación local y la configuración de la base de datos.

A partir de esta versión, la CLI separa dos conceptos:

- `current env`: el env que está usando actualmente el shell o agent runtime actual, aislado por `NB_SESSION_ID` siempre que sea posible
- `last env`: el último env usado globalmente, utilizado como valor de respaldo cuando no está habilitado el modo de sesión

## Uso

```bash
nb env <command>
```

## Subcomandos

| Comando                          | Descripción                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`nb env add`](./add.md)         | Guarda un endpoint de API de NocoBase y cambia a este env                                                              |
| [`nb env current`](./current.md) | Ver el env actualmente efectivo                                                                                        |
| [`nb env update`](./update.md)   | Actualiza la configuración de un env guardado y maneja automáticamente la sincronización posterior según sea necesario |
| [`nb env list`](./list.md)       | Lista los env configurados                                                                                             |
| [`nb env status`](./status.md)   | Ver el estado del env actual, de un env especificado o de todos los env                                                |
| [`nb env info`](./info.md)       | Ver la información detallada de un solo env                                                                            |
| [`nb env proxy`](./proxy.md)   | Genera una configuración de proxy Nginx o Caddy para un env gestionado                                          |
| [`nb env remove`](./remove.md)   | Elimina la configuración del env después de detener el runtime gestionado                                              |
| [`nb env auth`](./auth.md)       | Ejecuta el inicio de sesión OAuth para un env guardado                                                                 |
| [`nb env use`](./use.md)         | Cambia el env actual                                                                                                   |

## Ejemplos

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env proxy app1
nb env update app1
nb env use app1
nb env auth app1
```

## session mode

Se recomienda habilitar session mode por defecto. Así, el `current env` en distintos terminales, distintos shells o distintos agent runtimes puede mantenerse aislado y no afectarse entre sí en paralelo.

Si session mode no está habilitado, `nb env use` actualizará el `last env` global, y otras sesiones sin aislamiento de sesión también se verán afectadas.

Consulta [`nb session setup`](../session/setup.md) para ver cómo habilitarlo.

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
