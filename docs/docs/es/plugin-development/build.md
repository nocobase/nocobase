---
title: "Compilación y empaquetado"
description: "Compilación y empaquetado de plugins NocoBase: nb source build, configuración personalizada build.config.ts, empaquetado del cliente con Rsbuild, empaquetado del servidor con tsup."
keywords: "compilación de plugin,empaquetado de plugin,nb source build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# Compilación y empaquetado

Una vez finalizado el desarrollo del plugin, son necesarios dos pasos — compilación (transpilación del código fuente) y empaquetado (generación del archivo `.tgz`) — antes de poder distribuirlo a otras aplicaciones NocoBase.

## Compilar el plugin

Ejecute el comando de compilación en el directorio del código fuente (`<app-path>/source/`). La compilación transpila el código TypeScript de `src/` a JavaScript — el código del cliente se empaqueta con Rsbuild y el código del servidor con tsup:

```bash
cd <app-path>/source
nb source build @my-project/plugin-hello
```

Los artefactos de compilación se generan en el directorio `dist/` dentro de la raíz del plugin.

:::tip Nota

La primera compilación puede activar una comprobación de tipos de todo el repositorio, lo que puede llevar algún tiempo. Asegúrese de que las dependencias estén instaladas y de que el repositorio se encuentre en un estado compilable.

:::

## Empaquetar el plugin

Ejecute también en el directorio del código fuente (`<app-path>/source/`). El parámetro `--tar` permite combinar la compilación y el empaquetado en un solo paso, generando un archivo comprimido `.tgz`:

```bash
cd <app-path>/source
nb source build @my-project/plugin-hello --tar
```

El archivo empaquetado se genera por defecto en el directorio `source/storage/tar/`. Una vez completada la compilación, el comando imprimirá la ruta completa del tarball.

## Subir a otra aplicación de NocoBase

Suba el archivo `.tar.gz` y descomprímalo en el directorio `./storage/plugins` de la aplicación de destino. Para más detalles, consulte [Instalar y actualizar plugins](../get-started/install-upgrade-plugins.mdx).

### Habilitar plugins por defecto

Tras subir el plugin, este no se activa automáticamente — aparecerá en el « Gestor de plugins » y deberá habilitarlo manualmente. Si está manteniendo su propia aplicación NocoBase y desea que el plugin se habilite por defecto junto con la aplicación, puede controlarlo con la variable de entorno `APPEND_PRESET_BUILT_IN_PLUGINS` (añadir plugins integrados por defecto); consulte [Hacer que el plugin esté predefinido o habilitado por defecto](./write-your-first-plugin.md#hacer-que-el-plugin-esté-predefinido-o-habilitado-por-defecto-opcional).

## Personalizar la configuración de compilación

En general, la configuración de compilación por defecto es suficiente. Si necesita personalizar — por ejemplo modificar el punto de entrada del paquete, añadir alias o ajustar las opciones de compresión — puede crear un archivo `build.config.ts` en el directorio raíz del plugin:

```ts
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Modificar la configuración de empaquetado Rsbuild del lado del cliente (src/client-v2)
    // Referencia: https://rsbuild.rs/guide/configuration/rsbuild
    return config;
  },
  modifyTsupConfig: (config) => {
    // Modificar la configuración de empaquetado tsup del lado del servidor (src/server)
    // Referencia: https://tsup.egoist.dev/#using-custom-configuration
    return config;
  },
  beforeBuild: (log) => {
    // Callback antes del inicio de la compilación, por ejemplo limpiar archivos temporales, generar código, etc.
  },
  afterBuild: (log) => {
    // Callback después de finalizar la compilación, por ejemplo copiar recursos adicionales, generar estadísticas, etc.
  },
});
```

Algunos puntos clave:

- `modifyRsbuildConfig` — se utiliza para ajustar el empaquetado del cliente: añadir plugins de Rsbuild, modificar alias de resolve, ajustar la estrategia de code splitting, etc. Las opciones de configuración se describen en la [documentación de Rsbuild](https://rsbuild.rs/guide/configuration/rsbuild)
- `modifyTsupConfig` — se utiliza para ajustar el empaquetado del servidor: modificar target, externals, entry, etc. Las opciones de configuración se describen en la [documentación de tsup](https://tsup.egoist.dev/#using-custom-configuration)
- `beforeBuild` / `afterBuild` — hooks antes y después de la compilación, que reciben una función `log` para generar registros. Por ejemplo, generar archivos de código en `beforeBuild`, o copiar recursos estáticos al directorio de artefactos en `afterBuild`

## Enlaces relacionados

- [Escriba su primer plugin](./write-your-first-plugin.md) — creación de un plugin desde cero, con el flujo completo de compilación y empaquetado
- [Estructura del directorio del proyecto](./project-structure.md) — conozca el propósito de los directorios `plugins/`, `storage/tar` y otros
- [Gestión de dependencias](./dependency-management.md) — declaración de dependencias del plugin y dependencias globales
- [Descripción general del desarrollo de plugins](./index.md) — introducción general al desarrollo de plugins
- [Instalar y actualizar plugins](../get-started/install-upgrade-plugins.mdx) — subir el archivo empaquetado al entorno de destino
- [Variables de entorno](../get-started/installation/env.md) — configuración de variables de entorno para plugins predefinidos, integrados y otros
