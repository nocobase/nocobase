---
title: "Extensión de campos"
description: "Desarrollo de extensiones de campo en NocoBase: clases base FieldModel y ClickableFieldModel, renderizado de campos y enlace a la interface de campo."
keywords: "extensión de campos,Field,FieldModel,ClickableFieldModel,renderComponent,bindModelToInterface,NocoBase"
---

# Extensión de campos

En NocoBase, los **componentes de campo (Field)** se utilizan para mostrar y editar datos en tablas y formularios. Heredando de las clases base relacionadas con FieldModel puede personalizar la forma de renderizado: presentar un dato con un formato especial o utilizar un componente propio para editarlo.

## Ejemplo: campo de presentación personalizado

El siguiente ejemplo crea un campo de presentación sencillo que envuelve el valor entre corchetes `[]`:

![20260407201138](https://static-docs.nocobase.com/20260407201138.png)

```tsx
// models/SimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    // this.context.record permite acceder al registro completo de la fila actual
    console.log('Registro actual:', this.context.record);
    console.log('Índice del registro actual:', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Enlazar al tipo de interface de campo 'input'
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Puntos clave:

- **`renderComponent(value)`**: recibe como parámetro el valor del campo y devuelve el JSX a renderizar.
- **`this.context.record`**: registro completo de la fila actual.
- **`this.context.recordIndex`**: índice de la fila actual.
- **`ClickableFieldModel`**: hereda de `FieldModel`, con capacidad de interacción por clic.
- **`DisplayItemModel.bindModelToInterface()`**: enlaza el modelo al tipo de interface de campo (por ejemplo `input` para campos de texto de una sola línea), de modo que pueda elegirse este componente de presentación en los campos de ese tipo.

## Registrar el campo

En el `load()` del Plugin, regístrelo con `registerModelLoaders` para carga bajo demanda:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/SimpleFieldModel'),
      },
    });
  }
}
```

Tras el registro, en un bloque de tabla localice una columna del tipo correspondiente (por ejemplo, `input` para campo de texto de una sola línea) y, desde el botón de configuración de la columna, en el menú desplegable "Componente de campo" podrá cambiar al componente personalizado. Para un tutorial completo, consulte [Crear un componente de campo personalizado](../examples/custom-field).

![20260407201221](https://static-docs.nocobase.com/20260407201221.png)

## Código fuente completo

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple): ejemplo de componente de campo personalizado.

## Enlaces relacionados

- [Tutorial: crear un componente de campo personalizado](../examples/custom-field): construir desde cero un componente de presentación de campo.
- [Tutorial: crear un plugin de gestión de datos full-stack](../examples/fullstack-plugin): aplicación real de un campo personalizado en un plugin completo.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel.
- [Extensión de bloques](./block): bloques personalizados.
- [Extensión de acciones](./action): botones de acción personalizados.
- [Definición de Flow](../../../flow-engine/definitions/flow-definition.md): parámetros completos de `registerFlow` y eventos.
- [Documentación completa de FlowEngine](../../../flow-engine/index.md): referencia completa.
