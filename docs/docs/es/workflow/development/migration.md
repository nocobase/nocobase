---
title: "Guía de migración de v1 a v2"
description: "Desarrollo de extensiones de flujo de trabajo: guía para migrar el código del lado del cliente de v1 a v2."
keywords: "flujo de trabajo,migración,v1,v2,NocoBase"
---

# Guía de migración de v1 a v2 del lado del cliente

Esta guía describe cómo migrar el código del lado del cliente de un plugin de extensión de flujo de trabajo de v1 a v2. El cambio principal en el cliente v2 es el reemplazo de las UIs de configuración declarativas con Formily Schema por un enfoque basado en Loader + componentes puros de React/antd.

## Visión general

### Cambios principales

1. **Cambios en las rutas de importación**: `@nocobase/plugin-workflow/client` → `@nocobase/plugin-workflow/client-v2`, clase base del plugin `@nocobase/client` → `@nocobase/client-v2`
2. **Cambios en el patrón de UI de configuración**: De objetos Formily Schema (`fieldset`) a componentes React con carga diferida mediante Loader (`FieldsetLoader`)
3. **Eliminación de las propiedades `scope`/`components`**: Ya no es necesario inyectar objetos scope o componentes en el Schema; simplemente impórtelos y úselos directamente en los componentes React

### Mapeo de rutas de importación

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client';

// v2
import { Plugin } from '@nocobase/client-v2';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client-v2';
```

## Reglas generales

### Patrón Loader

v2 utiliza propiedades de tipo `LoaderOf` para reemplazar el `fieldset` y otros objetos Formily Schema de v1. Un Loader es esencialmente una función que devuelve `Promise<{ default: ComponentType }>`, permitiendo la división de código y carga diferida mediante `import()` dinámico:

```ts
// v1: Formily Schema object
fieldset = {
  interval: {
    type: 'number',
    title: 'Interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: Loader pointing to a React component
FieldsetLoader = () => import('./MyConfig');
```

Si necesita apuntar a una exportación con nombre (en lugar de la exportación por defecto), use `.then()` para reasignar:

```ts
FieldsetLoader = () => import('./MyConfig').then((m) => ({ default: m.MyPresetConfig }));
```

### Sintaxis del componente de configuración

El componente cargado por un Loader es un componente de función React estándar que usa `Form.Item` de antd para construir formularios. Las rutas de campos usan consistentemente el formato de array anidado `['config', 'fieldName']`:

```tsx
// v1: Formily Schema
fieldset = {
  interval: {
    type: 'number',
    title: '{{t("Interval")}}',
    name: 'config.interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: React component
import { Form, InputNumber } from 'antd';

export default function MyConfig() {
  const { t } = useWorkflowTranslation();

  return (
    <Form.Item
      name={['config', 'interval']}
      label={t('Interval')}
      initialValue={60000}
    >
      <InputNumber />
    </Form.Item>
  );
}
```

## Migración de disparadores

### Tabla de mapeo de propiedades

| Propiedad v1 | Propiedad v2 | Descripción |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Formulario de configuración del disparador |
| `presetFieldset` | `PresetFieldsetLoader` | Formulario preconfigurado al crear |
| `triggerFieldset` | `TriggerFieldsetLoader` | Formulario de entrada para ejecución manual |
| `scope` | Eliminado | Ya no es necesario; importe directamente en el componente |
| `components` | Eliminado | Ya no es necesario; importe directamente en el componente |
| `view` | Eliminado | |
| — | `validate(config)` | Nuevo; validación de configuración |
| — | `createDefaultConfig()` | Nuevo; proporciona valores de configuración por defecto |

### Ejemplo de migración

**Sintaxis v1:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';
  fieldset = {
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionSelect',
      required: true,
    },
    mode: {
      type: 'number',
      title: '{{t("Mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { label: '{{t("Created")}}', value: 1 },
          { label: '{{t("Updated")}}', value: 2 },
        ],
      },
    },
  };
  scope = { /* ... */ };
  components = { CollectionSelect };
}
```

**Sintaxis v2:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

export default function MyTriggerConfig() {
  return (
    <>
      <Form.Item name={['config', 'collection']} label="Collection">
        <CollectionCascader disabled />
      </Form.Item>
      <Form.Item name={['config', 'mode']} label="Mode">
        <Select
          options={[
            { label: 'Created', value: 1 },
            { label: 'Updated', value: 2 },
          ]}
        />
      </Form.Item>
    </>
  );
}
```

### Registro del plugin

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin);
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}

// v2
import { Plugin } from '@nocobase/client-v2';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}
```

## Migración de nodos

### Tabla de mapeo de propiedades

| Propiedad v1 | Propiedad v2 | Descripción |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | Formulario del cajón de configuración del nodo |
| `presetFieldset` | `PresetFieldsetLoader` | Formulario preconfigurado al crear |
| `Component` | `ComponentLoader` | Renderizado personalizado del nodo en el lienzo |
| `scope` | Eliminado | Ya no es necesario; importe directamente en el componente |
| `components` | Eliminado | Ya no es necesario; importe directamente en el componente |
| `view` | Eliminado | |
| — | `createDefaultConfig()` | Nuevo; proporciona valores de configuración por defecto |

### Ejemplo de migración

**Sintaxis v1:**

```ts
import WorkflowPlugin, { Instruction } from '@nocobase/plugin-workflow/client';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    digit: {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': { min: 1, max: 10 },
      default: 6,
    },
  };
  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

**Sintaxis v2:**

```ts
import { Instruction } from '@nocobase/plugin-workflow/client-v2';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';

  FieldsetLoader = () => import('./components/RandomStringConfig');

  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

```tsx
// components/RandomStringConfig.tsx
import { Form, InputNumber } from 'antd';

export default function RandomStringConfig() {
  return (
    <Form.Item
      name={['config', 'digit']}
      label="Digit"
      initialValue={6}
      rules={[{ required: true }]}
    >
      <InputNumber min={1} max={10} />
    </Form.Item>
  );
}
```

## Otras notas

### Partes sin cambios

Las siguientes propiedades y métodos tienen esencialmente las mismas firmas en v1 y v2, y pueden mantenerse tal cual durante la migración:

- `useVariables(node/config, options)` — Proporciona opciones de variables
- `useScopeVariables(node, options)` — Proporciona variables de ámbito de rama
- `isAvailable(ctx)` — Verificación de disponibilidad del nodo (el `NodeAvailableContext` de v2 añade una nueva propiedad `engine`)

### Nuevas propiedades en v2

- `getCreateModelMenuItem` — Define la configuración para crear elementos de menú de sub-modelos para nodos/disparadores en el lienzo v2
- `useTempAssociationSource` — Proporciona información de fuente de datos de asociación temporal
- `validate(config)` — Validación de configuración del disparador (solo disparadores)
- `branching` — Declara si el nodo es un nodo de ramificación (solo nodos)
- `end` — Declara si el nodo es un nodo terminal (solo nodos)
- `testable` — Declara si el nodo soporta ejecuciones de prueba (solo nodos)

### Consistencia semántica de valores

Al migrar, asegúrese de que los valores de formulario producidos por los componentes v2 sean consistentes con v1, especialmente la forma del payload durante la ejecución manual. Por ejemplo, si el formulario de ejecución manual de v1 almacena un objeto de registro completo, la versión v2 debe mantener la misma estructura de valores en lugar de almacenar solo la clave primaria.
