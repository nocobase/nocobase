---
title: "Extensión de bloques"
description: "Desarrollo de extensiones de bloque en NocoBase: clases base BlockModel, DataBlockModel, CollectionBlockModel y TableBlockModel y cómo registrarlas."
keywords: "extensión de bloques,Block,BlockModel,DataBlockModel,CollectionBlockModel,TableBlockModel,renderComponent,NocoBase"
---

# Extensión de bloques

En NocoBase, un **bloque (Block)** es un área de contenido en la página: una tabla, un formulario, un gráfico, una vista de detalle, etc. Heredando de las clases base de la familia BlockModel, puede crear bloques personalizados y registrarlos en el menú "Añadir bloque".

## Elección de la clase base

NocoBase ofrece tres clases base, elija según sus necesidades de datos:

| Clase base             | Cadena de herencia                       | Cuándo utilizarla                                          |
| ---------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `BlockModel`           | Bloque más básico                        | Bloques de presentación que no requieren fuente de datos   |
| `DataBlockModel`       | Hereda de `BlockModel`                   | Bloque con datos pero sin enlace a una colección de NocoBase |
| `CollectionBlockModel` | Hereda de `DataBlockModel`               | Enlazado a una colección de NocoBase, con datos automáticos |
| `TableBlockModel`      | Hereda de `CollectionBlockModel`         | Bloque de tabla completo con columnas, barra de acciones, paginación, etc. |

La cadena de herencia es: `BlockModel` → `DataBlockModel` → `CollectionBlockModel` → `TableBlockModel`.

Como regla general: si quiere un bloque de tabla listo para usar, use `TableBlockModel`; trae columnas, barra de acciones, paginación, ordenación, etc., y es la base más utilizada. Si necesita un renderizado totalmente personalizado (lista de tarjetas, línea de tiempo, etc.), use `CollectionBlockModel` y escriba su propio `renderComponent`. Si solo presenta contenido estático o UI personalizada, basta con `BlockModel`.

`DataBlockModel` tiene un papel particular: no añade nuevas propiedades ni métodos, su cuerpo de clase es vacío. Su función es **identificación por categoría**: los bloques que heredan de `DataBlockModel` se clasifican en el grupo "Bloques de datos" del menú. Si su bloque debe gestionar la obtención de datos por sí mismo (sin pasar por el enlace estándar a Collection), puede heredar de `DataBlockModel`. Por ejemplo, el `ChartBlockModel` del plugin de gráficos: usa un `ChartResource` propio para obtener datos y no necesita enlace estándar. En la mayoría de los casos no hace falta usar `DataBlockModel` directamente; con `CollectionBlockModel` o `TableBlockModel` es suficiente.

## Ejemplo de BlockModel

Un bloque sencillo que permite editar contenido HTML:

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Este ejemplo cubre los tres pasos del desarrollo de un bloque:

1. **`renderComponent()`**: renderiza la UI del bloque y lee las propiedades desde `this.props`.
2. **`define()`**: establece el nombre que aparece en el menú "Añadir bloque".
3. **`registerFlow()`**: añade un panel de configuración visual desde el que el usuario puede editar el HTML.

## Ejemplo de CollectionBlockModel

Si el bloque debe enlazarse a una tabla de NocoBase, use `CollectionBlockModel`. Gestiona automáticamente la obtención de datos:

```tsx
// models/ManyRecordBlockModel.tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

export class ManyRecordBlockModel extends CollectionBlockModel {
  // Declarar que es un bloque de múltiples registros
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h3>Bloque de tabla de datos</h3>
        {/* resource.getData() obtiene los datos de la tabla */}
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records'),
});
```

Respecto a `BlockModel`, `CollectionBlockModel` añade:

- **`static scene`**: declara el escenario del bloque. Valores comunes: `BlockSceneEnum.many` (lista de varios registros), `BlockSceneEnum.one` (detalle/formulario de un registro). El enum completo incluye también `new`, `select`, `filter`, `subForm`, `bulkEditForm`, etc.
- **`createResource()`**: crea el recurso de datos. `MultiRecordResource` se utiliza para obtener varios registros.
- **`this.resource.getData()`**: obtiene los datos de la tabla.

## Ejemplo de TableBlockModel

`TableBlockModel` hereda de `CollectionBlockModel` y es el bloque de tabla completo integrado en NocoBase: trae columnas, barra de acciones, paginación, ordenación, etc. Es lo que se obtiene cuando un usuario elige "Table" desde "Añadir bloque".

Por lo general, si el `TableBlockModel` integrado cumple los requisitos, el usuario lo añade directamente desde la interfaz y el desarrollador no tiene que hacer nada. Solo es necesario heredarlo cuando quiera **personalizarlo sobre la base de TableBlockModel**, por ejemplo:

- Sobrescribir `customModelClasses` para reemplazar el grupo de acciones o el modelo de columnas integrados.
- Restringir el bloque a una colección concreta con `filterCollection`.
- Registrar Flows adicionales para añadir opciones de configuración personalizadas.

```tsx
// Ejemplo: bloque de tabla restringido únicamente a la colección todoItems
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Para un ejemplo completo de personalización de `TableBlockModel`, consulte [Crear un plugin de gestión de datos full-stack](../examples/fullstack-plugin).

## Registrar el bloque

En el `load()` del Plugin:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        loader: () => import('./models/SimpleBlockModel'),
      },
      ManyRecordBlockModel: {
        loader: () => import('./models/ManyRecordBlockModel'),
      },
    });
  }
}
```

Tras el registro, al hacer clic en "Añadir bloque" en la interfaz de NocoBase verá sus bloques personalizados.

## Código fuente completo

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block): ejemplo de BlockModel.
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-collection-block): ejemplo de CollectionBlockModel.

## Enlaces relacionados

- [Tutorial: crear un bloque de presentación personalizado](../examples/custom-block): construir desde cero un bloque BlockModel configurable.
- [Tutorial: crear un plugin de gestión de datos full-stack](../examples/fullstack-plugin): TableBlockModel + campo personalizado + acción personalizada.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel y `registerFlow`.
- [Extensión de campos](./field): campos personalizados.
- [Extensión de acciones](./action): botones de acción personalizados.
- [Tabla rápida de Resource API](../../../api/flow-engine/resource.md): firmas completas de `MultiRecordResource` / `SingleRecordResource`.
- [Definición de Flow](../../../flow-engine/definitions/flow-definition.md): parámetros completos de `registerFlow` y eventos.
- [Documentación completa de FlowEngine](../../../flow-engine/index.md): referencia completa.
