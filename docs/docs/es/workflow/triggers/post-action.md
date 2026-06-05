---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Evento Posterior a la Acción

## Introducción

Todas las modificaciones de datos que los usuarios realizan en el sistema se completan, por lo general, a través de una acción. Esta acción suele ser el clic de un botón, que puede ser el botón de envío en un formulario o un botón de acción en un bloque de datos. Los eventos posteriores a la acción se utilizan para vincular flujos de trabajo a estas acciones, logrando que se active un proceso específico una vez que la operación del usuario se haya completado con éxito.

Por ejemplo, al añadir o actualizar datos, usted puede configurar la opción "Vincular flujo de trabajo" para un botón. Una vez completada la acción, se activará el flujo de trabajo vinculado.

A nivel de implementación, dado que el procesamiento de los eventos posteriores a la acción se realiza en la capa de middleware (el middleware de Koa), las llamadas a la API HTTP de NocoBase también pueden activar los eventos posteriores a la acción definidos.

## Instalación

Este es un plugin integrado, no requiere instalación.

## Configuración del Disparador

### Crear un flujo de trabajo

Al crear un flujo de trabajo, seleccione "Evento Posterior a la Acción" como tipo:

![Crear flujo de trabajo_Disparador de evento posterior a la acción](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Modo de Ejecución

Para los eventos posteriores a la acción, al crearlos, también puede elegir el modo de ejecución como "Síncrono" o "Asíncrono":

![Crear flujo de trabajo_Seleccionar síncrono o asíncrono](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Si el proceso necesita ejecutarse y devolver un resultado inmediatamente después de la acción del usuario, puede usar el modo síncrono; de lo contrario, el modo predeterminado es asíncrono. En el modo asíncrono, la acción se completa inmediatamente después de que se activa el flujo de trabajo, y este se ejecutará secuencialmente en la cola de segundo plano de la aplicación.

### Configurar la colección

Acceda al lienzo del flujo de trabajo, haga clic en el disparador para abrir la ventana emergente de configuración y, en primer lugar, seleccione la colección a vincular:

![Configuración del flujo de trabajo_Seleccionar colección](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Seleccionar el modo de disparador

Luego, seleccione el modo de disparador, que puede ser local o global:

![Configuración del flujo de trabajo_Seleccionar modo de disparador](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Donde:

*   El modo local solo se activa en los botones de acción que tienen este flujo de trabajo vinculado. Al hacer clic en botones que no tienen este flujo de trabajo vinculado, no se activará. Usted puede decidir si vincular este flujo de trabajo considerando si formularios con diferentes propósitos deberían activar el mismo proceso.
*   El modo global se activa en todos los botones de acción configurados de la colección, sin importar de qué formulario provengan, y no es necesario vincular el flujo de trabajo correspondiente.

En el modo local, los botones de acción que actualmente admiten la vinculación son los siguientes:

*   Botones "Enviar" y "Guardar" en el formulario de añadir.
*   Botones "Enviar" y "Guardar" en el formulario de actualizar.
*   Botón "Actualizar datos" en las filas de datos (tabla, lista, kanban, etc.).

### Seleccionar el tipo de acción

Si elige el modo global, también deberá seleccionar el tipo de acción. Actualmente, se admiten las acciones "Crear datos" y "Actualizar datos". Ambas acciones activan el flujo de trabajo una vez que la operación se ha completado con éxito.

### Seleccionar datos de relación precargados

Si necesita utilizar los datos asociados de los datos disparadores en procesos posteriores, puede seleccionar los campos de relación que desea precargar:

![Configuración del flujo de trabajo_Precargar relación](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Después de la activación, podrá utilizar directamente estos datos asociados en el proceso.

## Configuración de la Acción

Para las acciones en modo de disparador local, una vez configurado el flujo de trabajo, deberá volver a la interfaz de usuario y vincular el flujo de trabajo al botón de acción del formulario del bloque de datos correspondiente.

Los flujos de trabajo configurados para el botón "Enviar" (incluido el botón "Guardar datos") se activarán después de que el usuario envíe el formulario correspondiente y se complete la operación de datos.

![Evento posterior a la acción_Botón Enviar](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Seleccione "Vincular flujo de trabajo" en el menú de configuración del botón para abrir la ventana emergente de configuración de vinculación. En esta ventana, puede configurar cualquier número de flujos de trabajo a activar. Si no se configura ninguno, significa que no se requiere activación. Para cada flujo de trabajo, primero debe especificar si los datos disparadores son los datos de todo el formulario o los datos de un campo de relación específico dentro del formulario. Luego, basándose en la colección correspondiente al modelo de datos seleccionado, elija el flujo de trabajo del formulario que se haya configurado para coincidir con ese modelo de colección.

![Evento posterior a la acción_Configuración de vinculación de flujo de trabajo_Selección de contexto](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Evento posterior a la acción_Configuración de vinculación de flujo de trabajo_Selección de flujo de trabajo](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Nota"}
El flujo de trabajo debe estar habilitado para poder ser seleccionado en la interfaz anterior.
:::

## Ejemplo

Aquí se presenta una demostración utilizando la acción de creación.

Supongamos un escenario de "Solicitud de Reembolso". Necesitamos realizar una revisión automática del monto y una revisión manual para los montos que excedan el límite, después de que un empleado envíe una solicitud de reembolso. Solo las solicitudes que pasen la revisión serán aprobadas y luego entregadas al departamento de finanzas para su procesamiento.

Primero, podemos crear una colección de "Reembolso de Gastos" con los siguientes campos:

*   Nombre del Proyecto: Texto de una sola línea
*   Solicitante: De muchos a uno (Usuario)
*   Monto: Número
*   Estado: Selección única ("Aprobado", "Procesado")

Luego, cree un flujo de trabajo de tipo "Evento Posterior a la Acción" y configure el modelo de la colección en el disparador para que sea la colección "Reembolso de Gastos":

![Ejemplo_Configuración del disparador_Seleccionar colección](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Una vez que el flujo de trabajo esté habilitado, volveremos más tarde para configurar los nodos de procesamiento específicos del proceso.

Luego, en la interfaz, creamos un bloque de tabla para la colección "Reembolso de Gastos", añadimos un botón "Añadir" a la barra de herramientas y configuramos los campos del formulario correspondientes. En las opciones de configuración del botón de acción "Enviar" del formulario, abrimos el diálogo de configuración "Vincular flujo de trabajo", seleccionamos todos los datos del formulario como contexto y elegimos el flujo de trabajo que creamos anteriormente:

![Ejemplo_Configuración del botón del formulario_Vincular flujo de trabajo](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Una vez completada la configuración del formulario, volvemos a la orquestación lógica del flujo de trabajo. Por ejemplo, si el monto es superior a 500, requerimos una revisión manual por parte de un administrador; de lo contrario, se aprueba directamente. Una vez aprobado, se crea un registro de reembolso y se procesa posteriormente por el departamento de finanzas (omitido).

![Ejemplo_Flujo de procesamiento](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Ignorando el procesamiento financiero posterior, la configuración del proceso de solicitud de reembolso está ahora completa. Cuando un empleado rellena y envía una solicitud de reembolso, se activará el flujo de trabajo correspondiente. Si el monto del gasto es inferior a 500, se creará automáticamente un registro y se esperará el procesamiento adicional por parte de finanzas. De lo contrario, será revisado por un supervisor, y después de la aprobación, también se creará un registro y se entregará a finanzas.

El proceso de este ejemplo también puede configurarse en un botón "Enviar" normal. Usted puede decidir si es necesario crear un registro primero antes de ejecutar los procesos posteriores, basándose en el escenario de negocio específico.

## Llamada Externa

La activación de eventos posteriores a la acción no se limita a las operaciones de la interfaz de usuario; también puede activarse mediante llamadas a la API HTTP.

:::info{title="Nota"}
Al activar un evento posterior a la acción mediante una llamada a la API HTTP, también debe prestar atención al estado de habilitación del flujo de trabajo y si la configuración de la colección coincide; de lo contrario, la llamada podría no tener éxito o podría producirse un error.
:::

Para los flujos de trabajo vinculados localmente a un botón de acción, puede llamarlos de esta manera (usando como ejemplo el botón de creación de la colección `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Donde el parámetro URL `triggerWorkflows` es la clave del flujo de trabajo, con múltiples flujos de trabajo separados por comas. Esta clave se puede obtener al pasar el ratón sobre el nombre del flujo de trabajo en la parte superior del lienzo del flujo de trabajo:

![Flujo de trabajo_Clave_Método de visualización](https://static-docs.nocobase.com/20240426135108.png)

Después de que la llamada anterior sea exitosa, se activará el evento posterior a la acción de la colección `posts` correspondiente.

:::info{title="Nota"}
Dado que las llamadas externas también deben basarse en la identidad del usuario, al realizar llamadas a través de la API HTTP, al igual que las solicitudes enviadas desde la interfaz normal, se debe proporcionar información de autenticación, incluyendo el encabezado de solicitud `Authorization` o el parámetro `token` (el token obtenido al iniciar sesión), y el encabezado de solicitud `X-Role` (el nombre del rol actual del usuario).
:::

Si necesita activar un evento para datos de relación de uno a uno en esta acción (las relaciones de uno a muchos aún no son compatibles), puede usar `!` en el parámetro para especificar los datos disparadores del campo de relación:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Después de que la llamada anterior sea exitosa, se activará el evento posterior a la acción de la colección `categories` correspondiente.

:::info{title="Nota"}
Si el evento está configurado en modo global, no necesita usar el parámetro URL `triggerWorkflows` para especificar el flujo de trabajo correspondiente. Simplemente llamando a la acción de la colección correspondiente se activará.
:::

## Preguntas Frecuentes

### Diferencia con el Evento Pre-Acción

*   Evento Pre-Acción: Se activa antes de que se ejecute una acción (como añadir, actualizar, etc.). Antes de que se ejecute la acción, los datos solicitados pueden ser validados o procesados en el flujo de trabajo. Si el flujo de trabajo se termina (la solicitud es interceptada), la acción (añadir, actualizar, etc.) no se ejecutará.
*   Evento Post-Acción: Se activa después de que una acción del usuario se ha completado con éxito. En este punto, los datos ya se han enviado con éxito y se han guardado en la base de datos, y los procesos relacionados pueden seguir procesándose basándose en el resultado exitoso.

Como se muestra en la siguiente figura:

![Orden de ejecución de la acción](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Diferencia con el Evento de Colección

Los eventos posteriores a la acción y los eventos de colección son similares en el sentido de que ambos son procesos que se activan después de cambios en los datos. Sin embargo, sus niveles de implementación son diferentes. Los eventos posteriores a la acción operan a nivel de API, mientras que los eventos de colección se refieren a los cambios de datos dentro de la colección.

Los eventos de colección están más cerca de la capa subyacente del sistema. En algunos casos, un cambio de datos causado por un evento puede activar otro evento, creando una reacción en cadena. Especialmente cuando los datos en algunas colecciones asociadas también cambian durante la operación de la colección actual, los eventos relacionados con la colección asociada también pueden activarse.

La activación de eventos de colección no incluye información relacionada con el usuario. En contraste, los eventos posteriores a la acción están más cerca del lado del usuario y son el resultado de las acciones del usuario. El contexto del flujo de trabajo también contendrá información relacionada con el usuario, lo que los hace adecuados para manejar procesos relacionados con las acciones del usuario. En el diseño futuro de NocoBase, es posible que se amplíen más eventos posteriores a la acción que puedan utilizarse para la activación, por lo que **se recomienda más usar los eventos posteriores a la acción** para manejar procesos donde los cambios de datos son causados por acciones del usuario.

Otra diferencia es que los eventos posteriores a la acción pueden vincularse localmente a botones de formulario específicos. Si hay varios formularios, las entregas de algunos formularios pueden activar el evento, mientras que otras no. Los eventos de colección, por otro lado, son para cambios de datos en toda la colección y no pueden vincularse localmente.