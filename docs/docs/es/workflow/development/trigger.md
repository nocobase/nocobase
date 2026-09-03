---
title: "Extender tipos de disparadores"
description: "Extensión de tipos de disparadores: desarrollo personalizado de disparadores, interfaz de configuración, lógica de activación, referencia de la API."
keywords: "flujo de trabajo,extensión de disparadores,disparadores personalizados,desarrollo de disparadores,NocoBase"
---

# Extender tipos de disparadores

Cada **flujo de trabajo** debe configurarse con un disparador específico, que actúa como el punto de entrada para iniciar la ejecución del proceso.

Un tipo de disparador generalmente representa un evento específico del entorno del sistema. Durante el ciclo de vida de ejecución de una aplicación, cualquier componente que ofrezca eventos a los que se pueda suscribir puede utilizarse para definir un tipo de disparador. Por ejemplo, la recepción de solicitudes, operaciones en **colecciones** de datos o tareas programadas.

Los tipos de disparadores se registran en la tabla de disparadores del **plugin** mediante un identificador de cadena. El **plugin** de **flujo de trabajo** incluye varios disparadores predefinidos:

- `'collection'`: Se activa por operaciones en **colecciones** de datos.
- `'schedule'`: Se activa por tareas programadas.
- `'action'`: Se activa por eventos posteriores a una acción.


Los tipos de disparadores extendidos deben tener identificadores únicos. La implementación para suscribir/cancelar la suscripción del disparador se registra en el lado del servidor, y la implementación de la interfaz de configuración se registra en el lado del cliente.

## Lado del servidor

Cualquier disparador debe heredar de la clase base `Trigger` e implementar los métodos `on` y `off`. Estos métodos se utilizan para suscribirse y cancelar la suscripción a eventos específicos del entorno, respectivamente. Dentro del método `on`, deberá llamar a `this.workflow.trigger()` en la función de *callback* del evento específico para finalmente activar el evento. Además, en el método `off`, deberá realizar las tareas de limpieza necesarias para cancelar la suscripción.

`this.workflow` es la instancia del **plugin** de **flujo de trabajo** que se pasa al constructor de la clase base `Trigger`.

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

Luego, en el **plugin** que extiende el **flujo de trabajo**, registre la instancia del disparador en el motor del **flujo de trabajo**:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

Una vez que el servidor se inicie y cargue, el disparador de tipo `'interval'` podrá añadirse y ejecutarse.

## Lado del cliente

La parte del lado del cliente se encarga principalmente de proporcionar una interfaz de configuración basada en los elementos de configuración que requiere cada tipo de disparador. Cada tipo de disparador también debe registrar su configuración de tipo correspondiente en el **plugin** de **flujo de trabajo**.

La interfaz de configuración del disparador se define mediante un Loader (función de carga diferida), que apunta a un componente React simple que construye el formulario utilizando `Form.Item` de antd.

### El disparador más sencillo

Por ejemplo, para el disparador de temporizador por intervalo descrito anteriormente, defina el elemento de configuración de tiempo de intervalo (`interval`) necesario en el formulario de la interfaz de configuración:

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';

  // Trigger config form (lazy-loaded component)
  FieldsetLoader = () => import('./IntervalConfig');

  // Config validation
  validate(config) {
    return Boolean(config?.interval);
  }
}
```

Aquí, `FieldsetLoader` es una función que devuelve `Promise<{ default: ComponentType }>`, implementando la carga diferida mediante `import()` dinámico. El componente al que apunta es un componente de función React estándar:

```tsx
// IntervalConfig.tsx
import { Form, InputNumber } from 'antd';

export default function IntervalConfig() {
  return (
    <Form.Item
      name={['config', 'interval']}
      label="Interval"
      initialValue={60000}
      rules={[{ required: true }]}
    >
      <InputNumber min={1000} />
    </Form.Item>
  );
}
```

Tenga en cuenta que el `name` del campo del formulario utiliza el formato de array anidado `['config', 'fieldName']`, que es la convención estándar de antd Form.

### Múltiples interfaces de configuración

Un disparador puede proporcionar múltiples interfaces de configuración para diferentes escenarios:

- `PresetFieldsetLoader` — Formulario preconfigurado al crear un flujo de trabajo (generalmente contiene solo los campos obligatorios)
![PresetFieldsetLoader](https://static-docs.nocobase.com/20260701152711.png)

- `FieldsetLoader` — Formulario completo de configuración del disparador (se muestra en el cajón de configuración)
![FieldsetLoader](https://static-docs.nocobase.com/20260701152822.png)

- `TriggerFieldsetLoader` — Formulario de entrada para la ejecución manual
![FieldsetLoader](https://static-docs.nocobase.com/20260701152846.png)

Cuando un Loader necesita apuntar a una exportación con nombre (en lugar de la exportación por defecto) en un archivo, use `.then()` para reasignar:

```ts
class MyTrigger extends Trigger {
  title = 'My trigger';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }

  createDefaultConfig() {
    return { mode: 1 };
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

// Preset form for creation (named export)
export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

// Full config form (default export)
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

### Registrar el disparador

Registre el tipo de disparador en la instancia del **plugin** de **flujo de trabajo** dentro del **plugin** extendido:

```ts
import { Plugin } from '@nocobase/client-v2';
import MyTrigger from './MyTrigger';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Después de esto, el nuevo tipo de disparador será visible en la interfaz de configuración del **flujo de trabajo**.

:::info{title=Nota}
El identificador del tipo de disparador registrado en el lado del cliente debe ser consistente con el del lado del servidor, de lo contrario, se producirán errores.
:::

Para un ejemplo completo del mundo real, consulte: [Código fuente de CollectionTrigger](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/triggers/collection/index.tsx)

Para obtener más detalles sobre cómo definir tipos de disparadores, consulte la sección [Referencia de la API de flujo de trabajo](./api).

:::info{title=Nota}
Si anteriormente usaba el código del lado del cliente heredado (v1) y desea migrar a la nueva versión v2, consulte la [Guía de migración de v1 a v2](./migration).
:::
