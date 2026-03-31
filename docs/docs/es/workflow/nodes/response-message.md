---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Mensaje de Respuesta

## Introducción

El nodo de mensaje de respuesta le permite enviar mensajes personalizados desde su flujo de trabajo al cliente que inició la acción, en tipos de flujos de trabajo específicos.

:::info{title=Nota}
Actualmente, solo puede utilizarlo en flujos de trabajo de tipo "Evento antes de la acción" y "Evento de acción personalizada" que operen en modo síncrono.
:::

## Creación de un nodo

En los tipos de flujo de trabajo compatibles, puede añadir un nodo de "Mensaje de respuesta" en cualquier punto del flujo de trabajo. Simplemente haga clic en el botón de más ("+") dentro del flujo de trabajo para añadirlo:

![Añadir nodo](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

El mensaje de respuesta existe como un array durante todo el proceso de la solicitud. Cada vez que se ejecuta un nodo de mensaje de respuesta en el flujo de trabajo, el nuevo contenido del mensaje se añade a este array. Cuando el servidor envía la respuesta, todos los mensajes se envían al cliente de forma conjunta.

## Configuración del nodo

El contenido del mensaje es una cadena de plantilla donde puede insertar variables. Puede organizar libremente el contenido de esta plantilla en la configuración del nodo:

![Configuración del nodo](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Cuando el flujo de trabajo llega a este nodo, la plantilla se analiza para generar el contenido del mensaje. En la configuración anterior, la variable "Variable local / Recorrer todos los productos / Objeto de bucle / Producto / Título" se reemplazará por un valor específico en el flujo de trabajo real, por ejemplo:

```
El producto "iPhone 14 pro" está sin existencias.
```

![Contenido del mensaje](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

## Configuración del flujo de trabajo

El estado del mensaje de respuesta dependerá de si el flujo de trabajo se ejecuta con éxito o falla. La falla de cualquier nodo provocará la falla de todo el flujo de trabajo. En este caso, el contenido del mensaje se devolverá al cliente con un estado de falla y se mostrará una notificación.

Si necesita definir activamente un estado de falla en el flujo de trabajo, puede utilizar un "nodo de fin" y configurarlo con un estado de falla. Cuando se ejecute este nodo, el flujo de trabajo finalizará con un estado de falla y el mensaje se devolverá al cliente con dicho estado.

Si el flujo de trabajo completo no produce un estado de falla y se ejecuta con éxito hasta el final, el contenido del mensaje se devolverá al cliente con un estado de éxito.

:::info{title=Nota}
Si define varios nodos de mensaje de respuesta en el flujo de trabajo, los nodos ejecutados añadirán su contenido de mensaje a un array. Al final, cuando se devuelva la respuesta al cliente, se mostrarán todos los mensajes de forma conjunta.
:::

## Casos de uso

### Flujo de trabajo "Evento antes de la acción"

El uso de un mensaje de respuesta en un flujo de trabajo "Evento antes de la acción" permite enviar la retroalimentación de mensajes correspondiente al cliente una vez finalizado el flujo de trabajo. Para más detalles, consulte [Evento antes de la acción](../triggers/pre-action.md).

### Flujo de trabajo "Evento de acción personalizada"

El uso de un mensaje de respuesta en un "Evento de acción personalizada" en modo síncrono permite enviar la retroalimentación de mensajes correspondiente al cliente una vez finalizado el flujo de trabajo. Para más detalles, consulte [Evento de acción personalizada](../triggers/custom-action.md).