:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Finalizar flujo de trabajo

Cuando este nodo se ejecuta, finaliza inmediatamente el flujo de trabajo actual con el estado configurado en el nodo. Se utiliza normalmente para el control de flujos basado en lógica específica, saliendo del flujo de trabajo actual cuando se cumplen ciertas condiciones y deteniendo la ejecución de procesos posteriores. Es análogo a la instrucción `return` en lenguajes de programación, que se usa para salir de la función actual.

## Añadir nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ("+") dentro del flujo para añadir un nodo de "Finalizar flujo de trabajo":

![End Workflow_Add](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Configuración del nodo

![End Workflow_Node Configuration](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Estado final

El estado final afectará el estado definitivo de la ejecución del flujo de trabajo. Puede configurarse como "Éxito" o "Fallo". Cuando la ejecución del flujo de trabajo llega a este nodo, saldrá inmediatamente con el estado configurado.

:::info{title=Sugerencia}
Cuando se utiliza en un flujo de trabajo de tipo "Evento previo a la acción", interceptará la solicitud que inició la acción. Para más detalles, consulte [Uso de "Evento previo a la acción"](../triggers/pre-action).

Además de interceptar la solicitud que inició la acción, la configuración del estado final también afectará el estado de la información de retroalimentación en el "mensaje de respuesta" para este tipo de flujo de trabajo.
:::