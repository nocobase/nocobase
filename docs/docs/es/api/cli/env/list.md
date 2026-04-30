---
title: "nb env list"
description: "Referencia del comando nb env list: lista los env de NocoBase CLI configurados y su estado de autenticación de la API."
keywords: "nb env list,NocoBase CLI,lista de entornos,estado de autenticación"
---

# nb env list

Lista todos los env configurados y comprueba el estado de autenticación de la API de la aplicación utilizando las credenciales Token/OAuth guardadas.

## Uso

```bash
nb env list
```

## Salida

La tabla de salida incluye el indicador del entorno actual, el nombre, el tipo, App Status, la URL, el método de autenticación y la versión de runtime.

`App Status` indica el estado obtenido al acceder a la API de la aplicación con la información de autenticación del env actual desde la CLI, por ejemplo `ok`, `auth failed`, `unreachable` o `unconfigured`. Para consultar el estado de ejecución de la base de datos, utilice [`nb db ps`](../db/ps.md).

## Ejemplos

```bash
nb env list
```

## Comandos relacionados

- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
- [`nb db ps`](../db/ps.md)
