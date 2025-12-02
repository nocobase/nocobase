:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Plan de Ejecución (Historial)

Cuando se activa un **flujo de trabajo**, se crea un **plan de ejecución** correspondiente para rastrear el proceso de la tarea. Cada **plan de ejecución** tiene un valor de estado que indica su estado actual, el cual puede ver tanto en la lista como en los detalles del historial de ejecución:

![Estado del Plan de Ejecución](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Cuando todos los nodos en la rama principal del **flujo de trabajo** se ejecutan hasta el final con un estado de "Completado", todo el **plan de ejecución** finalizará con ese mismo estado. Si un nodo en la rama principal del **flujo de trabajo** alcanza un estado final como "Fallido", "Error", "Cancelado" o "Rechazado", el **plan de ejecución** completo se **terminará prematuramente** con el estado correspondiente. Cuando un nodo en la rama principal del **flujo de trabajo** tiene un estado de "En espera", el **plan de ejecución** se pausará, pero seguirá mostrando un estado de "En ejecución" hasta que el nodo en espera se reanude. Los diferentes tipos de nodos manejan el estado de espera de distintas maneras; por ejemplo, un nodo manual requiere una intervención humana, mientras que un nodo de retardo necesita esperar a que transcurra un tiempo específico antes de continuar.

Los estados de un **plan de ejecución** son los siguientes:

| Estado | Estado del último nodo ejecutado en el flujo principal | Significado |
| ------ | ---------------------------------------------------- | ----------- |
| En cola | - | El **flujo de trabajo** se ha activado y se ha generado un **plan de ejecución**, esperando en la cola a que el planificador organice su ejecución. |
| En ejecución | En espera | El nodo requiere una pausa, esperando una entrada adicional o una devolución de llamada para continuar. |
| Completado | Completado | No se encontraron problemas; todos los nodos se ejecutaron uno por uno según lo previsto. |
| Fallido | Fallido | Falló porque no se cumplió la configuración del nodo. |
| Error | Error | El nodo encontró un error de programa no controlado y terminó prematuramente. |
| Cancelado | Cancelado | Un nodo en espera fue cancelado externamente por el administrador del **flujo de trabajo**, terminando prematuramente. |
| Rechazado | Rechazado | En un nodo de procesamiento manual, fue rechazado manualmente y el proceso posterior no continuará. |

En el ejemplo de [Inicio Rápido](../getting-started.md), ya sabemos que al ver los detalles del historial de ejecución de un **flujo de trabajo**, podemos verificar si todos los nodos se ejecutaron correctamente, así como el estado de ejecución y los datos de resultado de cada nodo ejecutado. En algunos **flujos de trabajo** y nodos avanzados, un nodo puede tener múltiples resultados, como el resultado de un nodo de bucle:

![Resultados de nodos de múltiples ejecuciones](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Sugerencia}
Los **flujos de trabajo** pueden activarse de forma concurrente, pero su ejecución se realiza de forma secuencial en una cola. Incluso si se activan varios **flujos de trabajo** al mismo tiempo, se ejecutarán uno por uno, no en paralelo. Por lo tanto, un estado "En cola" significa que otros **flujos de trabajo** están en ejecución y debe esperar.

El estado "En ejecución" solo indica que el **plan de ejecución** ha comenzado y que, por lo general, está en pausa debido al estado de espera de un nodo interno. No significa que este **plan de ejecución** haya tomado los recursos de ejecución de la cabeza de la cola. Por lo tanto, cuando hay un **plan de ejecución** "En ejecución", otros **planes de ejecución** "En cola" aún pueden ser programados para comenzar.
:::

## Estado de Ejecución del Nodo

El estado de un **plan de ejecución** está determinado por la ejecución de cada uno de sus nodos. En un **plan de ejecución** posterior a una activación, cada nodo produce un estado de ejecución después de ejecutarse, y este estado determina si el proceso subsiguiente continuará. Normalmente, después de que un nodo se ejecuta con éxito, se ejecutará el siguiente nodo, hasta que todos los nodos se hayan ejecutado en secuencia o el proceso sea interrumpido. Al encontrar nodos relacionados con el control de **flujo de trabajo**, como ramas, bucles, ramas paralelas, retardos, etc., el flujo de ejecución hacia el siguiente nodo se determina en función de las condiciones configuradas en el nodo y los datos de contexto en tiempo de ejecución.

Los posibles estados de un nodo después de la ejecución son los siguientes:

| Estado | ¿Es estado final? | ¿Termina prematuramente? | Significado |
| ---- | :---------------: | :----------------------: | ----------- |
| En espera | No | No | El nodo requiere una pausa, esperando una entrada adicional o una devolución de llamada para continuar. |
| Completado | Sí | No | No se encontraron problemas, se ejecutó con éxito y continúa con el siguiente nodo hasta el final. |
| Fallido | Sí | Sí | Falló porque no se cumplió la configuración del nodo. |
| Error | Sí | Sí | El nodo encontró un error de programa no controlado y terminó prematuramente. |
| Cancelado | Sí | Sí | Un nodo en espera fue cancelado externamente por el administrador del **flujo de trabajo**, terminando prematuramente. |
| Rechazado | Sí | Sí | En un nodo de procesamiento manual, fue rechazado manualmente y el proceso posterior no continuará. |

Excepto por el estado "En espera", todos los demás son estados finales para la ejecución de un nodo. Solo cuando el estado final es "Completado" continuará el proceso; de lo contrario, la ejecución completa del **flujo de trabajo** se terminará prematuramente. Cuando un nodo se encuentra en un **flujo de trabajo** de ramificación (rama paralela, condición, bucle, etc.), el estado final producido por la ejecución del nodo será gestionado por el nodo que inició la rama, y esto determinará el flujo de todo el **flujo de trabajo**.

Por ejemplo, cuando utilizamos un nodo condicional en modo "'Sí' para continuar", si el resultado es "No" durante la ejecución, todo el **flujo de trabajo** se terminará prematuramente con un estado "Fallido" y los nodos subsiguientes no se ejecutarán, como se muestra en la siguiente figura:

![Ejecución de nodo fallida](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Sugerencia}
Todos los estados de terminación que no sean "Completado" pueden considerarse fallos, pero las razones del fallo son diferentes. Puede ver los resultados de ejecución del nodo para comprender mejor la causa del fallo.
:::