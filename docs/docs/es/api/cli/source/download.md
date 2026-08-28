---
title: "nb source download"
description: "Referencia del comando nb source download: obtiene el código fuente o la imagen de NocoBase desde npm, Docker o Git."
keywords: "nb source download,NocoBase CLI,descarga,npm,Docker,Git"
---

# nb source download

Obtiene NocoBase desde npm, Docker o Git. `--version` es el parámetro de versión común a las tres fuentes: npm utiliza la versión del paquete, Docker el tag de la imagen y Git la git ref.

## Uso

```bash
nb source download [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Utiliza los valores por defecto y omite las preguntas interactivas |
| `--verbose` | boolean | Muestra la salida detallada del comando |
| `--locale` | string | Idioma de los mensajes de la CLI: `en-US` o `zh-CN` |
| `--source`, `-s` | string | Método de obtención: `docker`, `npm` o `git` |
| `--version`, `-v` | string | Versión del paquete npm, tag de la imagen Docker o git ref |
| `--replace`, `-r` | boolean | Reemplaza el directorio de destino si ya existe |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | Indica si se instalan las devDependencies en instalaciones npm/Git |
| `--output-dir`, `-o` | string | Directorio de destino de la descarga, o directorio donde guardar el tarball Docker |
| `--git-url` | string | URL del repositorio Git |
| `--docker-registry` | string | Nombre del registry de la imagen Docker, sin tag |
| `--docker-platform` | string | Plataforma de la imagen Docker: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | Indica si se guarda como tarball tras descargar la imagen Docker |
| `--npm-registry` | string | Registry de npm utilizado para la descarga e instalación de dependencias en npm/Git |
| `--build` / `--no-build` | boolean | Indica si se realiza la build tras instalar las dependencias en npm/Git |
| `--build-dts` | boolean | Indica si se generan archivos de declaración TypeScript durante la build en npm/Git |
| `--hook-script` | string | Módulo hook que se ejecuta después de npm scaffold o Git clone y antes de instalar dependencias; solo aplica a source npm/Git |

## Ejemplos

```bash
nb source download
nb source download -y --source npm --version alpha
nb source download -y --source npm --version alpha --no-build
nb source download --source npm --version alpha --output-dir=./app
nb source download --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64
nb source download -y --source docker --version alpha --docker-save -o ./docker-images
nb source download --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git
nb source download --source git --version fix/cli-v2
nb source download -y --source npm --version alpha --build-dts
nb source download -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com
nb source download -y --source git --version beta --hook-script ./hooks.mjs
```

## Hook previo a la instalación

`--hook-script` solo afecta a la ejecución actual de `nb source download`. Si quieres que el hook se guarde con el env y se reutilice en `nb app upgrade` o en la restauración local de source, pásalo mediante [`nb init --hook-script`](../init.md).

El archivo hook debe exportar por defecto un objeto e implementar `beforeDependencyInstall(context)`:

```js
export default {
  beforeDependencyInstall: async ({ sourcePath, version, envConfig }) => {
    // Se ejecuta después de git clone / npm scaffold y antes de yarn install.
  },
};
```

Cuando ejecutas `nb source download --hook-script` directamente, `beforeDependencyInstall` recibe `context.phase` como `source-download` y `context.command` como `source:download`. Este comando no ejecuta `beforeAppInstall` ni `afterAppStart`; esos hooks pertenecen a los flujos de instalación, start, restart y upgrade de la app.


## Alias de versión

Para la fuente Git, los dist-tag más habituales se resuelven a la rama correspondiente: `latest` → `main`, `beta` → `next`, `alpha` → `develop`.

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
