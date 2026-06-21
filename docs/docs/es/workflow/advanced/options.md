# Configuración Avanzada

## Configuración de Tiempo de Espera

A partir de la versión `2.1.0`, los flujos de trabajo admiten la configuración de tiempo de espera para limitar la duración máxima de una ejecución, desde que comienza a procesarse hasta que finaliza. Esta configuración es útil para evitar que un flujo de trabajo ocupe recursos de ejecución indefinidamente debido a operaciones de larga duración, espera de procesamiento manual o espera de callbacks externos.

En el diálogo de creación o edición del flujo de trabajo, expanda "Opciones avanzadas" para configurar "Configuración de tiempo de espera":

![20260604212454](https://static-docs.nocobase.com/20260604212454.png)

Las opciones configurables son:

- Introduzca `0` para no limitar el tiempo de espera (valor predeterminado).
- Introduzca un valor mayor que `0` para habilitar el límite de tiempo de espera. La interfaz permite seleccionar segundos, minutos, horas y días como unidades.
- El tiempo de espera máximo es de 180 días.

### Reglas de Cómputo

El tiempo de espera comienza a contarse cuando el flujo de trabajo entra por primera vez en un procesador. Después de que se activa un flujo de trabajo, el tiempo que permanece en la cola esperando la programación, o almacenado para un inicio diferido, no consume el tiempo de espera.

Después de entrar en un procesador, el tiempo de espera continúa contándose, incluyendo el tiempo real de ejecución de los nodos y el tiempo de los nodos que ya han entrado en estado de espera, como procesamiento manual, aprobación, retraso o espera de un callback externo. El tiempo de espera no se pausa cuando el flujo de trabajo está esperando una acción del usuario.

La fecha límite de tiempo de espera se determina cuando comienza esta ejecución. Modificar la configuración de tiempo de espera del flujo de trabajo solo afecta a las ejecuciones que comiencen a procesarse después; no recalcula las ejecuciones que ya han comenzado.

### Tratamiento al Agotarse el Tiempo

Si la ejecución aún no ha finalizado cuando se alcanza el tiempo de espera, el sistema la termina:

- El estado del historial de ejecución cambia a "Abortado" y el motivo de terminación se muestra como "Tiempo agotado".
- Las tareas de nodos que están en ejecución o en espera se marcan como "Abortado".
- Los nodos posteriores no continuarán ejecutándose.
- Si esta ejecución tiene subflujos en ejecución, esos subflujos también se abortan junto con la ejecución principal.

Por ejemplo:

- Si un nodo de bucle ejecuta un bucle extremadamente largo y el procesamiento interno consume mucho tiempo, haciendo que todo el nodo de bucle supere el tiempo de espera configurado, el nodo de bucle actualmente en ejecución y sus nodos internos se terminarán forzosamente, y los nodos posteriores no continuarán ejecutándose.
- Si un nodo de procesamiento manual o aprobación espera durante mucho tiempo y supera el tiempo de espera configurado, el nodo en espera se terminará forzosamente, los nodos posteriores no continuarán ejecutándose y las tareas relacionadas se cancelarán.

:::info{title=Nota}
La configuración de tiempo de espera es un límite global para toda la ejecución del flujo de trabajo, no un tiempo de espera independiente para un nodo. Si solo necesita limitar el tiempo de espera de un nodo concreto, como una solicitud HTTP o un script JavaScript, use la configuración de tiempo de espera propia de ese nodo.
:::

:::info{title=Nota}
Si necesita implementar un tratamiento de negocio con límite de tiempo, por ejemplo, "marcar una orden de trabajo como agotada si nadie la procesa en 10 minutos", normalmente debe usar el [nodo de retraso](../nodes/delay.md) junto con ramas paralelas para organizar el procesamiento posterior. El tiempo de espera global termina directamente la ejecución actual, por lo que es adecuado como protección de respaldo, no para ejecutar ramas de negocio posteriores.
:::

## Modo de Ejecución

Los flujos de trabajo se ejecutan de forma "asíncrona" o "síncrona", según el tipo de disparador que se seleccione durante su creación. El modo asíncrono significa que, después de que se activa un evento específico, el flujo de trabajo entra en una cola y es ejecutado uno por uno por la programación en segundo plano. Por otro lado, el modo síncrono no entra en la cola de programación después de ser activado; comienza a ejecutarse directamente y proporciona retroalimentación inmediata al finalizar.

Los eventos de colección, los eventos posteriores a la acción, los eventos de acción personalizada, los eventos programados y los eventos de aprobación se ejecutarán de forma asíncrona por defecto. Los eventos previos a la acción, en cambio, se ejecutan de forma síncrona por defecto. Tanto los eventos de colección como los eventos de formulario admiten ambos modos, lo que le permite elegir el que necesite al crear un flujo de trabajo.

![Modo Síncrono_Crear Flujo de Trabajo Síncrono](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Nota}
Debido a su naturaleza, los flujos de trabajo síncronos no pueden utilizar nodos que generen un estado de "espera", como "Procesamiento manual".
:::

## Eliminación Automática del Historial de Ejecución

Cuando un flujo de trabajo se activa con frecuencia, puede configurar la eliminación automática del historial de ejecución para reducir el desorden y aliviar la presión de almacenamiento en la base de datos.

También puede configurar si desea eliminar automáticamente el historial de ejecución de un flujo de trabajo en sus diálogos de creación y edición:

![Configuración de Eliminación Automática del Historial de Ejecución](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

La eliminación automática se puede configurar según el estado del resultado de la ejecución. En la mayoría de los casos, le recomendamos que marque solo el estado "Completado" para conservar los registros de las ejecuciones fallidas y facilitar la resolución de problemas futuros.

Le recomendamos no habilitar la eliminación automática del historial de ejecución cuando esté depurando un flujo de trabajo, así podrá usar el historial para verificar si la lógica de ejecución del flujo de trabajo funciona como se espera.

:::info{title=Nota}
Eliminar el historial de un flujo de trabajo no reduce su contador de ejecuciones.
:::
