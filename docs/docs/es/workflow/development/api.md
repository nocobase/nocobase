---
title: "Referencia de la API"
description: "Referencia de la API de extensión de flujos de trabajo: modelo de flujo de trabajo, contexto de ejecución de nodos, API de disparadores, paso de variables."
keywords: "flujo de trabajo,referencia de API,modelo de flujo de trabajo,contexto de nodos,API de disparadores,NocoBase"
---

# Referencia de la API

## Lado del servidor

Las APIs disponibles en la estructura del paquete del lado del servidor se muestran en el siguiente código:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Clase del plugin de flujo de trabajo.

Normalmente, durante la ejecución de la aplicación, puede obtener la instancia del plugin de flujo de trabajo (referida como `plugin` a continuación) llamando a `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` desde cualquier lugar donde pueda acceder a la instancia de la aplicación `app`.

#### `registerTrigger()`

Permite extender y registrar un nuevo tipo de disparador.

**Firma**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parámetros**

| Parámetro | Tipo                        | Descripción                      |
| --------- | --------------------------- | -------------------------------- |
| `type`    | `string`                    | Identificador del tipo de disparador |
| `trigger` | `typeof Trigger \| Trigger` | Tipo o instancia del disparador  |

**Ejemplo**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Permite extender y registrar un nuevo tipo de nodo.

**Firma**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parámetros**

| Parámetro     | Tipo                                | Descripción                     |
| ------------- | ----------------------------------- | ------------------------------- |
| `type`        | `string`                            | Identificador del tipo de instrucción |
| `instruction` | `typeof Instruction \| Instruction` | Tipo o instancia de la instrucción |

**Ejemplo**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Dispara un flujo de trabajo específico. Se utiliza principalmente en disparadores personalizados para activar el flujo de trabajo correspondiente cuando se detecta un evento personalizado específico.

**Firma**

`trigger(workflow: Workflow, context: any)`

**Parámetros**
| Parámetro  | Tipo          | Descripción                                |
| ---------- | ------------- | ------------------------------------------ |
| `workflow` | `WorkflowModel` | El objeto de flujo de trabajo a disparar     |
| `context`  | `object`      | Datos de contexto proporcionados al momento del disparo |

:::info{title=Nota}
`context` actualmente es un elemento requerido. Si no se proporciona, el flujo de trabajo no se disparará.
:::

**Ejemplo**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Reanuda la ejecución de un flujo de trabajo en espera con una tarea de nodo específica.

- Solo los flujos de trabajo en estado de espera (`EXECUTION_STATUS.STARTED`) pueden reanudarse.
- Solo las tareas de nodo en estado pendiente (`JOB_STATUS.PENDING`) pueden reanudarse.

**Firma**

`resume(job: JobModel)`

**Parámetros**

| Parámetro | Tipo       | Descripción              |
| --------- | ---------- | ------------------------ |
| `job`     | `JobModel` | El objeto de tarea actualizado |

:::info{title=Nota}
El objeto de tarea que se pasa es generalmente un objeto actualizado, y su `status` se actualiza normalmente a un valor diferente de `JOB_STATUS.PENDING`; de lo contrario, seguirá en espera.
:::

**Ejemplo**

Consulte el [código fuente](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99) para más detalles.

### `Trigger`

Clase base para disparadores, utilizada para extender tipos de disparadores personalizados.

```ts
import { Trigger } from '@nocobase/plugin-workflow';
```

| Parámetro     | Tipo                                                        | Descripción                                 |
| ------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Constructor                                 |
| `on?`         | `(workflow: WorkflowModel): void`                           | Manejador de eventos después de habilitar un flujo de trabajo |
| `off?`        | `(workflow: WorkflowModel): void`                           | Manejador de eventos después de deshabilitar un flujo de trabajo |

`on`/`off` se utilizan para registrar/desregistrar oyentes de eventos cuando un flujo de trabajo se habilita/deshabilita. El parámetro pasado es la instancia del flujo de trabajo correspondiente al disparador, que puede procesarse según la configuración. Algunos tipos de disparadores que ya tienen eventos escuchados globalmente pueden no necesitar implementar estos dos métodos. Por ejemplo, en un disparador programado, puede registrar un temporizador en `on` y desregistrarlo en `off`.

### `Instruction`

Clase base para tipos de instrucción, utilizada para extender tipos de instrucción personalizados.

```ts
import { Instruction } from '@nocobase/plugin-workflow';
```

| Parámetro     | Tipo                                                            | Descripción                                                               |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Constructor                                                               |
| `run`         | `Runner`                                                        | Lógica de ejecución para la primera entrada al nodo                       |
| `resume?`     | `Runner`                                                        | Lógica de ejecución para entrar al nodo después de reanudar desde una interrupción |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`  | Proporciona el contenido de la variable local para la rama generada por el nodo correspondiente |

**Tipos relacionados**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

Para `getScope`, puede consultar la [implementación del nodo de bucle](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), que se utiliza para proporcionar contenido de variables locales para las ramas.

### `EXECUTION_STATUS`

Tabla de constantes para los estados del plan de ejecución del flujo de trabajo, utilizada para identificar el estado actual del plan de ejecución correspondiente.

```ts
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
```

| Constante                       | Significado                  |
| ------------------------------- | ---------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | En cola                      |
| `EXECUTION_STATUS.STARTED`      | Iniciado                     |
| `EXECUTION_STATUS.RESOLVED`     | Completado con éxito         |
| `EXECUTION_STATUS.FAILED`       | Fallido                      |
| `EXECUTION_STATUS.ERROR`        | Error de ejecución           |
| `EXECUTION_STATUS.ABORTED`      | Abortado                     |
| `EXECUTION_STATUS.CANCELED`     | Cancelado                    |
| `EXECUTION_STATUS.REJECTED`     | Rechazado                    |
| `EXECUTION_STATUS.RETRY_NEEDED` | No se ejecutó correctamente, se necesita reintento |

Excepto por los tres primeros, todos los demás representan un estado de fallo, pero pueden usarse para describir diferentes motivos de fallo.

### `JOB_STATUS`

Tabla de constantes para los estados de las tareas de los nodos del flujo de trabajo, utilizada para identificar el estado actual de la tarea del nodo correspondiente. El estado generado por el nodo también afecta el estado de todo el plan de ejecución.

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';
```

| Constante                  | Significado                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| `JOB_STATUS.PENDING`      | Pendiente: La ejecución ha llegado a este nodo, pero la instrucción requiere que se suspenda y espere |
| `JOB_STATUS.RESOLVED`     | Completado con éxito                                                     |
| `JOB_STATUS.FAILED`       | Fallido: La ejecución de este nodo no cumplió las condiciones configuradas |
| `JOB_STATUS.ERROR`        | Error: Ocurrió un error no manejado durante la ejecución de este nodo    |
| `JOB_STATUS.ABORTED`      | Abortado: La ejecución de este nodo fue terminada por otra lógica después de estar en estado pendiente |
| `JOB_STATUS.CANCELED`     | Cancelado: La ejecución de este nodo fue cancelada manualmente después de estar en estado pendiente |
| `JOB_STATUS.REJECTED`     | Rechazado: La continuación de este nodo fue rechazada manualmente después de estar en estado pendiente |
| `JOB_STATUS.RETRY_NEEDED` | No se ejecutó correctamente, se necesita reintento                       |

## Lado del cliente

Las APIs disponibles en la estructura del paquete del lado del cliente se muestran en el siguiente código:

```ts
import PluginWorkflowClientV2, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client-v2';
```

### `PluginWorkflowClientV2`

Clase del plugin de flujo de trabajo del lado del cliente. Normalmente se obtiene mediante `this.app.pm.get('workflow')`.

#### `registerTrigger()`

Registra el panel de configuración correspondiente al tipo de disparador.

**Firma**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parámetros**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `type` | `string` | Identificador del tipo de disparador, consistente con el identificador registrado en el lado del servidor |
| `trigger` | `typeof Trigger \| Trigger` | Tipo o instancia del disparador |

#### `registerInstruction()`

Registra el panel de configuración correspondiente al tipo de nodo.

**Firma**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parámetros**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `type` | `string` | Identificador del tipo de nodo, consistente con el identificador registrado en el lado del servidor |
| `instruction` | `typeof Instruction \| Instruction` | Tipo o instancia de la instrucción |

#### `registerInstructionGroup()`

Registra un grupo de tipos de nodo. NocoBase proporciona 4 grupos de tipos de nodo por defecto:

* `'control'`: Control
* `'collection'`: Operaciones de colección
* `'manual'`: Procesamiento manual
* `'extended'`: Otras extensiones

Si necesita extender otros grupos, puede utilizar este método para registrarlos.

**Firma**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parámetros**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `type` | `string` | Identificador del grupo de nodos |
| `group` | `{ label: string }` | Información del grupo, actualmente solo incluye el título |

**Ejemplo**

```ts
import { Plugin } from '@nocobase/client-v2';

export default class YourPluginClient extends Plugin {
  async load() {
    const pluginWorkflow = this.app.pm.get('workflow');
    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

#### `isWorkflowSync()`

Determina si un flujo de trabajo está en modo síncrono.

**Firma**

`isWorkflowSync(workflow: object): boolean`

### `Trigger`

Clase base para disparadores, utilizada para extender tipos de disparadores personalizados.

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` | Nombre del tipo de disparador |
| `description?` | `string` | Descripción del tipo de disparador |
| `PresetFieldsetLoader?` | `LoaderOf` | Formulario de configuración preconfigurado al crear (carga diferida) |
| `FieldsetLoader?` | `LoaderOf` | Formulario completo de configuración del disparador (carga diferida) |
| `TriggerFieldsetLoader?` | `LoaderOf` | Formulario de entrada para ejecución manual (carga diferida) |
| `validate` | `(config: Record<string, unknown>) => boolean` | Validación de configuración; devuelve `true` si la configuración es válida |
| `createDefaultConfig?` | `() => Record<string, unknown>` | Proporciona valores de configuración por defecto |
| `useVariables?` | `(config, options?: UseVariableOptions) => VariableOption[] \| null` | Opciones de variables para los datos de contexto del disparador |
| `getCreateModelMenuItem?` | `(args) => SubModelItem \| SubModelItem[] \| null` | Elementos de menú para crear sub-modelos en el lienzo |
| `useTempAssociationSource?` | `(config, workflow?) => TriggerTempAssociationSource \| null` | Proporciona una fuente de datos de asociación temporal |

**Tipos relacionados**

```ts
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;
```

- Si `useVariables` no está configurado, significa que este tipo de disparador no proporciona una función de recuperación de valores, y los datos de contexto del disparador no se pueden seleccionar en los nodos del flujo de trabajo.

### `Instruction`

Clase base para instrucciones, utilizada para extender tipos de nodos personalizados.

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` | Nombre del tipo de nodo |
| `type` | `string` | Identificador del tipo de nodo |
| `group` | `string` | Identificador del grupo del tipo de nodo, opciones: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `description?` | `string` | Descripción del tipo de nodo |
| `icon?` | `JSX.Element` | Icono del nodo |
| `FieldsetLoader?` | `LoaderOf` | Formulario del cajón de configuración del nodo (carga diferida) |
| `PresetFieldsetLoader?` | `LoaderOf` | Formulario de configuración preconfigurado al crear (carga diferida) |
| `ComponentLoader?` | `LoaderOf<{ data: any }>` | Renderizado personalizado del nodo en el lienzo (carga diferida), se usa para nodos de ramificación y otros casos que requieren renderizado especial |
| `branching?` | `boolean \| object \| ((config) => boolean \| object)` | Declara si el nodo es un nodo de ramificación |
| `end?` | `boolean \| ((node) => boolean)` | Declara si el nodo es un nodo terminal |
| `testable?` | `boolean` | Declara si el nodo soporta ejecuciones de prueba |
| `createDefaultConfig?` | `() => object` | Proporciona valores de configuración por defecto |
| `useVariables?` | `(node, options?: UseVariableOptions) => VariableOption` | Método para que el nodo proporcione opciones de variables |
| `useScopeVariables?` | `(node, options?) => VariableOption[] \| MetaTreeNode[]` | Método para que el nodo proporcione opciones de variables de ámbito de rama |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | Método para determinar si el nodo está disponible |
| `getCreateModelMenuItem?` | `({ node, workflow }) => SubModelItem \| null` | Elementos de menú para crear sub-modelos en el lienzo |
| `useTempAssociationSource?` | `(node) => TempAssociationSource \| null` | Proporciona una fuente de datos de asociación temporal |

**Tipos relacionados**

```ts
export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Si `useVariables` no está configurado, significa que este tipo de nodo no proporciona una función de recuperación de valores, y los datos de resultado de este tipo de nodo no se pueden seleccionar en los nodos del flujo de trabajo. Si el valor resultante es singular (no seleccionable), puede devolver un contenido estático que exprese la información correspondiente (consulte: [código fuente del nodo de cálculo](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/calculation.tsx)). Si necesita que sea seleccionable (por ejemplo, una propiedad de un objeto), puede personalizar la salida del componente de selección correspondiente (consulte: [código fuente del nodo de consulta de datos](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/query.tsx)).
- `ComponentLoader` es un componente de renderizado personalizado para el nodo. Cuando el renderizado predeterminado del nodo no es suficiente, puede anularlo completamente para un renderizado de vista de nodo personalizado. Por ejemplo, para proporcionar renderizado de ramas adicional para nodos de tipo rama (consulte: [código fuente del nodo de condición](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/condition.tsx)).
- `isAvailable` se utiliza principalmente para determinar si un nodo puede usarse (añadirse) en el entorno actual. El entorno actual incluye la instancia del plugin de flujo de trabajo, el flujo de trabajo actual, los nodos anteriores y el índice de la rama actual.

### Componentes de entrada de variables

El flujo de trabajo proporciona un conjunto de componentes de entrada de variables para permitir a los usuarios seleccionar variables del flujo de trabajo en los formularios de configuración de nodos/disparadores.

```ts
import {
  WorkflowVariableInput,
  WorkflowVariableTextArea,
  WorkflowTypedVariableInput,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client-v2';
```

#### `WorkflowVariableInput`

Entrada de variable que permite seleccionar una variable y continuar escribiendo contenido. Adecuado para escenarios de entrada de una sola línea que requieren una combinación de referencias de variables y texto libre.

```tsx
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'target']} label="Target">
  <WorkflowVariableInput />
</Form.Item>
```

![WorkflowVariableInput](https://static-docs.nocobase.com/20260701160110.png)

**Props**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `value?` | `string` | Valor de la ruta de la variable, por ejemplo `{{$jobsMapByNodeKey.xxx.field}}` |
| `onChange?` | `(value: string) => void` | Callback de cambio de valor |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opciones de filtro de variables (filtrado por tipo, profundidad, etc.) |
| `disabled?` | `boolean` | Si está deshabilitado |
| `placeholder?` | `string` | Texto de marcador de posición |

#### `WorkflowVariableTextArea`

Área de texto multilínea que permite insertar referencias de variables en cualquier posición del cursor. Adecuado para escenarios de texto libre como cuerpo HTTP, texto de plantilla, etc.

```tsx
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'body']} label="Body">
  <WorkflowVariableTextArea autoSize={{ minRows: 5 }} />
</Form.Item>
```

![WorkflowVariableTextArea](https://static-docs.nocobase.com/20260701160242.png)

**Props**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `value?` | `string` | Valor del texto (puede contener referencias de variables) |
| `onChange?` | `(value: string) => void` | Callback de cambio de valor |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opciones de filtro de variables |
| `delimiters?` | `readonly [string, string]` | Delimitadores de variables, por defecto `['{{', '}}']` |

Hereda otros Props de `TextArea` de antd (como `autoSize`, `placeholder`, etc.).

#### `WorkflowTypedVariableInput`

Entrada con tipo que alterna entre los modos "constante" y "referencia de variable". En modo variable, solo puede seleccionar una variable; no puede continuar escribiendo después de la selección. En modo constante, se admiten cinco tipos: `string`, `number`, `boolean`, `date` y `object`.

```tsx
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'value']} label="Value">
  <WorkflowTypedVariableInput />
</Form.Item>
```

![WorkflowTypedVariableInput](https://static-docs.nocobase.com/20260701160608.png)

**Props**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opciones de filtro de variables |

Hereda otros Props de `TypedVariableInput` (excluyendo `extraNodes`, `metaTree`, `namespaces` que se usan internamente).

#### `WorkflowVariableWrapper`

Envoltorio genérico para sustituir diferentes componentes de entrada en diferentes contextos. Por ejemplo, cuando el mismo campo requiere diferentes métodos de entrada en la configuración del nodo disparador y en el cajón de configuración del nodo, puede usar este componente para envolver una entrada nativa en una entrada con modo variable intercambiable.

```tsx
import { WorkflowVariableWrapper } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'timeout']} label="Timeout">
  <WorkflowVariableWrapper
    render={({ value, onChange }) => (
      <InputNumber value={value} onChange={onChange} min={0} />
    )}
  />
</Form.Item>
```

**Props**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `value?` | `TValue \| string \| null` | Valor actual (valor constante o cadena de ruta de variable) |
| `onChange?` | `(value: TValue \| string \| null) => void` | Callback de cambio de valor |
| `variableOptions?` | `UseWorkflowVariableOptions` | Opciones de filtro de variables |
| `render` | `(props: { value?, onChange? }) => ReactNode` | Renderiza el componente de entrada nativo |
| `clearValue?` | `TValue \| null` | Valor inicial al cambiar del modo variable de vuelta al modo constante, por defecto `null` |

### Componentes relacionados con colecciones

El flujo de trabajo también proporciona un conjunto de componentes auxiliares relacionados con colecciones:

```ts
import {
  CollectionCascader,
  AppendsSelect,
  FieldsSelect,
  SortFieldsInput,
  PaginationFields,
} from '@nocobase/plugin-workflow/client-v2';
```

- `CollectionCascader` — Selector de colección con reconocimiento de fuente de datos (cascada)
- `AppendsSelect` — Selector de precarga de campos de asociación (selector de árbol)
- `FieldsSelect` — Multi-selector de campos de colección
- `SortFieldsInput` — Entrada de campo de ordenamiento
- `PaginationFields` — Elementos de formulario de parámetros de paginación
