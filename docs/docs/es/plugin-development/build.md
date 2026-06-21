# Compilación y empaquetado

Una vez finalizado el desarrollo del plugin, son necesarios dos pasos — compilación (transpilación del código fuente) y empaquetado (generación del archivo `.tar.gz`) — antes de poder distribuirlo a otras aplicaciones NocoBase.

## Compilar el plugin

La compilación transpila el código TypeScript de `src/` a JavaScript: el código del cliente se empaqueta con Rsbuild y el código del servidor con tsup:

```bash
yarn build @my-project/plugin-hello
```

Los artefactos de compilación se generan en el directorio `dist/` dentro de la raíz del plugin.

:::tip Nota

Si el plugin se crea en el repositorio de código fuente, la primera compilación activará una comprobación de tipos de todo el repositorio, lo que puede llevar algún tiempo. Se recomienda asegurarse de que las dependencias estén instaladas y de que el repositorio se encuentre en un estado compilable.

:::

## Empaquetar el plugin

El empaquetado comprime los artefactos de compilación en un archivo `.tar.gz` para facilitar su subida a otros entornos:

```bash
yarn nocobase tar @my-project/plugin-hello
```

El archivo empaquetado se genera por defecto en `storage/tar/@my-project/plugin-hello.tar.gz`.

También puede usar el parámetro `--tar` para combinar la compilación y el empaquetado en un solo paso:

```bash
yarn build @my-project/plugin-hello --tar
```

## Subir a otra aplicación de NocoBase

Suba el archivo `.tar.gz` y descomprímalo en el directorio `./storage/plugins` de la aplicación de destino. Para más detalles, consulte [Instalar y actualizar plugins](../get-started/install-upgrade-plugins.mdx).

### Habilitar plugins por defecto

Tras subir el plugin, este no se activa automáticamente — aparecerá en el «Administrador de complementos» y deberá habilitarlo manualmente. Si está manteniendo su propia aplicación NocoBase y desea que el plugin se habilite por defecto junto con la aplicación, puede controlarlo con la variable de entorno `APPEND_PRESET_BUILT_IN_PLUGINS` (añadir plugins integrados por defecto); consulte [Hacer que el plugin esté predefinido o habilitado por defecto (opcional)](./write-your-first-plugin.md#hacer-que-el-plugin-esté-predefinido-o-habilitado-por-defecto-opcional).

## Personalizar la Configuración de Compilación

Si desea personalizar la configuración de compilación, puede crear un archivo `build.config.ts` en el directorio raíz de su `plugin` con el siguiente contenido:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Rsbuild se utiliza para empaquetar el código del lado del cliente (`src/client`).

    // Modifique la configuración de Rsbuild. Para más detalles, consulte: https://rsbuild.rs/guide/configuration/rsbuild
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup se utiliza para empaquetar el código del lado del servidor (`src/server`).

    // Modifique la configuración de tsup. Para más detalles, consulte: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Función de callback que se ejecuta antes de que comience la compilación, permitiendo realizar operaciones previas a la misma.
  },
  afterBuild: (log: PkgLog) => {
    // Función de callback que se ejecuta una vez finalizada la compilación, permitiendo realizar operaciones posteriores a la misma.
  };
});
```

## Enlaces relacionados

- [Escriba su primer plugin](./write-your-first-plugin.md) — Cree un plugin desde cero, con el flujo completo de compilación y empaquetado
- [Estructura del proyecto](./project-structure.md) — Conozca el propósito de los directorios `packages/plugins`, `storage/tar` y otros
- [Gestión de dependencias](./dependency-management.md) — Declaración de dependencias del plugin y dependencias globales
- [Descripción general del desarrollo de plugins](./index.md) — Introducción general al desarrollo de plugins
- [Instalar y actualizar plugins](../get-started/install-upgrade-plugins.mdx) — Subir el archivo empaquetado al entorno de destino
- [Variables de Entorno](../get-started/installation/env.md) — Configuración de variables de entorno para plugins predefinidos, integrados y otros
