:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Configuración Avanzada

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