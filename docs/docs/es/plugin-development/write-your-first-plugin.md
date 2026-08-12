# Escriba su primer plugin

Esta guía le mostrará cómo crear un **plugin** de bloque desde cero que podrá utilizar en sus páginas. Le ayudará a comprender la estructura básica y el flujo de trabajo de desarrollo de los **plugins** de NocoBase.

## Requisitos previos

Antes de empezar, asegúrese de haber instalado NocoBase correctamente. Si aún no lo ha hecho, puede consultar las siguientes guías de instalación:

- [Instalar usando create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Instalar desde el código fuente de Git](/get-started/installation/git)

Una vez completada la instalación, podrá iniciar oficialmente su viaje de desarrollo de **plugins**.

## Paso 1: Cree el esqueleto del plugin a través de la CLI

Ejecute el siguiente comando en el directorio raíz del repositorio para generar rápidamente un **plugin** vacío:

```bash
yarn pm create @my-project/plugin-hello
```

Una vez que el comando se ejecute correctamente, se generarán los archivos básicos en el directorio `packages/plugins/@my-project/plugin-hello`. La estructura predeterminada es la siguiente:

```bash
packages/plugins/@my-project/plugin-hello/
├─ package.json
├─ README.md
├─ .npmignore
├─ client-v2.d.ts            # Declaración de tipos de la entrada del cliente v2
├─ client-v2.js              # Entrada del cliente v2
├─ client.d.ts               # Declaración de tipos de la entrada del cliente v1
├─ client.js                 # Entrada del cliente v1
├─ server.d.ts               # Declaración de tipos de la entrada del servidor
├─ server.js                 # Entrada del servidor
└─ src
   ├─ index.ts               # Exportación predeterminada del plugin del lado del servidor
   ├─ client-v2              # Ubicación del código del cliente v2
   │  ├─ index.tsx           # Clase de plugin del lado del cliente exportada por defecto
   │  ├─ plugin.tsx          # Entrada del plugin (extiende @nocobase/client-v2 Plugin)
   │  └─ client.d.ts
   ├─ client                 # Ubicación del código del cliente v1
   │  ├─ index.tsx
   │  ├─ plugin.tsx
   │  ├─ locale.ts
   │  ├─ models
   │  │  └─ index.ts
   │  └─ client.d.ts
   ├─ server                 # Ubicación del código del lado del servidor
   │  ├─ index.ts            # Clase de plugin del lado del servidor exportada por defecto
   │  ├─ plugin.ts           # Entrada del plugin (extiende @nocobase/server Plugin)
   │  └─ collections         # Colecciones del lado del servidor (inicialmente un directorio vacío)
   └─ locale                 # Recursos de idiomas
      ├─ en-US.json
      └─ zh-CN.json
```

El esqueleto generado es mínimo: bajo `src/client-v2/` solo hay archivos de entrada. El directorio `models/` y el archivo `locale.ts` que se usan en los pasos siguientes tendrá que crearlos usted mismo.

A continuación, inicie el modo de desarrollo para que los cambios de código se recarguen en caliente:

- Si el proyecto se creó con la CLI de NocoBase (`nb init`), ejecute desde la raíz del proyecto (`<app-path>`):

  ```bash
  nb source dev
  ```

- Si clonó usted mismo el repositorio de código fuente de NocoBase, ejecute desde la raíz del código fuente:

  ```bash
  yarn dev
  ```

Una vez en marcha, acceda a la página del gestor de **plugins** en su navegador (URL predeterminada: http://localhost:13000/admin/settings/plugin-manager) para confirmar si el **plugin** aparece en la lista.

## Paso 2: Implemente un bloque de cliente sencillo

A continuación, añadiremos un modelo de bloque personalizado al **plugin** para mostrar un mensaje de bienvenida.

1. **Cree el archivo auxiliar de traducción** `src/client-v2/locale.ts`. `tExpr` declara una expresión de traducción con espacio de nombres y `useT` proporciona la función de traducción dentro de los componentes:

```ts
import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
// @ts-ignore
import pkg from '../../package.json';

export function useT() {
  const engine = useFlowEngine();
  return (str: string) => engine.context.t(str, { ns: [pkg.name, 'client'] });
}

export function tExpr(key: string) {
  return _tExpr(key, { ns: [pkg.name, 'client'] });
}
```

2. **Cree un nuevo archivo de modelo de bloque** `src/client-v2/models/HelloBlockModel.tsx`:

```tsx pure
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

3. **Registre el modelo de bloque**. Crear el archivo del modelo no basta por sí solo: el tiempo de ejecución del frontend no escanea automáticamente el directorio `models/`, así que hay que registrarlo explícitamente en la entrada del plugin. Edite `src/client-v2/plugin.tsx` y declare cómo se carga el modelo mediante `registerModelLoaders` dentro de `load()`:

```tsx pure
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClientV2 extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}

export default PluginHelloClientV2;
```

`registerModelLoaders` recibe funciones de carga diferida, de modo que un modelo solo se carga cuando realmente se utiliza. La clave (`HelloBlockModel`) debe coincidir con el nombre de la clase del modelo: el tiempo de ejecución la usa para extraer la clase del modelo de las exportaciones con nombre del módulo.

Después de guardar el código, si está ejecutando el modo de desarrollo, debería ver los registros de recarga en caliente en la salida de la terminal.

## Paso 3: Active y pruebe el plugin

Puede habilitar el **plugin** a través de la línea de comandos o la interfaz:

- **Línea de comandos**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Interfaz de administración**: Acceda al gestor de **plugins**, busque `@my-project/plugin-hello` y haga clic en "Activar".

Después de la activación, cree una nueva página "Modern page (v2)". Al añadir bloques, verá "Hello block". Insértelo en la página para ver el contenido de bienvenida que acaba de escribir.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

### Hacer que el plugin esté predefinido o habilitado por defecto (opcional)

Lo anterior describe cómo activar un plugin de forma manual. Si está manteniendo su propia aplicación NocoBase y desea que ciertos plugins estén listos automáticamente tras ejecutar `nocobase install` (instalación inicial) o `nocobase upgrade` (actualización), puede usar dos variables de entorno para controlar el estado predeterminado de los plugins:

- **`APPEND_PRESET_LOCAL_PLUGINS` (añadir plugins locales predefinidos por defecto)** — Agrega el plugin a la lista de plugins locales predefinidos; tras la instalación aparecerá en el «Administrador de complementos», pero no estará activado por defecto y deberá habilitarlo manualmente.
- **`APPEND_PRESET_BUILT_IN_PLUGINS` (añadir plugins integrados por defecto)** — Agrega el plugin a la lista de plugins integrados; se activa automáticamente durante la instalación y, al ser un plugin integrado, **no puede desactivarse ni eliminarse desde el «Administrador de complementos»**.

El valor de ambas variables es el nombre del paquete del plugin (el campo `name` en `package.json`); si son varios plugins, sepárelos con comas. Configure así en el archivo `.env`:

```bash
# Predefinido por defecto: aparece en la lista del Administrador de complementos, pero no se activa automáticamente
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world

# Habilitado por defecto: se instala y activa automáticamente, y no puede desactivarse desde la interfaz
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world
```

En general, `yarn pm enable` es suficiente para el desarrollo y la depuración local. Estas dos variables son más adecuadas para escenarios de distribución «listas para usar», por ejemplo, cuando empaqueta una aplicación NocoBase con un conjunto fijo de plugins y desea que estén disponibles directamente tras la inicialización.

:::tip Nota

- El plugin debe estar descargado localmente y poder resolverse en `node_modules`; consulte [Estructura del proyecto](./project-structure.md).
- Tras configurar las variables, deberá volver a ejecutar `nocobase install` o `nocobase upgrade` para que surtan efecto.
- Consulte la descripción completa de variables de entorno en [Variables de Entorno](../get-started/installation/env.md#append_preset_local_plugins).

:::

## Paso 4: Compile y empaquete

Cuando esté listo para distribuir el **plugin** a otros entornos, primero deberá compilarlo y empaquetarlo:

```bash
yarn build @my-project/plugin-hello --tar
# O ejecute en dos pasos
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> **Nota**: Si el **plugin** se crea en el repositorio de origen, la primera compilación activará una comprobación de tipo de repositorio completa, lo que puede llevar algún tiempo. Se recomienda asegurarse de que las dependencias estén instaladas y de que el repositorio se encuentre en un estado compilable.

Una vez completada la compilación, el archivo del paquete se encuentra por defecto en el directorio `storage/tar/`, con el nombre `<nombre-del-paquete>-<versión>.tgz` — por ejemplo, `storage/tar/@my-project/plugin-hello-0.1.0.tgz`.

## Paso 5: Suba a otra aplicación de NocoBase

Suba y descomprima el archivo en el directorio `./storage/plugins` de la aplicación de destino. Para más detalles, consulte [Instalar y actualizar plugins](../get-started/install-upgrade-plugins.mdx).

Si la aplicación de destino se creó con la CLI de NocoBase (`nb init`), también puede importarlo directamente con `nb plugin import`, sin necesidad de descomprimirlo manualmente:

```bash
nb plugin import /your/path/plugin-hello-0.1.0.tgz
```

## Enlaces relacionados

- [Descripción general del desarrollo de plugins](./index.md) — Conozca la arquitectura de micronúcleo de NocoBase y el ciclo de vida de los plugins
- [Estructura del proyecto](./project-structure.md) — Convenciones de directorios, rutas de carga y prioridades de los plugins
- [Descripción general del desarrollo en el servidor](./server/index.md) — Introducción general y conceptos clave de los plugins del lado del servidor
- [Descripción general del desarrollo en el cliente](./client/index.md) — Introducción general y conceptos clave de los plugins del lado del cliente
- [Compilación y empaquetado](./build.md) — Proceso de compilación, empaquetado y distribución de plugins
- [Tests](./server/test.md) — Cómo escribir casos de prueba para plugins del lado del servidor
- [Instalar usando create-nocobase-app](../get-started/installation/create-nocobase-app) — Una de las formas de instalar NocoBase
- [Instalar desde el código fuente de Git](../get-started/installation/git) — Instalar NocoBase desde el código fuente
- [Instalar y actualizar plugins](../get-started/install-upgrade-plugins.mdx) — Subir plugins empaquetados a otros entornos
- [Variables de Entorno](../get-started/installation/env.md) — Configuración de variables de entorno para plugins predefinidos, integrados y otros