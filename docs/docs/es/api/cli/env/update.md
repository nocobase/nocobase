---
title: "nb env update"
description: "Referencia del comando nb env update: actualizar la configuración guardada de API, autenticación, código fuente, aplicación y base de datos."
keywords: "nb env update,NocoBase CLI,configuración de env,autenticación,base de datos,código fuente"
---

# nb env update

`nb env update` actualiza la configuración de un env guardado. Puedes usarlo para ajustar la dirección de la API, el método de autenticación, el origen del código fuente, la ruta local de la app, la ruta pública, el puerto, los parámetros de base de datos y más. Cuando la actualización termina, la CLI procesa automáticamente los pasos de seguimiento necesarios según los cambios.

Si no pasas ningún parámetro de configuración, la CLI igualmente realizará una resincronización basada en el estado actual del env.

## Uso

```bash
nb env update [name] [flags]
```

## Opciones comunes

| Opción | Tipo | Descripción |
| --- | --- | --- |
| `[name]` | string | Nombre del env configurado que se va a actualizar. Si se omite, se usa el env actual |
| `--verbose` | boolean | Mostrar progreso detallado |

## Opciones de API y autenticación

| Opción | Tipo | Descripción |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | URL de la API de NocoBase, incluido el prefijo `/api` |
| `--auth-type` | string | Método de autenticación: `basic`, `token` u `oauth` |
| `--access-token`, `--token`, `-t` | string | API key o access token usado con autenticación `token`. Guardarlo también cambia el tipo de autenticación a `token` |
| `--username` | string | Nombre de usuario guardado para autenticación `basic`. Úsalo solo cuando el env actual ya use `basic`, o junto con `--auth-type basic` |

## Opciones de origen y descarga

| Opción | Tipo | Descripción |
| --- | --- | --- |
| `--source` | string | Origen guardado de la app: `docker`, `git`, `local` o `npm` |
| `--download-version`, `--version` | string | Selector de versión guardado: etiqueta de Docker, versión de paquete npm o referencia Git |
| `--docker-registry` | string | Nombre del registro de imágenes Docker, sin la etiqueta |
| `--docker-platform` | string | Plataforma de imagen Docker: `auto`, `linux/amd64` o `linux/arm64` |
| `--git-url` | string | URL del repositorio Git |
| `--npm-registry` | string | Registro usado para descargas npm o Git e instalación de dependencias |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Si se deben instalar `devDependencies` para orígenes npm o Git |
| `--build` / `--no-build` | boolean | Si se debe compilar automáticamente después de una descarga npm o Git |
| `--build-dts` / `--no-build-dts` | boolean | Si se deben generar archivos de declaración TypeScript durante la compilación |

## Opciones de aplicación

| Opción | Tipo | Descripción |
| --- | --- | --- |
| `--app-path` | string | Directorio de la aplicación. Ahora es la forma preferida de gestionar la ruta local de la app |
| `--app-public-path` | string | Ruta pública de la aplicación (`APP_PUBLIC_PATH`), como `/` o `/nocobase/` |
| `--app-port` | string | Puerto HTTP de la aplicación |
| `--cdn-base-url` | string | URL base del CDN para recursos estáticos del cliente (`CDN_BASE_URL`) |
| `--app-key` | string | Clave de la aplicación (`APP_KEY`) |
| `--timezone` | string | Zona horaria de la aplicación (`TZ`) |

## Opciones de base de datos

| Opción | Tipo | Descripción |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | Si se debe usar la base de datos integrada gestionada por la CLI |
| `--db-dialect` | string | Tipo de base de datos: `postgres`, `mysql`, `mariadb` o `kingbase` |
| `--builtin-db-image` | string | Imagen de contenedor usada para la base de datos integrada |
| `--db-host` | string | Host de la base de datos |
| `--db-port` | string | Puerto de la base de datos |
| `--db-database` | string | Nombre de la base de datos |
| `--db-user` | string | Nombre de usuario de la base de datos |
| `--db-password` | string | Contraseña de la base de datos |
| `--db-schema` | string | Esquema de la base de datos. Normalmente solo se usa con PostgreSQL |
| `--db-table-prefix` | string | Prefijo de tabla |
| `--db-underscored` / `--no-db-underscored` | boolean | Si los nombres de tablas y campos usan estilo con guiones bajos |

## Limpieza de configuración

| Opción | Tipo | Descripción |
| --- | --- | --- |
| `--unset` | string[] | Limpiar uno o más campos guardados por nombre de flag. Puedes repetir la opción o pasar una lista separada por comas, como `--unset git-url,username` |

## Notas

:::tip

Si solo quieres que la CLI resincronice según el estado más reciente del env actual, basta con ejecutar `nb env update` o `nb env update <name>` sin opciones adicionales.

:::

- Cuando la actualización termina, la CLI gestiona automáticamente la sincronización de seguimiento necesaria según los cambios realizados esta vez
- Las demás opciones solo actualizan la configuración guardada del env. No reinician automáticamente la aplicación ni reemplazan el código fuente local o las imágenes Docker
- Después de modificar configuraciones como `app-path`, `app-port`, `timezone` o `db-*`, la CLI normalmente te pedirá que ejecutes `nb app restart --env <name>`; si el cambio afecta a la base de datos integrada gestionada por la CLI, te pedirá usar `nb app restart --env <name> --with-db`
- Después de modificar configuraciones como `app-port`, `app-public-path` o `cdn-base-url` que afecten al resultado del reverse proxy, vuelve a ejecutar `nb proxy nginx generate` o `nb proxy caddy generate` si ya usas una configuración de proxy generada
- Al actualizar configuraciones de origen como `source`, `download-version`, `docker-registry`, `git-url` o `npm-registry`, solo cambian los valores guardados. El código fuente local, las dependencias y las imágenes existentes no se reemplazan automáticamente
- `--access-token` no puede usarse junto con `--auth-type basic` o `--auth-type oauth`
- El mismo campo no puede usarse a la vez con `--unset` y con un valor explícito. Por ejemplo, no uses `--unset git-url` junto con `--git-url ...`
- Si cambias el método de autenticación a `basic` u `oauth`, o limpias el token, normalmente tendrás que ejecutar después `nb env auth <name>`

## Ejemplos

```bash
# Resincronizar el env actual según su último estado guardado
nb env update

# Resincronizar un env específico
nb env update prod

# Actualizar la URL de la API
nb env update prod --api-base-url http://localhost:13000/api

# Actualizar el token y cambiar el tipo de autenticación a token
nb env update prod --access-token <token>

# Cambiar a autenticación basic, guardar el nombre de usuario y ejecutar nb env auth más tarde
nb env update prod --auth-type basic --username admin

# Actualizar el origen y la versión guardados sin reemplazar todavía el código local
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Ajustar el puerto de la app y la zona horaria, y reiniciar más tarde
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Ajustar la ruta pública y regenerar el proxy después si hace falta
nb env update local --app-public-path /nocobase/

# Guardar la URL base del CDN para recursos del cliente
nb env update local --cdn-base-url https://cdn.example.com/nocobase/

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
