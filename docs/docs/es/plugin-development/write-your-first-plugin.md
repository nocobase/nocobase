:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

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
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Exportación predeterminada del plugin del lado del servidor
     ├─ client                   # Ubicación del código del lado del cliente
     │  ├─ index.tsx             # Clase de plugin del lado del cliente exportada por defecto
     │  ├─ plugin.tsx            # Entrada del plugin (extiende @nocobase/client Plugin)
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

Una vez creado, puede acceder a la página del gestor de **plugins** en su navegador (URL predeterminada: http://localhost:13000/admin/settings/plugin-manager) para confirmar si el **plugin** aparece en la lista.

## Paso 2: Implemente un bloque de cliente sencillo

A continuación, añadiremos un modelo de bloque personalizado al **plugin** para mostrar un mensaje de bienvenida.

1. **Cree un nuevo archivo de modelo de bloque** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
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

2. **Registre el modelo de bloque**. Edite `client/models/index.ts` para exportar el nuevo modelo y que pueda ser cargado por el tiempo de ejecución del frontend:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Después de guardar el código, si está ejecutando un script de desarrollo, debería ver los registros de recarga en caliente en la salida de la terminal.

## Paso 3: Active y pruebe el plugin

Puede habilitar el **plugin** a través de la línea de comandos o la interfaz:

- **Línea de comandos**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Interfaz de administración**: Acceda al gestor de **plugins**, busque `@my-project/plugin-hello` y haga clic en "Activar".

Después de la activación, cree una nueva página "Modern page (v2)". Al añadir bloques, verá "Hello block". Insértelo en la página para ver el contenido de bienvenida que acaba de escribir.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Paso 4: Compile y empaquete

Cuando esté listo para distribuir el **plugin** a otros entornos, primero deberá compilarlo y empaquetarlo:

```bash
yarn build @my-project/plugin-hello --tar
# O ejecute en dos pasos
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> **Nota**: Si el **plugin** se crea en el repositorio de origen, la primera compilación activará una comprobación de tipo de repositorio completa, lo que puede llevar algún tiempo. Se recomienda asegurarse de que las dependencias estén instaladas y de que el repositorio se encuentre en un estado compilable.

Una vez completada la compilación, el archivo del paquete se encuentra por defecto en `storage/tar/@my-project/plugin-hello.tar.gz`.

## Paso 5: Suba a otra aplicación de NocoBase

Suba y descomprima el archivo en el directorio `./storage/plugins` de la aplicación de destino. Para más detalles, consulte [Instalar y actualizar plugins](../get-started/install-upgrade-plugins.mdx).