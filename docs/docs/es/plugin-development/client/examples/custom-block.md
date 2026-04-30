---
title: "Crear un bloque de presentación personalizado"
description: "Tutorial práctico: cree un bloque de presentación de HTML configurable usando BlockModel + registerFlow + uiSchema."
keywords: "bloque personalizado,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# Crear un bloque de presentación personalizado

En NocoBase, un bloque es un área de contenido en la página. Este ejemplo muestra cómo crear, con `BlockModel`, el bloque personalizado más sencillo: permite editar contenido HTML desde la interfaz, de modo que el usuario pueda modificar lo que se muestra a través del panel de configuración.

Es el primer ejemplo que utiliza FlowEngine; trabajará con `BlockModel`, `renderComponent`, `registerFlow` y `uiSchema`.

:::tip Lectura previa

Se recomienda revisar antes los siguientes contenidos:

- [Crear el primer plugin](../../write-your-first-plugin): creación del plugin y estructura de directorios.
- [Plugin](../plugin): entrada del plugin y ciclo de vida de `load()`.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel, `renderComponent` y `registerFlow`.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción y `tExpr()`.

:::

## Resultado final

Vamos a crear un bloque "Simple block" que:

- Aparece en el menú "Añadir bloque".
- Renderiza el HTML que el usuario configure.
- Permite editar el HTML desde un panel de configuración (registerFlow + uiSchema).

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

Código fuente completo en [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block). Para ejecutarlo en local:

```bash
yarn pm enable @nocobase-example/plugin-simple-block
```

A continuación se construye el plugin paso a paso.

## Paso 1: crear el esqueleto del plugin

Desde la raíz del repositorio:

```bash
yarn pm create @my-project/plugin-simple-block
```

Esto genera la estructura básica en `packages/plugins/@my-project/plugin-simple-block`. Para más detalles, consulte [Crear el primer plugin](../../write-your-first-plugin).

## Paso 2: crear el modelo del bloque

Cree `src/client-v2/models/SimpleBlockModel.tsx`. Es el núcleo del plugin: define cómo se renderiza y cómo se configura el bloque.

```tsx
// src/client-v2/models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

// Establecer el nombre del bloque que aparece en el menú "Añadir bloque"
SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

// Registrar el panel de configuración para que el usuario pueda editar el HTML
SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // Ejecutar antes del renderizado
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema define la UI del formulario en el panel de configuración
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Valores por defecto del panel de configuración
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // Volcar los valores del panel de configuración a las props del modelo
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Puntos clave:

- **`renderComponent()`**: renderiza la UI del bloque y lee el HTML desde `this.props.html`.
- **`define()`**: nombre del bloque en el menú "Añadir bloque". `tExpr()` se utiliza para traducción diferida porque `define()` se ejecuta al cargar el módulo, momento en el que i18n aún no está inicializado.
- **`registerFlow()`**: añade el panel de configuración. `uiSchema` describe el formulario (sintaxis: [UI Schema](../../../../flow-engine/ui-schema)); `handler` traslada lo que el usuario escribe a `ctx.model.props`, donde `renderComponent()` lo lee.

## Paso 3: añadir los archivos de traducción

Edite los archivos en `src/locale/` y añada las traducciones de las claves usadas en `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple block": "简单区块",
  "Simple Block Flow": "简单区块配置",
  "Edit HTML Content": "编辑 HTML 内容",
  "HTML Content": "HTML 内容"
}
```

```json
// src/locale/en-US.json
{
  "Simple block": "Simple block",
  "Simple Block Flow": "Simple Block Flow",
  "Edit HTML Content": "Edit HTML Content",
  "HTML Content": "HTML Content"
}
```

:::warning Atención

La primera vez que añada un archivo de idioma debe reiniciar la aplicación para que surta efecto.

:::

Para más detalles sobre los archivos de traducción y `tExpr()`, consulte [Internacionalización (i18n)](../component/i18n).

## Paso 4: registrar en el plugin

Edite `src/client-v2/plugin.tsx` y use `registerModelLoaders` para carga bajo demanda:

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleBlockClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        // Carga bajo demanda: el módulo solo se carga la primera vez que se usa
        loader: () => import('./models/SimpleBlockModel'),
      },
    });
  }
}

export default PluginSimpleBlockClient;
```

`registerModelLoaders` utiliza importación dinámica: el código del modelo se carga solo cuando realmente se necesita. Es la forma de registro recomendada.

## Paso 5: activar el plugin

```bash
yarn pm enable @my-project/plugin-simple-block
```

Una vez activado, cree una página y haga clic en "Añadir bloque": verá "Simple block" disponible. Al añadirlo, el botón de configuración del bloque permite editar el HTML.

## Código fuente completo

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block): bloque de presentación personalizado.

## Resumen

Capacidades utilizadas en este ejemplo:

| Capacidad     | Uso                                | Documentación                                 |
| ------------- | ---------------------------------- | --------------------------------------------- |
| Renderizado del bloque | `BlockModel` + `renderComponent()` | [FlowEngine → Extensión de bloques](../flow-engine/block) |
| Registro en menú | `define({ label })`               | [Visión general de FlowEngine](../flow-engine/index.md) |
| Panel de configuración | `registerFlow()` + `uiSchema`   | [Visión general de FlowEngine](../flow-engine/index.md) |
| Registro de modelos | `registerModelLoaders` (carga bajo demanda) | [Plugin](../plugin) |
| Traducción diferida | `tExpr()`                          | [Internacionalización (i18n)](../component/i18n) |

## Enlaces relacionados

- [Crear el primer plugin](../../write-your-first-plugin): crear el esqueleto desde cero.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel y `registerFlow`.
- [FlowEngine → Extensión de bloques](../flow-engine/block): BlockModel, DataBlockModel, CollectionBlockModel.
- [UI Schema](../../../../flow-engine/ui-schema): referencia de la sintaxis de `uiSchema`.
- [Component vs FlowModel](../component-vs-flow-model): cuándo usar FlowModel.
- [Plugin](../plugin): entrada del plugin y ciclo de vida.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción y `tExpr`.
- [Documentación completa de FlowEngine](../../../flow-engine/index.md): referencia completa.
