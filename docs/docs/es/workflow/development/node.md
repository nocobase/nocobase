:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Extensión de tipos de nodo

El tipo de un nodo es, en esencia, una instrucción operativa. Diferentes instrucciones representan distintas operaciones que se ejecutan en el **flujo de trabajo**.

De forma similar a los disparadores (triggers), la extensión de los tipos de nodo se divide en dos partes: el lado del servidor y el lado del cliente. El lado del servidor debe implementar la lógica para la instrucción registrada, mientras que el lado del cliente necesita proporcionar la configuración de la interfaz para los parámetros del nodo donde se encuentra la instrucción.

## Lado del servidor

### La instrucción de nodo más sencilla

El contenido principal de una instrucción es una función, lo que significa que el método `run` en la clase de la instrucción debe implementarse para ejecutar su lógica. Dentro de esta función, puede realizar cualquier operación necesaria, como operaciones de base de datos, operaciones de archivos, llamadas a APIs de terceros, etc.

Todas las instrucciones deben derivar de la clase base `Instruction`. La instrucción más sencilla solo necesita implementar una función `run`:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

Y registre esta instrucción en el **plugin** de **flujo de trabajo**:

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

El valor de estado (`status`) en el objeto de retorno de la instrucción es obligatorio y debe ser uno de los valores de la constante `JOB_STATUS`. Este valor determinará el flujo del procesamiento posterior para este nodo en el **flujo de trabajo**. Normalmente, se utiliza `JOB_STATUS.RESOVLED`, lo que indica que el nodo se ha ejecutado correctamente y la ejecución continuará con los siguientes nodos. Si necesita guardar un valor de resultado de antemano, también puede llamar al método `processor.saveJob` y devolver su objeto de retorno. El ejecutor generará un registro de resultado de ejecución basado en este objeto.

### Valor de resultado del nodo

Si hay un resultado de ejecución específico, especialmente datos preparados para ser utilizados por nodos posteriores, puede devolverlo a través de la propiedad `result` y guardarlo en el objeto de tarea del nodo:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

Aquí, `node.config` es el elemento de configuración del nodo, que puede ser cualquier valor requerido. Se guardará como un campo de tipo `JSON` en el registro del nodo correspondiente en la base de datos.

### Manejo de errores de la instrucción

Si pueden ocurrir excepciones durante la ejecución, puede capturarlas de antemano y devolver un estado de fallo:

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

Si no se capturan las excepciones predecibles, el motor del **flujo de trabajo** las capturará automáticamente y devolverá un estado de error para evitar que las excepciones no capturadas bloqueen el programa.

### Nodos asíncronos

Cuando un nodo necesita esperar a que se complete una operación externa antes de continuar el flujo de trabajo (como solicitudes HTTP, callbacks de pagos de terceros u otras operaciones que consumen tiempo o no devuelven resultados de inmediato), la tarea debe guardarse primero con el estado `JOB_STATUS.PENDING` para suspender la ejecución actual, y luego reanudarse mediante `resume` una vez completada la operación. Cualquier instrucción que use lógica de suspensión también debe implementar el método `resume`; de lo contrario, el flujo de trabajo no puede reanudarse.

El patrón de implementación recomendado es el siguiente:

```ts
import { Instruction, JOB_STATUS, FlowNodeModel, IJob } from '@nocobase/plugin-workflow';

export class AsyncInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor) {
    // 1. Save the pending task and record its id
    const { id } = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    // 2. Explicitly call exit() to flush the task to the database and commit the transaction
    await processor.exit();

    // 3. Initiate the async operation (the transaction is now committed, no longer holding the database connection)
    const jobDone: IJob = { status: JOB_STATUS.PENDING };
    try {
      const result = await someAsyncOperation(node.config);
      jobDone.status = JOB_STATUS.RESOLVED;
      jobDone.result = result;
    } catch (error) {
      jobDone.status = JOB_STATUS.FAILED;
      jobDone.result = { message: error.message };
    } finally {
      // 4. Re-query the task from the database; do not use the cached in-memory object
      const job = await this.workflow.app.db.getRepository('jobs').findOne({
        filterByTk: id,
      });
      job.set(jobDone);

      // 5. Notify the workflow engine to resume execution, entering the resume flow
      this.workflow.resume(job);
    }
    // 6. Return nothing (void); the executor will exit immediately
  }

  async resume(node: FlowNodeModel, job, processor) {
    // The job already has its final status set in run(), just return it
    return job;
  }
}
```

Hay varios detalles clave a tener en cuenta:

**¿Por qué llamar a `processor.exit()` explícitamente en lugar de devolver el objeto de tarea pendiente?**
`return { status: PENDING }` finaliza inmediatamente la función `run`, haciendo imposible ejecutar cualquier código posterior. Llamar a `await processor.exit()` solo confirma la transacción y sale del contexto de base de datos, mientras la función continúa ejecutándose. Esto le permite hacer `await` de una operación costosa dentro del mismo cuerpo de función y luego llamar a `resume` cuando se complete. Si omite `exit()` y directamente hace `await` de una operación larga antes de retornar, mantiene la transacción de base de datos abierta durante mucho tiempo causando contención de bloqueos, y el registro de tarea no se persistirá hasta que la transacción se confirme después de que la operación termine.

**¿Por qué volver a consultar la tarea en lugar de usar el objeto devuelto por `saveJob`?**
El objeto devuelto por `saveJob` es una instancia de modelo en memoria vinculada a la transacción original. Después de que se llama a `processor.exit()`, esa transacción ha sido confirmada y cerrada. Modificar directamente esta instancia y llamar a `resume` causará anomalías en el estado del ORM (referencias de transacción obsoletas, inconsistencias de estado, etc.). Volver a consultar desde la base de datos por `id` garantiza obtener una instancia limpia sin vinculación a ninguna transacción.

**¿Por qué la función `run` no devuelve nada (`void`)?**
`processor.exit()` ya ha sido llamado manualmente. Cuando el ejecutor recibe `void`, llama a `exit(true)` y sale inmediatamente sin ningún procesamiento redundante. Si se devolviera un `IJob` en este punto, el ejecutor intentaría guardar y confirmar nuevamente, causando errores. Consulte la sección de tipos de valores de retorno de `run`/`resume` para más detalles.

**Para escenarios que requieren callbacks externos** (por ejemplo, resultados de pago notificados vía webhook), aplica el mismo enfoque: llamar a `processor.exit()` antes de registrar el callback para asegurarse de que el registro de tarea esté en la base de datos antes de que el sistema externo llame de vuelta. En el callback, volver a consultar la tarea por `id` y luego llamar a `this.workflow.resume(job)`.

Para un ejemplo completo del mundo real, consulte: [RequestInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-request/src/server/RequestInstruction.ts) (nodo de solicitud HTTP, que usa este patrón en la rama de flujo de trabajo asíncrono)

### Estado del resultado del nodo

El estado de ejecución de un nodo afecta el éxito o el fracaso de todo el **flujo de trabajo**. Normalmente, sin ramificaciones, el fallo de un nodo provocará directamente el fallo de todo el **flujo de trabajo**. El escenario más común es que, si un nodo se ejecuta correctamente, se procede al siguiente nodo en la tabla de nodos hasta que no haya más nodos posteriores, momento en el que la ejecución completa del **flujo de trabajo** finaliza con un estado de éxito.

Si un nodo devuelve un estado de ejecución fallido durante su proceso, el motor lo manejará de manera diferente según las siguientes dos situaciones:

1.  Si el nodo que devuelve un estado de fallo se encuentra en el **flujo de trabajo** principal, es decir, no está dentro de ninguna ramificación iniciada por un nodo anterior, entonces todo el **flujo de trabajo** principal se considerará fallido y el proceso finalizará.

2.  Si el nodo que devuelve un estado de fallo se encuentra dentro de una ramificación del **flujo de trabajo**, la responsabilidad de determinar el siguiente estado del proceso se transfiere al nodo que inició esa ramificación. La lógica interna de dicho nodo decidirá el estado del **flujo de trabajo** subsiguiente, y esta decisión se propagará recursivamente hasta el **flujo de trabajo** principal.

Finalmente, el siguiente estado de todo el **flujo de trabajo** se determina en los nodos del **flujo de trabajo** principal. Si un nodo en el **flujo de trabajo** principal devuelve un fallo, todo el **flujo de trabajo** termina con un estado de fallo.

Si algún nodo devuelve un estado de "pendiente" después de su ejecución, todo el proceso de ejecución se interrumpirá y suspenderá temporalmente, esperando que un evento definido por el nodo correspondiente active la reanudación del **flujo de trabajo**. Por ejemplo, un nodo manual, al ejecutarse, se pausará en ese nodo con un estado de "pendiente", esperando la intervención humana para decidir si se aprueba. Si el estado introducido manualmente es de aprobación, los nodos posteriores del **flujo de trabajo** continuarán; de lo contrario, se manejará según la lógica de fallo descrita anteriormente.

Para obtener más información sobre los estados de retorno de las instrucciones, consulte la sección de Referencia de la API de **Flujo de trabajo**.

### Tipos de valores de retorno de `run`/`resume` y comportamiento del executor

La definición completa del tipo de retorno para los métodos `run` y `resume` es:

```ts
type InstructionResult = IJob | Promise<IJob> | Promise<void> | Promise<null> | null | void;
```

Después de que el ejecutor (`Processor`) llama a una instrucción, ejecuta una lógica de procesamiento diferente según el tipo de valor de retorno. Hay tres casos.

#### 1. Devolver un objeto de tarea `IJob`

Este es el caso más común. Devuelva un objeto que contenga un campo `status` obligatorio y un campo `result` opcional. El ejecutor lo guarda como el registro de tarea del nodo y determina el flujo subsiguiente según el valor de `status`:

- `JOB_STATUS.RESOLVED`: El nodo se ejecutó correctamente; continúa al siguiente nodo si existe, de lo contrario el flujo de trabajo finaliza
- `JOB_STATUS.PENDING`: El nodo entra en estado suspendido; el contexto de ejecución actual se detiene, esperando que un evento externo active `resume`
- Otros estados de fallo (`FAILED`, `ERROR`, etc.): Se propagan hacia arriba al nodo padre de la rama o terminan directamente todo el flujo de trabajo

Este camino es el camino completo de confirmación de transacción: el ejecutor guarda el registro de tarea, escribe en la base de datos y confirma la transacción.

Ejemplo: [ConditionInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/ConditionInstruction.ts) (devuelve un objeto `job` directamente cuando no hay rama; consulte el caso `void` a continuación cuando hay una rama)

#### 2. Devolver `null`

Cuando se devuelve `null`, el ejecutor llama a `processor.exit()` (sin argumento), con el efecto de: **vaciar las tareas pendientes actuales a la base de datos y confirmar la transacción, pero sin actualizar el estado de ejecución general**.

Este uso es común en el método `resume` de nodos de control de ramas: una rama ha completado y el estado de la tarea del nodo padre necesita actualizarse y guardarse (por ejemplo, registrar "la rama N ha completado"), pero otras ramas aún se están ejecutando, y la ejecución general debe permanecer en estado `STARTED` esperando las ramas restantes; devolver `null` sale del contexto de reanudación actual sin afectar el estado de ejecución general.

Ejemplo: [ParallelInstruction.ts](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts)

- Línea [117](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L117): El nodo paralelo ya ha completado anticipadamente (resuelto/rechazado); ignora las reanudaciones de ramas subsiguientes y devuelve `null` directamente
- Línea [135](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L135): Algunas ramas aún están incompletas (`PENDING`); guarda el progreso actual y devuelve `null` para continuar esperando otras ramas

#### 3. Devolver `void` (sin retorno, es decir, `undefined` implícito)

Cuando se devuelve `void` (la función no tiene una declaración de retorno explícita, o la ruta de ejecución termina sin valor de retorno), el ejecutor llama a `processor.exit(true)`, con el efecto de **retornar inmediatamente sin realizar ninguna operación de base de datos**.

Este patrón es exclusivamente para **escenarios donde la instrucción ha tomado el control de la programación de ejecución**: la instrucción inicia manualmente un sub-flujo de trabajo mediante `processor.run()`, y la cadena de ejecución del sub-flujo de trabajo se encargará de las escrituras en la base de datos y confirmaciones de transacciones cuando se complete. El ejecutor no debe procesar nuevamente.

Ejemplos típicos:

- [ConditionInstruction.ts#L67](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/server/instructions/ConditionInstruction.ts#L67): Cuando existe una rama, llama manualmente a `processor.run(branchNode, savedJob)` y luego la función termina, devolviendo implícitamente `void`
- [ParallelInstruction.ts#L108](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L108): Itera por todas las ramas y llama a `processor.run(branch, job)` para cada una, luego la función termina, devolviendo implícitamente `void`

:::warn{title=Nota}
Si se llamó a `processor.saveJob()` antes de devolver `void`, esos registros de tarea no serán escritos en la base de datos por el ejecutor actual. Se almacenan temporalmente en la lista de tareas del ejecutor (en memoria) y serán volcados a la base de datos por el `exit()` activado cuando se complete la sub-ejecución iniciada por `processor.run()`. Por lo tanto, al usar este patrón, debe asegurarse de que haya una ruta de sub-ejecución que se completará normalmente para persistir estos registros. La programación de flujos de trabajo de rama tiene cierta complejidad; requiere un diseño cuidadoso y pruebas exhaustivas.
:::

Comparación resumida de los tres valores de retorno:

| Valor de retorno | Comportamiento del ejecutor | Caso de uso típico |
|--------|-----------|------------|
| `IJob` | Guarda la tarea, continúa/termina/suspende el flujo según `status` | Ejecución normal del nodo con resultado y estado |
| `null` | Vuelca las tareas pendientes y confirma la transacción, no actualiza el estado de ejecución | La rama aún está esperando, sale temporalmente del contexto de ejecución actual |
| `void` | Retorna inmediatamente, sin operaciones de BD | El nodo ha programado un sub-flujo de trabajo, dejando que el sub-flujo tome el control del procesamiento subsiguiente |

### Más información

Las definiciones de los diversos parámetros para definir tipos de nodo se encuentran en la sección de Referencia de la API de **Flujo de trabajo**.

## Lado del cliente

De forma similar a los disparadores, el formulario de configuración para una instrucción (tipo de nodo) debe implementarse en el lado del cliente.

### La instrucción de nodo más sencilla

Todas las instrucciones deben derivar de la clase base `Instruction`. Las propiedades y métodos relacionados se utilizan para la configuración y el uso del nodo.

Por ejemplo, si necesitamos proporcionar una interfaz de configuración para el nodo de tipo cadena de número aleatorio (`randomString`) definido anteriormente en el lado del servidor, que tiene un elemento de configuración `digit` que representa el número de dígitos para el número aleatorio, usaríamos un campo de entrada numérica en el formulario de configuración para recibir la entrada del usuario.

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=Nota}
El identificador del tipo de nodo registrado en el lado del cliente debe ser coherente con el del lado del servidor; de lo contrario, se producirán errores.
:::

### Proporcionar resultados del nodo como variables

Puede observar el método `useVariables` en el ejemplo anterior. Si necesita utilizar el resultado del nodo (la parte `result`) como una variable para nodos posteriores, debe implementar este método en la clase de instrucción heredada y devolver un objeto que cumpla con el tipo `VariableOption`. Este objeto sirve como una descripción estructural del resultado de la ejecución del nodo, proporcionando un mapeo de nombres de variables para su selección y uso en nodos posteriores.

El tipo `VariableOption` se define de la siguiente manera:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

El núcleo es la propiedad `value`, que representa el valor de la ruta segmentada del nombre de la variable. `label` se utiliza para mostrar en la interfaz, y `children` se usa para representar una estructura de variable multinivel, lo cual es útil cuando el resultado del nodo es un objeto anidado.

Una variable utilizable se representa internamente en el sistema como una cadena de plantilla de ruta separada por `.`, por ejemplo, `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Aquí, `jobsMapByNodeKey` representa el conjunto de resultados de todos los nodos (definido internamente, no necesita ser manejado), `2dw92cdf` es la `key` del nodo, y `abc` es una propiedad personalizada en el objeto de resultado del nodo.

Además, dado que el resultado de un nodo también puede ser un valor simple, al proporcionar variables de nodo, el primer nivel **debe** ser la descripción del propio nodo:

```ts
{
  value: node.key,
  label: node.title,
}
```

Es decir, el primer nivel es la `key` y el título del nodo. Por ejemplo, en el [código de referencia](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77) del nodo de cálculo, al usar el resultado de este nodo, las opciones de la interfaz son las siguientes:

![Resultado del nodo de cálculo](https://static-docs.nocobase.com/20240514230014.png)

Cuando el resultado del nodo es un objeto complejo, puede usar `children` para seguir describiendo propiedades anidadas. Por ejemplo, una instrucción personalizada podría devolver los siguientes datos JSON:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Entonces puede devolverlo a través del método `useVariables` de la siguiente manera:

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

De esta manera, en los nodos posteriores, podrá usar la siguiente interfaz para seleccionar las variables:

![Variables de resultado mapeadas](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="Nota"}
Cuando una estructura en el resultado es un array de objetos anidados, también puede usar `children` para describir la ruta, pero no puede incluir índices de array. Esto se debe a que, en el manejo de variables del **flujo de trabajo** de NocoBase, la descripción de la ruta de una variable para un array de objetos se aplana automáticamente en un array de valores anidados cuando se usa, y no se puede acceder a un valor específico por su índice.
:::

### Disponibilidad del nodo

Por defecto, se puede añadir cualquier nodo a un **flujo de trabajo**. Sin embargo, en algunos casos, un nodo puede no ser aplicable en ciertos tipos de **flujos de trabajo** o ramificaciones. En estas situaciones, puede configurar la disponibilidad del nodo utilizando `isAvailable`:

```ts
// Type definition
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // Workflow plugin instance
  engine: WorkflowPlugin;
  // Workflow instance
  workflow: object;
  // Upstream node
  upstream: object;
  // Whether it is a branch node (branch number)
  branchIndex: number;
};
```

El método `isAvailable` devuelve `true` si el nodo está disponible y `false` si no lo está. El parámetro `ctx` contiene la información de contexto del nodo actual, que puede utilizar para determinar si el nodo está disponible.

Si no tiene requisitos especiales, no necesita implementar el método `isAvailable`, ya que los nodos están disponibles por defecto. El escenario más común que requiere configuración es cuando un nodo podría ser una operación que consume mucho tiempo y no es adecuado para ejecutarse en un **flujo de trabajo** síncrono. Puede usar el método `isAvailable` para restringir su uso. Por ejemplo:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Más información

Las definiciones de los diversos parámetros para definir tipos de nodo se encuentran en la sección de Referencia de la API de **Flujo de trabajo**.