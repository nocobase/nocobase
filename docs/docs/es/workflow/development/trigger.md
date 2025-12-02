:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Extender Tipos de Disparadores

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

Por ejemplo, para el disparador de ejecución programada mencionado anteriormente, defina el elemento de configuración de tiempo de intervalo (`interval`) necesario en el formulario de la interfaz de configuración:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

Luego, dentro del **plugin** extendido, registre este tipo de disparador en la instancia del **plugin** de **flujo de trabajo**:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Después de esto, el nuevo tipo de disparador será visible en la interfaz de configuración del **flujo de trabajo**.

:::info{title=Nota}
El identificador del tipo de disparador registrado en el lado del cliente debe ser consistente con el del lado del servidor, de lo contrario, se producirán errores.
:::

Para obtener más detalles sobre cómo definir tipos de disparadores, consulte la sección [Referencia de la API de **flujo de trabajo**](./api#pluginregisterTrigger).