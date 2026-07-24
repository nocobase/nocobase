---
title: "Escriba su primer plugin en NocoBase"
description: "Crear un plugin de bloque desde cero: nb scaffold plugin, esqueleto del plugin, directorios client/server, registrar un bloque, flujo de desarrollo y depuración."
keywords: "escribir plugin,primer plugin,nb scaffold plugin,esqueleto de plugin,plugin de bloque,desarrollo de plugins NocoBase"
---

# Escriba su primer plugin

Este documento le guiará para crear desde cero un plugin de bloque utilizable en una página, ayudándole a comprender la estructura básica y el flujo de desarrollo de un plugin NocoBase.

## Requisitos previos

Antes de comenzar, asegúrese de haber instalado una aplicación NocoBase mediante el CLI de NocoBase (`nb init`). El desarrollo de plugins admite dos fuentes: npm y Git. Se recomienda la fuente Git (al desarrollar con IA, puede consultar directamente el código fuente). Consulte [Instalar la aplicación mediante CLI](../nocobase-cli/installation/cli.md).

```bash
nb init --ui
```

Luego elija la opción `Git source install` para instalar la aplicación NocoBase:

![git source](https://static-docs.nocobase.com/20260720173518.png)

Una vez completada la instalación, puede comenzar.

## Paso 1: crear el esqueleto del plugin mediante el CLI

Ejecute el siguiente comando en el directorio raíz del proyecto (`<app-path>`) o en el directorio `source/` para generar rápidamente un plugin vacío:

```bash
nb scaffold plugin @my-project/plugin-hello
```

Una vez que el comando se ejecute correctamente, se generarán los archivos básicos en el directorio `<app-path>/plugins/@my-project/plugin-hello` (`nb` sincroniza automáticamente el plugin a `source/packages/plugins/` para el desarrollo y la construcción). La estructura predeterminada es la siguiente:

```bash
├─ /plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client-v2.d.ts
  ├─ client-v2.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Exportación predeterminada del plugin del lado del servidor
     ├─ client-v2                 # Ubicación del código del lado del cliente
     │  ├─ index.tsx             # Clase de plugin del lado del cliente exportada por defecto
     │  ├─ plugin.tsx            # Entrada del plugin (extiende @nocobase/client-v2 Plugin)
     │  ├─ locale.ts             # Utilidades de traducción useT / tExpr
     │  ├─ models                # Opcional: modelos de frontend (como nodos de flujo)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Ubicación del código del lado del servidor
     │  ├─ index.ts              # Clase de plugin del lado del servidor exportada por defecto
     │  ├─ plugin.ts             # Entrada del plugin (extiende @nocobase/server Plugin)
     │  ├─ collections           # Opcional: colecciones del lado del servidor
     │  ├─ migrations            # Opcional: migraciones de datos
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Opcional: multi-idioma
        ├─ en-US.json
        └─ zh-CN.json
```

Una vez creado, puede ejecutar

```bash
nb source dev
```

Luego acceda a la página del « Gestor de plugins » en su navegador ([dirección por defecto](http://localhost:13000/admin/settings/plugin-manager)) para confirmar si el plugin aparece en la lista.

## Paso 2: implementar un bloque de cliente sencillo

A continuación, añadiremos un modelo de bloque personalizado al plugin para mostrar un texto de bienvenida.

1. **Cree el archivo de modelo de bloque** `client-v2/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client-v2';
import React from 'react';
import { tExpr } from '../utils';

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

2. **Registre el modelo de bloque**. Edite `client-v2/plugin.ts` para registrar el nuevo modelo y que el runtime del frontend pueda cargarlo:

```ts
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClientV2 extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      }
    })
  }
}

export default PluginHelloClientV2;
```

Después de guardar el código, si está ejecutando un script de desarrollo, debería ver los registros de recarga en caliente en la salida de la terminal.

## Paso 3: active y pruebe el plugin

Puede activar el plugin a través de la línea de comandos o la interfaz:

- **Línea de comandos**

  ```bash
  nb plugin enable @my-project/plugin-hello
  ```

- **Interfaz de administración**: acceda al « Gestor de plugins », busque `@my-project/plugin-hello` y haga clic en « Activar ».

Después de la activación, cree una nueva página « Modern page (v2) ». Al añadir bloques, verá « Hello block ». Insértelo en la página para ver el contenido de bienvenida que acaba de escribir.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

### Hacer que el plugin esté predefinido o habilitado por defecto (opcional)

Lo anterior describe cómo activar un plugin de forma manual. Si está manteniendo su propia aplicación NocoBase y desea que ciertos plugins estén listos automáticamente tras ejecutar `nb init` (instalación inicial) o `nb app upgrade` (actualización), puede usar dos variables de entorno para controlar el estado predeterminado de los plugins:

- **`APPEND_PRESET_LOCAL_PLUGINS` (añadir plugins locales predefinidos por defecto)** — agrega el plugin a la lista de plugins locales predefinidos; tras la instalación aparecerá en el « Gestor de plugins », pero no estará activado por defecto y deberá habilitarlo manualmente
- **`APPEND_PRESET_BUILT_IN_PLUGINS` (añadir plugins integrados por defecto)** — agrega el plugin a la lista de plugins integrados; se activa automáticamente durante la instalación y, al ser un plugin integrado, **no puede desactivarse ni eliminarse desde el « Gestor de plugins »**

Para más detalles, consulte la documentación de [Variables de entorno](../get-started/installation/env.md#append_preset_local_plugins).

## Paso 4: compilar y empaquetar

Cuando esté listo para distribuir el plugin a otros entornos, primero debe compilarlo y empaquetarlo:

```bash
nb source build @my-project/plugin-hello --tar
# O ejecute en dos pasos
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
```

:::tip Nota

Si el plugin se crea en el repositorio de código fuente, la primera compilación activará una comprobación de tipos completa del repositorio, lo que puede llevar algún tiempo. Se recomienda asegurarse de que las dependencias estén instaladas y de que el repositorio se encuentre en un estado compilable.

:::

Una vez completada la compilación, el archivo empaquetado se encuentra por defecto en el directorio `source/storage/tar/`, y el comando imprimirá la ruta completa del tarball.

:::tip Nota

Antes de publicar, se recomienda escribir casos de prueba para verificar la lógica central del plugin; NocoBase proporciona una cadena de herramientas de pruebas del lado del servidor completa. Consulte [Tests](./server/test.md).

:::

## Paso 5: subir a otra aplicación de NocoBase

Suba y descomprima el archivo empaquetado en el directorio `./storage/plugins` de la aplicación de destino. Para más detalles, consulte [Instalar y actualizar plugins](../get-started/install-upgrade-plugins.mdx).

## Enlaces relacionados

- [Descripción general del desarrollo de plugins](./index.md) — conozca la arquitectura de microkernel de NocoBase y el ciclo de vida de los plugins
- [Estructura del directorio del proyecto](./project-structure.md) — convenciones de directorios, rutas de carga y prioridades de los plugins
- [Descripción general del desarrollo en el servidor](./server/index.md) — presentación y conceptos centrales de los plugins del lado del servidor
- [Descripción general del desarrollo en el cliente](./client/index.md) — presentación y conceptos centrales de los plugins del lado del cliente
- [Compilación y empaquetado](./build.md) — proceso de compilación, empaquetado y distribución de plugins
- [Tests](./server/test.md) — escribir casos de prueba para plugins del lado del servidor
- [Guía de inicio rápido de AI Agent](../ai/quick-start.mdx) — instalar el CLI de NocoBase e inicializar la aplicación
- [Instalar la aplicación mediante CLI](../nocobase-cli/installation/cli.md) — procedimiento de instalación completo
- [Instalar y actualizar plugins](../get-started/install-upgrade-plugins.mdx) — subir plugins empaquetados a otros entornos
- [Variables de entorno](../get-started/installation/env.md) — configuración de variables de entorno para plugins predefinidos, integrados y otros
