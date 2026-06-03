---
title: 'nb env update'
description: 'Referencia del comando nb env update: actualiza la configuración guardada de API, autenticación, código fuente, aplicación y base de datos.'
keywords: 'nb env update,NocoBase CLI,configuración de env,autenticación,base de datos,código fuente'
---

# nb env update

`nb env update` se usa para actualizar la configuración de un env guardado. Puedes usarlo para ajustar la dirección de la API, el método de autenticación, el origen del código fuente, la ruta de la aplicación local, el puerto, los parámetros de la base de datos y más. Una vez completada la actualización, la CLI gestionará automáticamente los pasos de seguimiento según los cambios.

Si no proporcionas parámetros de configuración, la CLI también realizará una resincronización según el estado actual del env.

## Uso

```bash
nb env update [name] [flags]
```

## Opciones generales

| Opción      | Tipo    | Descripción                                                                               |
| ----------- | ------- | ----------------------------------------------------------------------------------------- |
| `[name]`    | string  | Nombre del entorno configurado que se va a actualizar; si se omite, se usa el env actual. |
| `--verbose` | boolean | Muestra el progreso detallado.                                                            |

## Opciones de API y autenticación

| Opción                            | Tipo   | Descripción                                                                                                                                                               |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u`            | string | Dirección de la API de NocoBase, incluida el prefijo `/api`.                                                                                                              |
| `--auth-type`                     | string | Método de autenticación: `basic`, `token`, `oauth`.                                                                                                                       |
| `--access-token`, `--token`, `-t` | string | API key o access token usado para la autenticación `token`. Después de guardarlo, el método de autenticación cambiará a `token`.                                          |
| `--username`                      | string | Nombre de usuario guardado para la autenticación `basic`. Solo puede usarse cuando el env actual usa autenticación `basic`, o cuando también se pasa `--auth-type basic`. |

## Opciones de código fuente y descarga

| Opción                                         | Tipo    | Descripción                                                                                     |
| ---------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `--source`                                     | string  | Origen guardado de la aplicación: `docker`, `git`, `local`, `npm`.                              |
| `--download-version`, `--version`              | string  | Parámetro de versión guardado: etiqueta de Docker, versión del paquete npm o referencia de Git. |
| `--docker-registry`                            | string  | Nombre del registro de imágenes de Docker, sin la etiqueta.                                     |
| `--docker-platform`                            | string  | Plataforma de la imagen de Docker: `auto`, `linux/amd64`, `linux/arm64`.                        |
| `--git-url`                                    | string  | URL del repositorio Git.                                                                        |
| `--npm-registry`                               | string  | Registry usado para descargas de npm/Git e instalación de dependencias.                         |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Si se deben instalar devDependencies al instalar desde npm/Git.                                 |
| `--build` / `--no-build`                       | boolean | Si se debe compilar automáticamente después de descargar desde npm/Git.                         |
| `--build-dts` / `--no-build-dts`               | boolean | Si se deben generar archivos de declaración de TypeScript durante la compilación.               |

## Opciones de la aplicación

| Opción       | Tipo   | Descripción                                                                                                   |
| ------------ | ------ | ------------------------------------------------------------------------------------------------------------- |
| `--app-path` | string | Directorio de la aplicación. Ahora se recomienda usar primero esta opción para gestionar directorios locales. |
| `--app-port` | string | Puerto HTTP de la aplicación.                                                                                 |
| `--app-key`  | string | Clave de la aplicación (`APP_KEY`).                                                                           |
| `--timezone` | string | Zona horaria de la aplicación (`TZ`).                                                                         |

## Opciones de la base de datos

| Opción                                     | Tipo    | Descripción                                                        |
| ------------------------------------------ | ------- | ------------------------------------------------------------------ |
| `--builtin-db` / `--no-builtin-db`         | boolean | Si se debe usar la base de datos integrada gestionada por la CLI.  |
| `--db-dialect`                             | string  | Tipo de base de datos: `postgres`, `mysql`, `mariadb`, `kingbase`. |
| `--builtin-db-image`                       | string  | Imagen del contenedor de la base de datos integrada.               |
| `--db-host`                                | string  | Dirección del host de la base de datos.                            |
| `--db-port`                                | string  | Puerto de la base de datos.                                        |
| `--db-database`                            | string  | Nombre de la base de datos.                                        |
| `--db-user`                                | string  | Nombre de usuario de la base de datos.                             |
| `--db-password`                            | string  | Contraseña de la base de datos.                                    |
| `--db-schema`                              | string  | Schema de la base de datos. Normalmente solo lo usa PostgreSQL.    |
| `--db-table-prefix`                        | string  | Prefijo de las tablas.                                             |
| `--db-underscored` / `--no-db-underscored` | boolean | Si los nombres de tablas y campos usan estilo con guiones bajos.   |

## Opciones de limpieza de configuración

| Opción    | Tipo     | Descripción                                                                                                                                                                  |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--unset` | string[] | Limpia uno o varios campos guardados por el nombre canónico del flag. Se puede repetir y también admite valores separados por comas, por ejemplo `--unset git-url,username`. |

## Notas

:::tip

Si solo quieres que la CLI vuelva a sincronizarse según el estado más reciente del env actual, basta con ejecutar `nb env update` o `nb env update <name>`. No se necesitan parámetros adicionales.

:::

- Una vez completada la actualización, la CLI gestionará automáticamente cualquier sincronización de seguimiento necesaria según los cambios realizados esta vez
- Las demás opciones solo actualizan la configuración guardada del env; no reinician automáticamente la aplicación ni reemplazan automáticamente el código fuente local o las imágenes de Docker
- Después de modificar configuraciones como `app-path`, `app-port`, `timezone` o `db-*`, la CLI normalmente te indicará que ejecutes después `nb app restart --env <name>`; si el cambio afecta a la base de datos integrada gestionada por la CLI, te indicará usar `nb app restart --env <name> --with-db`
- Al actualizar configuraciones de código fuente como `source`, `download-version`, `docker-registry`, `git-url` o `npm-registry`, solo se cambian los valores guardados. El código fuente local existente, las dependencias y las imágenes no se reemplazan automáticamente
- `--access-token` no puede usarse junto con `--auth-type basic` o `--auth-type oauth`
- El mismo campo no puede usarse a la vez con `--unset` y con una asignación explícita. Por ejemplo, no puedes escribir al mismo tiempo `--unset git-url` y `--git-url ...`
- Si cambias el método de autenticación a `basic` u `oauth`, o vacías el token, normalmente tendrás que ejecutar después `nb env auth <name>`

## Ejemplos

```bash
# Resincronizar el env actual según el estado más reciente
nb env update

# Resincronizar el env especificado según el estado más reciente
nb env update prod

# Actualizar la dirección de la API
nb env update prod --api-base-url http://localhost:13000/api

# Actualizar el token y cambiar el método de autenticación a token
nb env update prod --access-token <token>

# Cambiar a autenticación basic, guardar solo el nombre de usuario y ejecutar nb env auth más tarde
nb env update prod --auth-type basic --username admin

# Ajustar el origen y la versión del código fuente, actualizando solo la configuración guardada
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Ajustar el puerto y la zona horaria de la aplicación, y reiniciar la aplicación más tarde
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Limpiar campos guardados
nb env update local --unset git-url --unset username
nb env update local --unset git-url,username
```

## Comandos relacionados

- [`nb api`](../api/index.md)
- [`nb env auth`](./auth.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
- [`nb app restart`](../app/restart.md)
- [`nb source download`](../source/download.md)
