:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Resumen

Un disparador es el punto de entrada para un flujo de trabajo. Cuando ocurre un evento que cumple las condiciones del disparador mientras la aplicación está en ejecución, el flujo de trabajo se activará y ejecutará. El tipo de disparador también define el tipo de flujo de trabajo. Se selecciona al crear el flujo de trabajo y no se puede modificar después de su creación. Los tipos de disparadores actualmente compatibles son los siguientes:

- [Eventos de colección](./collection) (Integrado)
- [Programación](./schedule) (Integrado)
- [Antes de la acción](./pre-action) (Proporcionado por el plugin @nocobase/plugin-workflow-request-interceptor)
- [Después de la acción](./post-action) (Proporcionado por el plugin @nocobase/plugin-workflow-action-trigger)
- [Acción personalizada](./custom-action) (Proporcionado por el plugin @nocobase/plugin-workflow-custom-action-trigger)
- [Aprobación](./approval) (Proporcionado por el plugin @nocobase/plugin-workflow-approval)
- [Webhook](./webhook) (Proporcionado por el plugin @nocobase/plugin-workflow-webhook)

El momento en que se activa cada evento se muestra en la siguiente imagen:

![Eventos del flujo de trabajo](https://static-docs.nocobase.com/20251029221709.png)

Por ejemplo, cuando un usuario envía un formulario, cuando los datos de una colección cambian debido a una acción del usuario o a una llamada de programa, o cuando una tarea programada alcanza su tiempo de ejecución, se puede activar un flujo de trabajo configurado.

Los disparadores relacionados con datos (como acciones o eventos de colección) suelen llevar consigo datos de contexto del disparador. Estos datos actúan como variables y pueden ser utilizados por los nodos del flujo de trabajo como parámetros de procesamiento para lograr la automatización del procesamiento de datos. Por ejemplo, cuando un usuario envía un formulario, si el botón de envío está vinculado a un flujo de trabajo, este se activará y ejecutará. Los datos enviados se inyectarán en el entorno de contexto del plan de ejecución para que los nodos posteriores los utilicen como variables.

Después de crear un flujo de trabajo, en la página de visualización del flujo de trabajo, el disparador se muestra como un nodo de entrada al inicio del proceso. Al hacer clic en esta tarjeta, se abrirá el panel de configuración. Dependiendo del tipo de disparador, usted puede configurar sus condiciones relevantes.

![Disparador_Nodo de entrada](https://static-docs.nocobase.com/20251029222231.png)