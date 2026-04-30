---
title: "Extensión de acciones"
description: "Desarrollo de extensiones de acción en NocoBase: clase base ActionModel, escenarios de acción ActionSceneEnum y botones de acción personalizados."
keywords: "extensión de acciones,Action,ActionModel,ActionSceneEnum,botón de acción,NocoBase"
---

# Extensión de acciones

En NocoBase, una **acción (Action)** es un botón dentro de un bloque que dispara la lógica de negocio: por ejemplo "Nuevo", "Editar" o "Eliminar". Heredando de `ActionModel` puede añadir botones de acción personalizados.

## Escenarios de acción

Cada acción debe declarar el escenario en el que aparece mediante la propiedad estática `static scene`:

| Escenario  | Valor                        | Descripción                                                |
| ---------- | ---------------------------- | ---------------------------------------------------------- |
| collection | `ActionSceneEnum.collection` | Sobre la tabla de datos, por ejemplo el botón "Nuevo"      |
| record     | `ActionSceneEnum.record`     | Sobre un registro individual, por ejemplo "Editar", "Eliminar" |
| both       | `ActionSceneEnum.both`       | Disponible en ambos escenarios                             |
| all        | `ActionSceneEnum.all`        | Disponible en todos los escenarios (incluidos los especiales como diálogos) |

## Ejemplos

### Acción a nivel de tabla

Aplica a toda la tabla; aparece en la barra de acciones superior del bloque:

```tsx
// models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});
```

### Acción a nivel de registro

Aplica a un registro concreto; aparece en la columna de acciones de cada fila de la tabla:

```tsx
// models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});
```

### Aplicable a ambos escenarios

Si la acción no distingue escenarios, use `ActionSceneEnum.both`:

```tsx
// models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});
```

Las tres variantes tienen la misma estructura; solo cambia el valor de `static scene` y el texto del botón en `defaultProps`.

## Registrar la acción

En el `load()` del Plugin, regístrelas con `registerModelLoaders` para carga bajo demanda:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}
```

Tras el registro, podrá añadir sus botones personalizados desde "Configurar acciones" del bloque.

## Código fuente completo

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action): ejemplo completo de los tres escenarios de acción.

## Enlaces relacionados

- [Tutorial: crear un botón de acción personalizado](../examples/custom-action): construir desde cero los tres escenarios.
- [Tutorial: crear un plugin de gestión de datos full-stack](../examples/fullstack-plugin): aplicación real de acción personalizada + `ctx.viewer.dialog` en un plugin completo.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel.
- [Extensión de bloques](./block): bloques personalizados.
- [Extensión de campos](./field): componentes de campo personalizados.
- [Definición de Flow](../../../flow-engine/definitions/flow-definition.md): parámetros completos de `registerFlow` y eventos.
- [Documentación completa de FlowEngine](../../../flow-engine/index.md): referencia completa.
