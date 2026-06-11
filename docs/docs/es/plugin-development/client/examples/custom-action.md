---
title: "Crear un botón de acción personalizado"
description: "Tutorial práctico: cree botones de acción personalizados con ActionModel + ActionSceneEnum, con soporte para acciones a nivel de tabla y de registro."
keywords: "acción personalizada,ActionModel,ActionSceneEnum,botón de acción,NocoBase"
---

# Crear un botón de acción personalizado

En NocoBase, una acción (Action) es un botón dentro de un bloque que dispara la lógica de negocio: por ejemplo "Nuevo", "Editar" o "Eliminar". Este ejemplo muestra cómo crear botones de acción personalizados con `ActionModel` y cómo controlar dónde aparecen mediante `ActionSceneEnum`.

:::tip Lectura previa

Se recomienda revisar antes los siguientes contenidos para que el desarrollo resulte más fluido:

- [Crear el primer plugin](../../write-your-first-plugin): creación de un plugin y estructura de directorios.
- [Plugin](../plugin): entrada del plugin y ciclo de vida de `load()`.
- [FlowEngine → Extensión de acciones](../flow-engine/action): introducción a ActionModel y ActionSceneEnum.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción y uso de `tExpr()`.

:::

## Resultado final

Crearemos tres botones de acción personalizados, uno por escenario:

- **Acción a nivel de tabla** (`collection`): aparece en la barra de acciones superior del bloque, junto al botón "Nuevo".
- **Acción a nivel de registro** (`record`): aparece en la columna de acciones de cada fila, junto a "Editar" y "Eliminar".
- **Aplicable a ambos** (`both`): aparece en los dos escenarios.

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

Código fuente completo en [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action). Para ejecutarlo en local:

```bash
yarn pm enable @nocobase-example/plugin-simple-action
```

A continuación se construye el plugin paso a paso desde cero.

## Paso 1: crear el esqueleto del plugin

Desde la raíz del repositorio:

```bash
yarn pm create @my-project/plugin-simple-action
```

Para más detalles, consulte [Crear el primer plugin](../../write-your-first-plugin).

## Paso 2: crear los modelos de acción

Cada acción debe declarar su escenario mediante la propiedad `static scene`:

| Escenario  | Valor                        | Descripción                                                |
| ---------- | ---------------------------- | ---------------------------------------------------------- |
| collection | `ActionSceneEnum.collection` | Sobre la tabla, por ejemplo el botón "Nuevo"               |
| record     | `ActionSceneEnum.record`     | Sobre un registro concreto, por ejemplo "Editar", "Eliminar" |
| both       | `ActionSceneEnum.both`       | Disponible en ambos escenarios                             |

### Acción a nivel de tabla

Cree `src/client-v2/models/SimpleCollectionActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});

// Escuchar el evento de clic con registerFlow y dar feedback con ctx.message
SimpleCollectionActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple collection action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Collection action clicked'));
      },
    },
  },
});
```

### Acción a nivel de registro

Cree `src/client-v2/models/SimpleRecordActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});

// Las acciones a nivel de registro pueden acceder al dato y al índice de la fila a través de ctx.model.context
SimpleRecordActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple record action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        const id = record?.id;
        ctx.message.info(ctx.t('Record action clicked, record ID: {{id}}, row index: {{index}}', { id, index }));
      },
    },
  },
});
```

### Acción aplicable a ambos escenarios

Cree `src/client-v2/models/SimpleBothActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});

SimpleBothActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple both action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.info(ctx.t('Both action clicked'));
      },
    },
  },
});
```

Las tres variantes tienen la misma estructura; solo cambian el valor de `static scene` y el texto del botón. Cada botón escucha el evento de clic mediante `registerFlow({ on: 'click' })` y muestra un mensaje con `ctx.message` para que el usuario perciba que se ha activado.

## Paso 3: añadir los archivos de traducción

Edite los archivos en `src/locale/`:

```json
// src/locale/zh-CN.json
{
  "Simple collection action": "简单数据表操作",
  "Simple record action": "简单记录操作",
  "Simple both action": "简单通用操作",
  "Collection action clicked": "数据表操作被点击了",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "记录操作被点击了，记录 ID：{{id}}，行索引：{{index}}",
  "Both action clicked": "通用操作被点击了"
}
```

```json
// src/locale/en-US.json
{
  "Simple collection action": "Simple collection action",
  "Simple record action": "Simple record action",
  "Simple both action": "Simple both action",
  "Collection action clicked": "Collection action clicked",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "Record action clicked, record ID: {{id}}, row index: {{index}}",
  "Both action clicked": "Both action clicked"
}
```

:::warning Atención

La primera vez que añada un archivo de idioma debe reiniciar la aplicación para que surta efecto.

:::

Para más detalles sobre los archivos de traducción y `tExpr()`, consulte [Internacionalización (i18n)](../component/i18n).

## Paso 4: registrar en el plugin

Edite `src/client-v2/plugin.tsx` y registre con `registerModelLoaders` para carga bajo demanda:

```ts
// src/client-v2/plugin.tsx
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

export default PluginSimpleActionClient;
```

## Paso 5: activar el plugin

```bash
yarn pm enable @my-project/plugin-simple-action
```

Una vez activado, podrá añadir estos botones desde "Configurar acciones" en el bloque de tabla.

## Código fuente completo

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action): ejemplo completo de los tres escenarios de acción.

## Resumen

Capacidades utilizadas en este ejemplo:

| Capacidad     | Uso                                              | Documentación                                  |
| ------------- | ------------------------------------------------ | ---------------------------------------------- |
| Botón de acción | `ActionModel` + `static scene`                 | [FlowEngine → Extensión de acciones](../flow-engine/action) |
| Escenario     | `ActionSceneEnum.collection / record / both / all` | [FlowEngine → Extensión de acciones](../flow-engine/action) |
| Registro en menú | `define({ label })`                           | [Visión general de FlowEngine](../flow-engine/index.md) |
| Registro de modelos | `this.flowEngine.registerModelLoaders()`   | [Plugin](../plugin)                            |
| Traducción diferida | `tExpr()`                                  | [Internacionalización (i18n)](../component/i18n) |

## Enlaces relacionados

- [Crear el primer plugin](../../write-your-first-plugin): crear el esqueleto desde cero.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel.
- [FlowEngine → Extensión de acciones](../flow-engine/action): ActionModel y ActionSceneEnum.
- [FlowEngine → Extensión de bloques](../flow-engine/block): bloques personalizados.
- [FlowEngine → Extensión de campos](../flow-engine/field): campos personalizados.
- [Component vs FlowModel](../component-vs-flow-model): cuándo usar FlowModel.
- [Plugin](../plugin): entrada del plugin y ciclo de vida.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción y uso de `tExpr`.
- [Documentación completa de FlowEngine](../../../flow-engine/index.md): referencia completa.
