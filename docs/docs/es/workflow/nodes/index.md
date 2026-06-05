:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Descripción general

Un flujo de trabajo se compone generalmente de varios pasos operativos conectados. Cada nodo representa uno de estos pasos y sirve como una unidad lógica fundamental en el proceso. Al igual que en un lenguaje de programación, los diferentes tipos de nodos representan distintas instrucciones que determinan su comportamiento. Cuando el flujo de trabajo se ejecuta, el sistema entra en cada nodo secuencialmente y ejecuta sus instrucciones.

:::info{title=Nota}
El disparador de un flujo de trabajo no es un nodo. Solo se muestra como un punto de entrada en el diagrama de flujo, pero es un concepto diferente al de un nodo. Para más detalles, consulte el contenido de [Disparadores](../triggers/index.md).
:::

Desde una perspectiva funcional, los nodos implementados actualmente se pueden dividir en varias categorías principales (un total de 29 tipos de nodos):

- Inteligencia Artificial
  - [Modelo de Lenguaje Grande](../../ai-employees/workflow/nodes/llm/chat.md) (proporcionado por el plugin @nocobase/plugin-workflow-llm)
- Control de Flujo
  - [Condición](./condition.md)
  - [Múltiples condiciones](./multi-conditions.md)
  - [Bucle](./loop.md) (proporcionado por el plugin @nocobase/plugin-workflow-loop)
  - [Variable](./variable.md) (proporcionado por el plugin @nocobase/plugin-workflow-variable)
  - [Bifurcación paralela](./parallel.md) (proporcionado por el plugin @nocobase/plugin-workflow-parallel)
  - [Invocar flujo de trabajo](./subflow.md) (proporcionado por el plugin @nocobase/plugin-workflow-subflow)
  - [Salida del flujo de trabajo](./output.md) (proporcionado por el plugin @nocobase/plugin-workflow-subflow)
  - [Mapeo de variables JSON](./json-variable-mapping.md) (proporcionado por el plugin @nocobase/plugin-workflow-json-variable-mapping)
  - [Retraso](./delay.md) (proporcionado por el plugin @nocobase/plugin-workflow-delay)
  - [Finalizar flujo de trabajo](./end.md)
- Cálculo
  - [Cálculo](./calculation.md)
  - [Cálculo de fechas](./date-calculation.md) (proporcionado por el plugin @nocobase/plugin-workflow-date-calculation)
  - [Cálculo JSON](./json-query.md) (proporcionado por el plugin @nocobase/plugin-workflow-json-query)
- Operaciones de colección
  - [Crear datos](./create.md)
  - [Actualizar datos](./update.md)
  - [Eliminar datos](./destroy.md)
  - [Consultar datos](./query.md)
  - [Consulta agregada](./aggregate.md) (proporcionado por el plugin @nocobase/plugin-workflow-aggregate)
  - [Acción SQL](./sql.md) (proporcionado por el plugin @nocobase/plugin-workflow-sql)
- Procesamiento manual
  - [Procesamiento manual](./manual.md) (proporcionado por el plugin @nocobase/plugin-workflow-manual)
  - [Aprobación](./approval.md) (proporcionado por el plugin @nocobase/plugin-workflow-approval)
  - [CC](./cc.md) (proporcionado por el plugin @nocobase/plugin-workflow-cc)
- Otras extensiones
  - [Solicitud HTTP](./request.md) (proporcionado por el plugin @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (proporcionado por el plugin @nocobase/plugin-workflow-javascript)
  - [Enviar correo electrónico](./mailer.md) (proporcionado por el plugin @nocobase/plugin-workflow-mailer)
  - [Notificación](../../notification-manager/index.md#工作流通知节点) (proporcionado por el plugin @nocobase/plugin-workflow-notification)
  - [Respuesta](./response.md) (proporcionado por el plugin @nocobase/plugin-workflow-webhook)
  - [Mensaje de respuesta](./response-message.md) (proporcionado por el plugin @nocobase/plugin-workflow-response-message)