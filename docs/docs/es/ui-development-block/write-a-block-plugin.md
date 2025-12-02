:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Escriba su primer plugin de bloque

Antes de empezar, le recomendamos leer "[Escriba su primer plugin](../plugin-development/write-your-first-plugin.md)" para aprender a crear rápidamente un plugin básico. A continuación, ampliaremos esa base añadiendo una funcionalidad de bloque (Block) sencilla.

## Paso 1: Cree el archivo del modelo de bloque

Cree un nuevo archivo en el directorio del plugin: `client/models/SimpleBlockModel.tsx`

## Paso 2: Escriba el contenido del modelo

Defina e implemente un modelo de bloque básico en el archivo, incluyendo su lógica de renderizado:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## Paso 3: Registre el modelo de bloque

Exporte el modelo recién creado en el archivo `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Paso 4: Active y pruebe el bloque

Después de habilitar el plugin, verá la nueva opción de bloque **Hello block** en el menú desplegable "Agregar bloque".

Demostración del efecto:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Paso 5: Añada capacidad de configuración al bloque

A continuación, añadiremos funcionalidad configurable al bloque a través de un **flujo de trabajo** (Flow), permitiendo a los usuarios editar el contenido del bloque en la interfaz.

Continúe editando el archivo `SimpleBlockModel.tsx`:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

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

Demostración del efecto:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Resumen

En este artículo, hemos visto cómo crear un plugin de bloque sencillo, incluyendo:

- Cómo definir e implementar un modelo de bloque
- Cómo registrar un modelo de bloque
- Cómo añadir funcionalidad configurable a un bloque mediante un flujo de trabajo (Flow)

Referencia del código fuente completo: [Ejemplo de bloque simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)