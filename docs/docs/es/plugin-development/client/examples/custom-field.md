---
title: "Crear un componente de campo personalizado"
description: "Tutorial práctico: cree un componente de presentación de campo con ClickableFieldModel y enlácelo a una interface de campo."
keywords: "campo personalizado,FieldModel,ClickableFieldModel,bindModelToInterface,extensión de campos,NocoBase"
---

# Crear un componente de campo personalizado

En NocoBase, los componentes de campo se utilizan para mostrar y editar datos en tablas y formularios. Este ejemplo muestra cómo crear con `ClickableFieldModel` un componente de presentación personalizado: envuelve el valor entre corchetes `[]` y se enlaza a la interface de campo `input`.

:::tip Lectura previa

Se recomienda revisar antes los siguientes contenidos:

- [Crear el primer plugin](../../write-your-first-plugin): creación del plugin y estructura de directorios.
- [Plugin](../plugin): entrada del plugin y ciclo de vida de `load()`.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel.
- [FlowEngine → Extensión de campos](../flow-engine/field): introducción a FieldModel y ClickableFieldModel.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción y `tExpr()`.

:::

## Resultado final

Vamos a crear un componente de presentación de campo personalizado que:

- Hereda de `ClickableFieldModel` y personaliza la lógica de renderizado.
- Muestra el valor envuelto entre `[]`.
- Se enlaza, mediante `bindModelToInterface`, a los campos de tipo `input` (texto de una sola línea).

Tras activar el plugin, en un bloque de tabla localice una columna asociada a un campo de texto de una sola línea, abra el botón de configuración de la columna y, en el desplegable "Componente de campo", verá la opción `DisplaySimpleFieldModel`. Al seleccionarla, el valor de la columna se mostrará con formato `[valor]`.

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_20.08.48.mp4" type="video/mp4">
</video>

Código fuente completo en [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple). Para ejecutarlo en local:

```bash
yarn pm enable @nocobase-example/plugin-field-simple
```

A continuación se construye el plugin paso a paso.

## Paso 1: crear el esqueleto del plugin

Desde la raíz del repositorio:

```bash
yarn pm create @my-project/plugin-field-simple
```

Para más detalles, consulte [Crear el primer plugin](../../write-your-first-plugin).

## Paso 2: crear el modelo del campo

Cree `src/client-v2/models/DisplaySimpleFieldModel.tsx`. Es el núcleo del plugin: define cómo se renderiza el campo y a qué interface se enlaza.

```tsx
// src/client-v2/models/DisplaySimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    // this.context.record permite acceder al registro completo de la fila actual
    console.log('Registro actual:', this.context.record);
    console.log('Índice del registro actual:', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Establecer el nombre que aparece en el desplegable "Componente de campo"
DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

// Enlazar a la interface de campo 'input' (texto de una sola línea)
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Puntos clave:

- **`renderComponent(value)`**: recibe como parámetro el valor del campo y devuelve el JSX a renderizar.
- **`this.context.record`**: registro completo de la fila actual.
- **`this.context.recordIndex`**: índice de la fila actual.
- **`ClickableFieldModel`**: hereda de `FieldModel`, con interacción por clic.
- **`define({ label })`**: nombre que aparece en el desplegable "Componente de campo"; si se omite, se muestra el nombre de la clase.
- **`DisplayItemModel.bindModelToInterface()`**: enlaza el modelo de campo al tipo de interface (por ejemplo `input` para campos de texto de una sola línea), de forma que pueda elegirse este componente en los campos de ese tipo.

## Paso 3: añadir los archivos de traducción

Edite los archivos en `src/locale/` y añada las claves usadas en `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple field": "简单字段"
}
```

```json
// src/locale/en-US.json
{
  "Simple field": "Simple field"
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

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/DisplaySimpleFieldModel'),
      },
    });
  }
}

export default PluginFieldSimpleClient;
```

## Paso 5: activar el plugin

```bash
yarn pm enable @my-project/plugin-field-simple
```

Una vez activado, en un bloque de tabla localice una columna de campo de texto de una sola línea, abra el botón de configuración de la columna y, en el desplegable "Componente de campo", podrá cambiar al componente personalizado.

## Código fuente completo

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple): componente de campo personalizado completo.

## Resumen

Capacidades utilizadas en este ejemplo:

| Capacidad        | Uso                                              | Documentación                                 |
| ---------------- | ------------------------------------------------ | --------------------------------------------- |
| Renderizado de campo | `ClickableFieldModel` + `renderComponent(value)` | [FlowEngine → Extensión de campos](../flow-engine/field) |
| Enlazar a la interface | `DisplayItemModel.bindModelToInterface()`     | [FlowEngine → Extensión de campos](../flow-engine/field) |
| Registro de modelos | `this.flowEngine.registerModelLoaders()`       | [Plugin](../plugin)                           |

## Enlaces relacionados

- [Crear el primer plugin](../../write-your-first-plugin): crear el esqueleto desde cero.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel.
- [FlowEngine → Extensión de campos](../flow-engine/field): FieldModel, ClickableFieldModel, bindModelToInterface.
- [FlowEngine → Extensión de bloques](../flow-engine/block): bloques personalizados.
- [Component vs FlowModel](../component-vs-flow-model): cuándo usar FlowModel.
- [Plugin](../plugin): entrada del plugin y ciclo de vida.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción y `tExpr`.
- [Documentación completa de FlowEngine](../../../flow-engine/index.md): referencia completa.
