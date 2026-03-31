---
pkg: "@nocobase/plugin-ai"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Conversación de texto

## Introducción

Utilizar el nodo LLM en un flujo de trabajo le permite iniciar una conversación con un servicio LLM en línea, aprovechando las capacidades de los modelos grandes para asistir en la finalización de una serie de procesos de negocio.

![](https://static-docs.nocobase.com/202503041012091.png)

## Crear nodo LLM

Dado que las conversaciones con los servicios LLM suelen consumir mucho tiempo, el nodo LLM solo puede utilizarse en flujos de trabajo asíncronos.

![](https://static-docs.nocobase.com/202503041013363.png)

## Seleccionar modelo

Primero, seleccione un servicio LLM conectado. Si aún no ha conectado ningún servicio LLM, primero deberá añadir una configuración de servicio LLM. Consulte: [Gestión de servicios LLM](/ai-employees/quick-start/llm-service)

Después de seleccionar un servicio, la aplicación intentará recuperar una lista de modelos disponibles del servicio LLM para que usted elija. Algunos servicios LLM en línea pueden tener APIs para obtener modelos que no se ajustan a los protocolos API estándar; en estos casos, los usuarios también pueden introducir manualmente el ID del modelo.

![](https://static-docs.nocobase.com/202503041013084.png)

## Configurar parámetros de invocación

Puede ajustar los parámetros para invocar el modelo LLM según sea necesario.

![](https://static-docs.nocobase.com/202503041014778.png)

### Formato de respuesta

Cabe destacar la configuración de **Formato de respuesta**. Esta opción se utiliza para indicar al modelo grande el formato de su respuesta, que puede ser texto o JSON. Si selecciona el modo JSON, tenga en cuenta lo siguiente:

- El modelo LLM correspondiente debe admitir ser invocado en modo JSON. Además, el usuario debe indicar explícitamente al LLM que responda en formato JSON en el `Prompt`, por ejemplo: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". De lo contrario, podría no haber respuesta, resultando en un error `400 status code (no body)`.
- La respuesta será una cadena JSON. El usuario necesita analizarla utilizando las capacidades de otros nodos del flujo de trabajo para poder utilizar su contenido estructurado. También puede utilizar la función de [Salida estructurada](/ai-employees/workflow/nodes/llm/structured-output).

## Mensajes

El array de mensajes enviados al modelo LLM puede incluir un conjunto de mensajes históricos. Los mensajes admiten tres tipos:

- System - Generalmente utilizado para definir el rol y el comportamiento del modelo LLM en la conversación.
- User - El contenido introducido por el usuario.
- Assistant - El contenido respondido por el modelo.

Para los mensajes de usuario, siempre que el modelo lo admita, puede añadir múltiples piezas de contenido en un solo `prompt`, correspondientes al parámetro `content`. Si el modelo que está utilizando solo admite el parámetro `content` como una cadena (lo cual ocurre con la mayoría de los modelos que no admiten conversaciones multimodales), por favor, divida el mensaje en múltiples `prompts`, con cada `prompt` conteniendo solo una pieza de contenido. De esta manera, el nodo enviará el contenido como una cadena.

![](https://static-docs.nocobase.com/202503041016140.png)

Puede utilizar variables en el contenido del mensaje para hacer referencia al contexto del flujo de trabajo.

![](https://static-docs.nocobase.com/202503041017879.png)

## Uso del contenido de respuesta del nodo LLM

Puede utilizar el contenido de respuesta del nodo LLM como una variable en otros nodos.

![](https://static-docs.nocobase.com/202503041018508.png)