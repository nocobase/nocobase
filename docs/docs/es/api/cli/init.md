---
title: "nb init"
description: "Referencia del comando nb init: inicializa NocoBase, conecta con una aplicación existente o instala una nueva, y la guarda como un env del CLI."
keywords: "nb init,NocoBase CLI,inicialización,env,Docker,npm,Git"
---

# nb init

Inicializa el espacio de trabajo actual para que el coding agent pueda conectarse y utilizar NocoBase. `nb init` puede conectarse con una aplicación existente o instalar una nueva mediante Docker, npm o Git.

## Uso

```bash
nb init [flags]
```

## Descripción

`nb init` admite tres modos de interacción:

- Modo predeterminado: completar paso a paso en la terminal.
- `--ui`: abre un formulario en el navegador local para completar el flujo guiado.
- `--yes`: omite las indicaciones y usa los valores predeterminados. Este modo requiere `--env <envName>` y crea una nueva aplicación local.

Por defecto, `nb init` instala o actualiza las NocoBase AI coding skills durante la inicialización o al reanudar. Si ya gestiona las skills por su cuenta, o si está ejecutando en CI o en un entorno sin conexión, puede usar `--skip-skills` para omitir este paso.

Si la inicialización se interrumpe después de guardar la configuración del env, puede usar `--resume` para continuar:

```bash
nb init --env app1 --resume
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Omitir indicaciones y utilizar flags y valores predeterminados |
| `--env`, `-e` | string | Nombre del env para esta inicialización; obligatorio en los modos `--yes` y `--resume` |
| `--ui` | boolean | Abrir el asistente visual en el navegador; no puede usarse junto con `--yes` |
| `--verbose` | boolean | Mostrar la salida detallada de los comandos |
| `--skip-skills` | boolean | Omitir la instalación o actualización de las NocoBase AI coding skills durante la inicialización |
| `--ui-host` | string | Dirección de escucha del servicio local de `--ui`; por defecto `127.0.0.1` |
| `--ui-port` | integer | Puerto del servicio local de `--ui`; `0` significa asignación automática |
| `--locale` | string | Idioma de los mensajes del CLI y de la UI: `en-US` o `zh-CN` |
| `--api-base-url`, `-u` | string | Dirección de la API de NocoBase, incluyendo el prefijo `/api` |
| `--auth-type`, `-a` | string | Método de autenticación: `token` u `oauth` |
| `--access-token`, `-t` | string | API key o access token utilizado por el método de autenticación `token` |
| `--resume` | boolean | Reutilizar la configuración guardada del env del workspace para continuar la inicialización |
| `--lang`, `-l` | string | Idioma de la aplicación NocoBase tras la instalación |
| `--force`, `-f` | boolean | Reconfigurar un env existente y sustituir los recursos de ejecución conflictivos cuando sea necesario |
| `--app-root-path` | string | Directorio del código fuente de la aplicación local npm/Git; por defecto `./<envName>/source/` |
| `--app-port` | string | Puerto de la aplicación local; por defecto `13000`; en el modo `--yes` se selecciona automáticamente un puerto disponible |
| `--storage-path` | string | Directorio de archivos subidos y datos de la base de datos gestionada; por defecto `./<envName>/storage/` |
| `--root-username` | string | Nombre de usuario del administrador inicial |
| `--root-email` | string | Correo electrónico del administrador inicial |
| `--root-password` | string | Contraseña del administrador inicial |
| `--root-nickname` | string | Apodo del administrador inicial |
| `--builtin-db`, `--no-builtin-db` | boolean | Si crear la base de datos integrada gestionada por el CLI |
| `--db-dialect` | string | Tipo de base de datos: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--builtin-db-image` | string | Imagen de contenedor de la base de datos integrada |
| `--db-host` | string | Dirección de la base de datos |
| `--db-port` | string | Puerto de la base de datos |
| `--db-database` | string | Nombre de la base de datos |
| `--db-user` | string | Usuario de la base de datos |
| `--db-password` | string | Contraseña de la base de datos |
| `--fetch-source` | boolean | Descargar archivos de la aplicación o extraer la imagen de Docker antes de la instalación |
| `--source`, `-s` | string | Forma de obtener NocoBase: `docker`, `npm` o `git` |
| `--version`, `-v` | string | Parámetro de versión: versión npm, tag de imagen Docker o ref de Git |
| `--replace`, `-r` | boolean | Reemplazar el directorio de destino si ya existe |
| `--dev-dependencies`, `-D` | boolean | Si instalar devDependencies durante la instalación npm/Git |
| `--output-dir`, `-o` | string | Directorio de destino de la descarga, o el directorio donde se guarda el tarball de Docker |
| `--git-url` | string | URL del repositorio Git |
| `--docker-registry` | string | Nombre del repositorio de imágenes Docker, sin tag |
| `--docker-platform` | string | Plataforma de la imagen Docker: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save`, `--no-docker-save` | boolean | Si guardar la imagen Docker como tarball tras descargarla |
| `--npm-registry` | string | Registry utilizado para las descargas y la instalación de dependencias de npm/Git |
| `--build`, `--no-build` | boolean | Si compilar tras la instalación de dependencias de npm/Git |
| `--build-dts` | boolean | Si generar los archivos de declaración de TypeScript durante la compilación de npm/Git |

## Ejemplos

```bash
nb init
nb init --ui
nb init --env app1 --yes
nb init --env app1 --yes --skip-skills
nb init --env app1 --resume
nb init --env app1 --resume --skip-skills
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source npm --version alpha --app-port 13080
nb init --env app1 --yes --source git --version fix/cli-v2
nb init --ui --ui-port 3000
```

## Comandos relacionados

- [`nb env add`](./env/add.md)
- [`nb source download`](./source/download.md)
