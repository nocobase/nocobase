---
title: "Visión general de FlowEngine"
description: "Guía de desarrollo de plugins con FlowEngine de NocoBase: uso básico de FlowModel, renderComponent, registerFlow, configuración de uiSchema y elección de la clase base."
keywords: "FlowEngine,FlowModel,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# FlowEngine

En NocoBase, **FlowEngine** es el motor que impulsa la configuración visual. Los bloques, los campos y los botones de acción de la interfaz de NocoBase se gestionan a través de FlowEngine: su renderizado, su panel de configuración y la persistencia de la configuración.

![20260403215904](https://static-docs.nocobase.com/20260403215904.png)

Para los desarrolladores de plugins, FlowEngine ofrece dos conceptos centrales:

- **FlowModel**: modelo de componente configurable. Renderiza la UI y gestiona las props.
- **Flow**: proceso de configuración. Define el panel de configuración y la lógica de tratamiento de datos del componente.

Si su componente debe aparecer en los menús "Añadir bloque / campo / acción" o necesita admitir configuración visual desde la interfaz, hay que envolverlo con un FlowModel. Si no necesita estas capacidades, basta con un componente React común. Consulte [Component vs FlowModel](../component-vs-flow-model).

## ¿Qué es FlowModel?

A diferencia de un componente React común, un FlowModel no solo se encarga de renderizar la UI: también gestiona el origen de las props, la definición del panel de configuración y la persistencia de la configuración. En resumen: las props de un componente común son fijas, mientras que las de un FlowModel se generan dinámicamente a través de un Flow.

Para profundizar en la arquitectura general de FlowEngine, consulte la [Documentación completa de FlowEngine](../../../flow-engine/index.md). A continuación se explica cómo usarlo desde la perspectiva del desarrollador de plugins.

## Ejemplo mínimo

Crear y registrar un FlowModel se hace en tres pasos:

### 1. Heredar de la clase base e implementar renderComponent

```tsx
// models/HelloBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Hello FlowEngine!</h3>
        <p>Este es un bloque personalizado.</p>
      </div>
    );
  }
}

// define() establece el nombre que aparece en el menú
HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

`renderComponent()` es el método de renderizado de este modelo, equivalente al `render()` de un componente React. `tExpr()` se utiliza para traducción diferida, ya que `define()` se ejecuta al cargar el módulo y i18n aún no está inicializado. Consulte [Context → Capacidades comunes → tExpr](../ctx/common-capabilities#texpr).

### 2. Registrar en el Plugin

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        // Carga bajo demanda; el módulo solo se carga la primera vez que se use
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

### 3. Usarlo en la interfaz

Tras el registro, una vez iniciado el plugin (consulte la [Visión general del desarrollo de plugins](../../index.md) para activarlo), cree una página nueva en la interfaz de NocoBase y haga clic en "Añadir bloque": verá su "Hello block" disponible.

![20260403221815](https://static-docs.nocobase.com/20260403221815.png)

## Añadir opciones de configuración con registerFlow

Renderizar no es suficiente: el verdadero valor de un FlowModel está en que sea **configurable**. Con `registerFlow()` puede añadir un panel de configuración para que el usuario modifique las propiedades desde la interfaz.

Por ejemplo, un bloque que permite editar su contenido HTML:

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    // El valor de this.props se establece desde el handler del Flow
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // Ejecutar antes del renderizado
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema define la UI del panel de configuración
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Valores por defecto
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // En el handler, los valores del panel de configuración se asignan a las props del modelo
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Puntos clave:

- **`on: 'beforeRender'`**: indica que este Flow se ejecuta antes del renderizado, escribiendo los valores del panel en `this.props` antes de pintar.
- **`uiSchema`**: define la UI del panel de configuración con formato JSON Schema. Ver [UI Schema](../../../flow-engine/ui-schema).
- **`handler(ctx, params)`**: `params` son los valores que el usuario ha introducido en el panel; mediante `ctx.model.props` se trasladan al modelo.
- **`defaultParams`**: valores por defecto del panel.

## Patrones habituales de uiSchema

`uiSchema` se basa en JSON Schema. v2 mantiene compatibilidad con esta sintaxis, pero su uso es limitado: principalmente describe formularios en el panel de configuración del Flow. Para el renderizado en tiempo de ejecución, se recomienda usar componentes Antd directamente, sin pasar por uiSchema.

Aquí los patrones más habituales (referencia completa en [UI Schema](../../../flow-engine/ui-schema)):

```ts
uiSchema: {
  // Entrada de texto
  title: {
    type: 'string',
    title: 'Título',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // Texto multilínea
  content: {
    type: 'string',
    title: 'Contenido',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  // Lista desplegable
  type: {
    type: 'string',
    title: 'Tipo',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: 'Principal', value: 'primary' },
      { label: 'Predeterminado', value: 'default' },
      { label: 'Discontinuo', value: 'dashed' },
    ],
  },
  // Interruptor
  bordered: {
    type: 'boolean',
    title: 'Mostrar borde',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}
```

Cada campo se envuelve con `'x-decorator': 'FormItem'`, lo que añade automáticamente título y disposición.

## Parámetros de define()

`FlowModel.define()` configura los metadatos del modelo y controla cómo aparece en los menús. En el desarrollo de plugins, lo más usado es `label`, pero admite más parámetros:

| Parámetro | Tipo | Descripción |
|------|------|------|
| `label` | `string \| ReactNode` | Nombre que aparece en los menús "Añadir bloque / campo / acción"; admite `tExpr()` para traducción diferida |
| `icon` | `ReactNode` | Icono en el menú |
| `sort` | `number` | Peso de ordenación; cuanto menor el número, más arriba. Por defecto `0` |
| `hide` | `boolean \| (ctx) => boolean` | Si se oculta del menú; admite función dinámica |
| `group` | `string` | Identificador del grupo, para clasificarlo en un grupo concreto del menú |
| `children` | `SubModelItem[] \| (ctx) => SubModelItem[]` | Submenú; admite función asíncrona dinámica |
| `toggleable` | `boolean \| (model) => boolean` | Si admite alternancia (único bajo el mismo padre) |
| `searchable` | `boolean` | Si el submenú habilita búsqueda |

La mayoría de plugins solo necesitan `label`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
});
```

Si necesita controlar la ordenación o ocultarlo, añada `sort` y `hide`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
  sort: 10,       // Más abajo
  hide: (ctx) => !ctx.someCondition,  // Ocultar condicionalmente
});
```

## Elección de la clase base de FlowModel

NocoBase ofrece varias clases base de FlowModel; elija según lo que vaya a extender:

| Clase base             | Uso                                    | Documentación        |
| ---------------------- | -------------------------------------- | -------------------- |
| `BlockModel`           | Bloque básico                          | [Extensión de bloques](./block) |
| `DataBlockModel`       | Bloque que necesita obtener datos por su cuenta | [Extensión de bloques](./block) |
| `CollectionBlockModel` | Bloque ligado a una colección, con datos automáticos | [Extensión de bloques](./block) |
| `TableBlockModel`      | Bloque de tabla completo, con columnas, barra de acciones, etc. | [Extensión de bloques](./block) |
| `FieldModel`           | Componente de campo                     | [Extensión de campos](./field) |
| `ActionModel`          | Botón de acción                         | [Extensión de acciones](./action) |

Como regla general: para una tabla, use `TableBlockModel` (la más usada, lista para usar); para un renderizado totalmente personalizado, use `CollectionBlockModel` o `BlockModel`; para un campo, use `FieldModel`; para un botón de acción, use `ActionModel`.

## Enlaces relacionados

- [Extensión de bloques](./block): desarrollar bloques con la familia BlockModel.
- [Extensión de campos](./field): desarrollar campos personalizados con FieldModel.
- [Extensión de acciones](./action): desarrollar botones de acción con ActionModel.
- [Component vs FlowModel](../component-vs-flow-model): ¿no sabe cuál usar?
- [Definición de Flow](../../../flow-engine/definitions/flow-definition.md): parámetros completos de `registerFlow` y lista de eventos.
- [Documentación completa de FlowEngine](../../../flow-engine/index.md): referencia completa de FlowModel, Flow y Context.
- [Inicio rápido de FlowEngine](../../../flow-engine/quickstart): construir desde cero un componente de botón orquestable.
- [Visión general del desarrollo de plugins](../../index.md): introducción general al desarrollo de plugins.
- [UI Schema](../../../flow-engine/ui-schema): referencia de la sintaxis de `uiSchema`.
