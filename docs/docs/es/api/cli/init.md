---
title: 'nb init'
description: 'Referencia del comando nb init: instalar una app nueva, asumir una app local existente o conectarse a una app remota y guardarla como un CLI env.'
keywords: 'nb init,NocoBase CLI,inicializar,env,Docker,npm,Git,conexión remota'
---

# nb init

Inicializa el espacio de trabajo actual para que el coding agent pueda conectarse y usar NocoBase.

`nb init` puede instalar una nueva app local de NocoBase o guardar la información de conexión de una app existente.

Además, `nb init` también sincroniza por defecto las NocoBase AI coding skills. Solo necesitas añadir `--skip-skills` cuando ya administras las skills por tu cuenta, o cuando ejecutas en CI o en un entorno sin conexión.

## Uso

```bash
nb init [flags]
```

## Modos interactivos

`nb init` admite tres modos interactivos:

- `nb init`: completar la guía paso a paso en la terminal
- `nb init --ui`: abrir un formulario en el navegador local y completar el setup con un asistente visual
- `nb init --yes --env app1`: omitir los prompts y usar directamente las flags; los parámetros no pasados explícitamente usarán los valores predeterminados

El modo `--yes` es adecuado para scripts, CI/CD u otros escenarios no interactivos. En este modo, `--env <envName>` es obligatorio. En general, instala por defecto una nueva app local; si no especificas `--source`, usará `docker` como origen de instalación predeterminado.

## Reanudar una inicialización interrumpida

Los flujos de instalación primero guardan la configuración del env y luego ejecutan la descarga, la base de datos y la instalación de la app. Si falla a mitad del proceso, puedes continuar con:

```bash
nb init --env app1 --resume
```

`--resume` solo se aplica a flujos de inicialización en los que ya se haya guardado la configuración del env, y se debe pasar `--env` explícitamente.

## Preparar primero el env e instalar la app más tarde

`--prepare-only` está pensado para flujos en los que primero se prepara el env, luego se activa la licencia y solo después se instala y arranca la app.

Si quieres guardar primero la configuración del env, preparar los archivos fuente o la imagen y dejar lista la base de datos, pero posponer la instalación real de la app y el primer arranque, puedes usar:

```bash
nb init --env app1 --prepare-only
nb init --env app1 --prepare-only --ui
nb init --env app1 --prepare-only --yes
```

Este modo está disponible para flujos de instalación local, incluido el asistente `--ui`. No está disponible para flujos de conexión remota. La CLI guardará el env actual en estado prepared, de modo que luego podrás continuar con un flujo como este:

```bash
nb license activate --env app1
nb app start --env app1
```

Después, `nb app start` completará la primera instalación y cambiará el env del estado prepared al estado normal installed.

## Explicación del directorio de instalación

Puedes ver la ruta completa con `nb env info app1 --field app.appPath`.

De forma predeterminada, la CLI organiza los archivos locales bajo `app-path` según esta convención:

```text
<app-path>/
├── source/   # Directorio predeterminado para el código fuente de la app o el contenido descargado
├── storage/  # Directorio de datos en tiempo de ejecución
└── .env      # Archivo opcional de variables de entorno de la app
```

Por lo general:

- `source/` corresponde principalmente al directorio local de la app para envs npm / Git. Para envs Docker, la CLI también conserva esta derivación de ruta predeterminada, pero la mayoría de las veces no necesitas preocuparte por ello manualmente. Presta especial atención durante las actualizaciones: el directorio `source/` se eliminará y se descargará de nuevo, así que no pongas aquí archivos que necesites conservar
- `storage/` se usa para guardar datos de ejecución, como datos de la base de datos integrada, plugins, logs y otros contenidos
- `.env` es un archivo opcional de variables de entorno de la app. Solo necesitas añadirlo en `<app-path>/.env` cuando quieras personalizar variables de entorno; si este archivo existe, los orígenes de instalación Docker, npm y Git lo leerán por defecto

Esto representa la convención predeterminada de directorios de la CLI. Según el origen de instalación, los plugins y la etapa de ejecución, el contenido real generado en los directorios puede no ser exactamente igual.

## Notas

:::warning Notas

- `--ui` no puede usarse junto con `--yes`
- `--ui` tampoco puede usarse junto con `--resume`
- `--ui-host` y `--ui-port` solo pueden usarse junto con `--ui`
- `--skip-auth` no puede usarse junto con `--access-token` o `--token`

:::

## Ubicación rápida por Steps

Los Steps que ves no son exactamente iguales en todas las rutas de setup. Por ejemplo, al conectarte a una app existente, normalmente solo usarás `Getting started` y `Remote connection`.

Si sigues el asistente de la UI local paso a paso, primero puedes usar la siguiente tabla para ubicar rápidamente la parte relevante:

| Step                      | Parámetros principales                                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Getting started`         | `--env`、`--yes`、`--ui`、`--locale`、`--verbose`、`--skip-skills`、`--resume`、`--prepare-only`                                                                                                                 |
| `App environment`         | `--lang`、`--app-path`、`--app-port`、`--force`                                                                                                                                                                   |
| `App source and version`  | `--source`、`--version`、`--skip-download`、`--git-url`、`--docker-registry`、`--docker-platform`、`--npm-registry`、`--replace`、`--dev-dependencies`、`--output-dir`、`--docker-save`、`--build`、`--build-dts` |
| `Configure the database`  | `--builtin-db`、`--db-dialect`、`--builtin-db-image`、`--db-host`、`--db-port`、`--db-database`、`--db-user`、`--db-password`、`--db-schema`、`--db-table-prefix`、`--db-underscored`                             |
| `Create an admin account` | `--root-username`、`--root-email`、`--root-password`、`--root-nickname`                                                                                                                                           |
| `Remote connection`       | `--api-base-url`、`--auth-type`、`--access-token`、`--username`、`--password`、`--skip-auth`                                                                                                                      |

## Parámetros

Hay bastantes parámetros, así que verlos por escenario de uso resulta más claro.

El “Predeterminado” de abajo indica el valor o comportamiento que `nb init` suele usar cuando omites ese parámetro.

### Básicos e interacción

| Parámetro       | Tipo    | Predeterminado                                                                                               | Descripción                                                                                          |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `--yes`, `-y`   | boolean | `false`                                                                                                      | Omitir prompts y usar las flags y los valores predeterminados                                        |
| `--env`, `-e`   | string  | Ninguno                                                                                                      | Nombre del env que se guardará en esta inicialización; obligatorio en los modos `--yes` y `--resume` |
| `--ui`          | boolean | `false`                                                                                                      | Abrir el asistente en el navegador local; no puede usarse con `--yes` ni `--resume`                  |
| `--verbose`     | boolean | `false`                                                                                                      | Mostrar salida detallada de los comandos                                                             |
| `--skip-skills` | boolean | `false`                                                                                                      | Omitir la sincronización de las NocoBase AI coding skills                                            |
| `--ui-host`     | string  | `127.0.0.1`                                                                                                  | Host accesible desde el navegador que se muestra en la URL del asistente `--ui`; el servicio local siempre escucha en `0.0.0.0` |
| `--ui-port`     | integer | `0`                                                                                                          | Puerto del servicio local de `--ui`; `0` significa asignación automática                             |
| `--locale`      | string  | Sigue `NB_LOCALE`, la configuración de la CLI o la locale del sistema; el valor final de fallback es `en-US` | Idioma de los prompts de la CLI y de la UI local de setup: `en-US` o `zh-CN`                         |
| `--resume`      | boolean | `false`                                                                                                      | Continuar la última inicialización incompleta y reutilizar la workspace env config ya guardada       |
| `--prepare-only` | boolean | `false`                                                                                                     | Guardar y preparar un env de instalación local, incluidos los flujos `--ui`, sin instalar ni iniciar todavía la app |

### Conectarse a una app existente

| Parámetro              | Tipo    | Predeterminado | Descripción                                                                                                                                                             |
| ---------------------- | ------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u` | string  | Ninguno        | URL base de la API; debe incluir el prefijo `/api`                                                                                                                      |
| `--auth-type`, `-a`    | string  | `oauth`        | Método de autenticación: `basic`, `token` u `oauth`. Normalmente basta con el valor predeterminado `oauth`; en algunos escenarios de CI/CD también puede usarse `basic` |
| `--access-token`, `-t` | string  | Ninguno        | API key o access token usado para autenticación `token`                                                                                                                 |
| `--username`           | string  | Ninguno        | Nombre de usuario usado para autenticación `basic`                                                                                                                      |
| `--password`           | string  | Ninguno        | Contraseña usada para autenticación `basic`                                                                                                                             |
| `--skip-auth`          | boolean | `false`        | Guardar primero el env y el método de autenticación, y completar el inicio de sesión más tarde con `nb env auth`                                                        |

### Parámetros básicos para la instalación local

| Parámetro         | Tipo    | Predeterminado                      | Descripción                                                                                            |
| ----------------- | ------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `--lang`, `-l`    | string  | `en-US`                             | Idioma de la interfaz de la app recién instalada                                                       |
| `--force`, `-f`   | boolean | `false`                             | Reconfigurar un env existente y reemplazar los recursos de ejecución en conflicto cuando sea necesario |
| `--app-path`      | string  | `./<envName>/`                      | Directorio local de la app npm/Git                                                                     |
| `--app-port`      | string  | `13000`                             | Puerto HTTP de la app local; en modo `--yes` se seleccionará automáticamente un puerto disponible      |
| `--root-username` | string  | `nocobase` (modo `--yes`)           | Nombre de usuario del administrador inicial                                                            |
| `--root-email`    | string  | `admin@nocobase.com` (modo `--yes`) | Correo electrónico del administrador inicial                                                           |
| `--root-password` | string  | `admin123` (modo `--yes`)           | Contraseña del administrador inicial                                                                   |
| `--root-nickname` | string  | `Super Admin` (modo `--yes`)        | Nombre para mostrar del administrador inicial                                                          |

### Parámetros de base de datos

| Parámetro                                  | Tipo    | Predeterminado                                                                  | Descripción                                                                         |
| ------------------------------------------ | ------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | `true`                                                                          | Si se crea y conecta una base de datos integrada administrada por la CLI            |
| `--db-dialect`                             | string  | `postgres`                                                                      | Tipo de base de datos: `postgres`, `mysql`, `mariadb`, `kingbase`                   |
| `--builtin-db-image`                       | string  | Sigue `--db-dialect` y la locale                                                | Imagen del contenedor de la base de datos integrada                                 |
| `--db-host`                                | string  | `postgres` para base de datos integrada; `127.0.0.1` para base de datos externa | Dirección del host de la base de datos                                              |
| `--db-port`                                | string  | `postgres=5432`、`mysql=3306`、`mariadb=3306`、`kingbase=54321`                 | Puerto de la base de datos                                                          |
| `--db-database`                            | string  | `nocobase`; `kingbase` en KingbaseES                                            | Nombre de la base de datos                                                          |
| `--db-user`                                | string  | `nocobase`                                                                      | Nombre de usuario de la base de datos                                               |
| `--db-password`                            | string  | `nocobase`                                                                      | Contraseña de la base de datos                                                      |
| `--db-schema`                              | string  | Ninguno                                                                         | Schema de la base de datos; solo se usa en PostgreSQL                               |
| `--db-table-prefix`                        | string  | Ninguno                                                                         | Prefijo de las tablas de la base de datos                                           |
| `--db-underscored` / `--no-db-underscored` | boolean | `false`                                                                         | Si los nombres de tablas y campos de la base de datos usan estilo con guiones bajos |

### Parámetros de descarga y código fuente

| Parámetro                                            | Tipo    | Predeterminado                                                                                | Descripción                                                                                                       |
| ---------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `--skip-download`                                    | boolean | `false`                                                                                       | Omitir la descarga y reutilizar un directorio local de app o una imagen Docker existente                          |
| `--source`, `-s`                                     | string  | `docker`                                                                                      | Forma de obtener NocoBase: `docker`, `npm` o `git`                                                                |
| `--version`, `-v`                                    | string  | `beta`                                                                                        | Parámetro de versión: versión del paquete npm, tag de la imagen Docker o Git ref                                  |
| `--replace`, `-r`                                    | boolean | `false`                                                                                       | Reemplazar cuando el directorio de destino ya exista                                                              |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | `false`                                                                                       | Si se instalan devDependencies en instalaciones npm/Git                                                           |
| `--output-dir`, `-o`                                 | string  | En npm/Git se deriva de `--app-path`; en Docker + `--docker-save` es `./nocobase-<version>`   | Directorio de destino de la descarga, o directorio para guardar el tarball cuando `--docker-save` está habilitado |
| `--git-url`                                          | string  | `https://github.com/nocobase/nocobase.git`                                                    | URL del repositorio Git                                                                                           |
| `--docker-registry`                                  | string  | `nocobase/nocobase`; en locale `zh-CN`, `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase` | Nombre del repositorio de imágenes Docker, sin tag                                                                |
| `--docker-platform`                                  | string  | `auto`                                                                                        | Plataforma de la imagen Docker: `auto`, `linux/amd64`, `linux/arm64`                                              |
| `--docker-save` / `--no-docker-save`                 | boolean | `false`                                                                                       | Si se guarda adicionalmente la imagen Docker como tarball después de hacer pull                                   |
| `--npm-registry`                                     | string  | Vacío                                                                                         | Registry usado para la descarga npm/Git y la instalación de dependencias                                          |
| `--build` / `--no-build`                             | boolean | `true`                                                                                        | Si se compila después de instalar las dependencias npm/Git                                                        |
| `--build-dts`                                        | boolean | `false`                                                                                       | Si se generan archivos de declaración de TypeScript durante la compilación npm/Git                                |

## Ejemplos

Los usos más comunes son los siguientes.

### Completar la guía paso a paso en la terminal

```bash
nb init
```

### Abrir el asistente en el navegador local

```bash
nb init --ui
nb init --ui --ui-port 3000
```

### Preparar primero y luego activar la licencia e iniciar más tarde

```bash
nb init --env app1 --prepare-only
nb license activate --env app1
nb app start --env app1
```

### Instalar una nueva app local en modo no interactivo

Si no especificas `--source`, normalmente se usará Docker como origen de instalación.

```bash
nb init --env app1 --yes
nb init --env app1 --yes --source docker --version latest
nb init --env app1 --yes --source docker --version beta
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
nb init --env app1 --yes --source npm --version latest
nb init --env app1 --yes --source npm --version beta
nb init --env app1 --yes --source npm --version alpha
nb init --env app1 --yes --source npm --version beta --app-port 13080
nb init --env app1 --yes --source git --version latest
nb init --env app1 --yes --source git --version beta
nb init --env app1 --yes --source git --version alpha
nb init --env app1 --yes --source git --version feat/plugin-workflow-timeout
nb init --env app1 --yes --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

### Instalación rápida y uso de autenticación basic

Si quieres instalar rápidamente una app local en modo no interactivo y guardar directamente la autenticación `basic` al terminar la instalación, también puedes escribirlo así. De esta forma, no necesitas abrir el navegador para completar OAuth.

Si mantienes la cuenta de administrador predeterminada del modo `--yes`, la forma más corta es esta.

Si se omite, la cuenta de administrador predeterminada es `nocobase` y la contraseña predeterminada es `admin123`:

```bash
nb init --env app1 --yes --auth-type basic
```

Si además quieres personalizar la cuenta de administrador, también puedes escribirlo así:

```bash
nb init --env app1 --yes \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

### Conectarse a una app existente

Usar OAuth por defecto suele ser suficiente. Si en algunos escenarios de CI/CD no te resulta conveniente abrir el navegador, también puedes guardar directamente la autenticación `basic`; si ya tienes un API token, también puedes guardar directamente la autenticación `token`.

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type token \
  --access-token <token>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type oauth \
  --skip-auth
```

### Personalizar el nombre de la base de datos

Si necesitas especificar el schema de PostgreSQL, el prefijo de las tablas o nombres con guiones bajos, puedes pasar los parámetros así:

```bash
nb init --env app1 --yes \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

### Continuar la última inicialización interrumpida

```bash
nb init --env app1 --resume
```

### Mostrar logs detallados al solucionar problemas

```bash
nb init --env app1 --yes --source docker --version latest --verbose
```

## Comandos relacionados

- [`nb env add`](./env/add.md)
- [`nb env auth`](./env/auth.md)
- [`nb source download`](./source/download.md)
