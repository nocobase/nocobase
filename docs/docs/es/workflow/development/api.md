:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

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

| Parámetro     | Tipo                                                        | Descripción                                 |
| ------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Constructor                                 |
| `on?`         | `(workflow: WorkflowModel): void`                           | Manejador de eventos después de habilitar un flujo de trabajo |
| `off?`        | `(workflow: WorkflowModel): void`                           | Manejador de eventos después de deshabilitar un flujo de trabajo |

`on`/`off` se utilizan para registrar/desregistrar oyentes de eventos cuando un flujo de trabajo se habilita/deshabilita. El parámetro pasado es la instancia del flujo de trabajo correspondiente al disparador, que puede procesarse según la configuración. Algunos tipos de disparadores que ya tienen eventos escuchados globalmente pueden no necesitar implementar estos dos métodos. Por ejemplo, en un disparador programado, puede registrar un temporizador en `on` y desregistrarlo en `off`.

### `Instruction`

Clase base para tipos de instrucción, utilizada para extender tipos de instrucción personalizados.

| Parámetro   | Tipo                                                            | Descripción                                                               |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Constructor                                                               |
| `run`       | `Runner`                                                        | Lógica de ejecución para la primera entrada al nodo                       |
| `resume?`   | `Runner`                                                        | Lógica de ejecución para entrar al nodo después de reanudar desde una interrupción |
| `getScope?` | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Proporciona el contenido de la variable local para la rama generada por el nodo correspondiente |

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

| Constante                 | Significado                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| `JOB_STATUS.PENDING`      | Pendiente: La ejecución ha llegado a este nodo, pero la instrucción requiere que se suspenda y espere. |
| `JOB_STATUS.RESOLVED`     | Completado con éxito                                                     |
| `JOB_STATUS.FAILED`       | Fallido: La ejecución de este nodo no cumplió las condiciones configuradas. |
| `JOB_STATUS.ERROR`        | Error: Ocurrió un error no manejado durante la ejecución de este nodo.   |
| `JOB_STATUS.ABORTED`      | Abortado: La ejecución de este nodo fue terminada por otra lógica después de estar en estado pendiente. |
| `JOB_STATUS.CANCELED`     | Cancelado: La ejecución de este nodo fue cancelada manualmente después de estar en estado pendiente. |
| `JOB_STATUS.REJECTED`     | Rechazado: La continuación de este nodo fue rechazada manualmente después de estar en estado pendiente. |
| `JOB_STATUS.RETRY_NEEDED` | No se ejecutó correctamente, se necesita reintento.                      |

## Lado del cliente

Las APIs disponibles en la estructura del paquete del lado del cliente se muestran en el siguiente código:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Registra el panel de configuración correspondiente al tipo de disparador.

**Firma**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parámetros**

| Parámetro | Tipo                        | Descripción                                              |
| --------- | --------------------------- | -------------------------------------------------------- |
| `type`    | `string`                    | Identificador del tipo de disparador, consistente con el identificador utilizado para el registro. |
| `trigger` | `typeof Trigger \| Trigger` | Tipo o instancia del disparador                          |

#### `registerInstruction()`

Registra el panel de configuración correspondiente al tipo de nodo.

**Firma**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parámetros**

| Parámetro     | Tipo                                | Descripción                                              |
| ------------- | ----------------------------------- | -------------------------------------------------------- |
| `type`        | `string`                            | Identificador del tipo de nodo, consistente con el identificador utilizado para el registro. |
| `instruction` | `typeof Instruction \| Instruction` | Tipo o instancia de la instrucción                       |

#### `registerInstructionGroup()`

Registra un grupo de tipos de nodo. NocoBase proporciona 4 grupos de tipos de nodo por defecto:

*   `'control'`: Clases de control
*   `'collection'`: Operaciones de colección
*   `'manual'`: Procesamiento manual
*   `'extended'`: Otras extensiones

Si necesita extender otros grupos, puede utilizar este método para registrarlos.

**Firma**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parámetros**

| Parámetro | Tipo               | Descripción                                              |
| --------- | ----------------- | -------------------------------------------------------- |
| `type`    | `string`          | Identificador del grupo de nodos, consistente con el identificador utilizado para el registro. |
| `group`   | `{ label: string }` | Información del grupo, actualmente solo incluye el título. |

**Ejemplo**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Clase base para disparadores, utilizada para extender tipos de disparadores personalizados.

| Parámetro       | Tipo                                                             | Descripción                                                              |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `title`         | `string`                                                         | Nombre del tipo de disparador                                            |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | Colección de elementos de configuración del disparador                   |
| `scope?`        | `{ [key: string]: any }`                                         | Colección de objetos que pueden usarse en el Schema del elemento de configuración |
| `components?`   | `{ [key: string]: React.FC }`                                    | Colección de componentes que pueden usarse en el Schema del elemento de configuración |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Accesor de valores para los datos de contexto del disparador             |

-   Si `useVariables` no está configurado, significa que este tipo de disparador no proporciona una función de recuperación de valores, y los datos de contexto del disparador no se pueden seleccionar en los nodos del flujo.

### `Instruction`

Clase base para instrucciones, utilizada para extender tipos de nodos personalizados.

| Parámetro          | Tipo                                                    | Descripción                                                                                              |
| ------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `group`            | `string`                                                | Identificador del grupo de tipos de nodo, las opciones actuales son: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`         | `Record<string, ISchema>`                               | Colección de elementos de configuración del nodo                                                         |
| `scope?`           | `Record<string, Function>`                              | Colección de objetos que pueden usarse en el Schema del elemento de configuración                        |
| `components?`      | `Record<string, React.FC>`                              | Colección de componentes que pueden usarse en el Schema del elemento de configuración                    |
| `Component?`       | `React.FC`                                              | Componente de renderizado personalizado para el nodo                                                     |
| `useVariables?`    | `(node, options: UseVariableOptions) => VariableOption` | Método para que el nodo proporcione opciones de variables de nodo                                        |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Método para que el nodo proporcione opciones de variables locales de rama                                |
| `useInitializers?` | `(node) => SchemaInitializerItemType`                   | Método para que el nodo proporcione opciones de inicializadores                                          |
| `isAvailable?`     | `(ctx: NodeAvailableContext) => boolean`                | Método para determinar si el nodo está disponible                                                        |

**Tipos relacionados**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

-   Si `useVariables` no está configurado, significa que este tipo de nodo no proporciona una función de recuperación de valores, y los datos de resultado de este tipo de nodo no se pueden seleccionar en los nodos del flujo. Si el valor resultante es único (no seleccionable), puede devolver un contenido estático que exprese la información correspondiente (consulte: [código fuente del nodo de cálculo](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Si necesita que sea seleccionable (por ejemplo, una propiedad de un objeto), puede personalizar la salida del componente de selección correspondiente (consulte: [código fuente del nodo de creación de datos](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
-   `Component` es un componente de renderizado personalizado para el nodo. Cuando el renderizado predeterminado del nodo no es suficiente, puede anularlo y usarlo completamente para un renderizado de vista de nodo personalizado. Por ejemplo, si necesita proporcionar más botones de acción u otras interacciones para el nodo de inicio de un tipo de rama, deberá usar este método (consulte: [código fuente de la rama paralela](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
-   `useInitializers` se utiliza para proporcionar un método para inicializar bloques. Por ejemplo, en un nodo manual, puede inicializar bloques de usuario relacionados basándose en los nodos anteriores. Si se proporciona este método, estará disponible al inicializar bloques en la configuración de la interfaz del nodo manual (consulte: [código fuente del nodo de creación de datos](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
-   `isAvailable` se utiliza principalmente para determinar si un nodo puede usarse (añadirse) en el entorno actual. El entorno actual incluye el flujo de trabajo actual, los nodos anteriores y el índice de la rama actual.