---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Procesamiento manual

## Introducción

Cuando un proceso de negocio no puede automatizar completamente la toma de decisiones, puede utilizar un nodo manual para delegar parte de esa autoridad a una persona.

Cuando se ejecuta un nodo manual, este interrumpe la ejecución completa del **flujo de trabajo** y genera una tarea pendiente para el usuario correspondiente. Después de que el usuario envía la tarea, el **flujo de trabajo** continuará, permanecerá pendiente o se terminará, según el estado seleccionado. Esto es muy útil en escenarios como los procesos de aprobación.

## Instalación

Es un **plugin** incorporado, por lo que no requiere instalación.

## Crear nodo

En la interfaz de configuración del **flujo de trabajo**, haga clic en el botón de signo más ("+") dentro del flujo para añadir un nodo de "Procesamiento manual":

![Crear nodo manual](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Configurar nodo

### Responsable

Un nodo manual requiere que se asigne un usuario como responsable de ejecutar la tarea pendiente. La lista de tareas pendientes se puede añadir como un bloque en una página, y el contenido de la ventana emergente de la tarea para cada nodo debe configurarse en la interfaz del nodo.

Seleccione un usuario, o elija la clave primaria o foránea de los datos de usuario del contexto a través de una variable.

![Nodo manual_Configurar_Responsable_Seleccionar variable](https://static-docs.nocobase.com/22fbca3b8e21fda3a831019037001445.png)

:::info{title=Nota}
Actualmente, la opción de responsable para los nodos manuales no admite a varios usuarios. Esta funcionalidad se incluirá en una versión futura.
:::

### Configurar interfaz de usuario

La configuración de la interfaz para las tareas pendientes es el contenido central del nodo manual. Puede hacer clic en el botón "Configurar interfaz de usuario" para abrir una ventana emergente de configuración independiente, que puede configurar de forma WYSIWYG (lo que ve es lo que obtiene), al igual que una página normal.

![Nodo manual_Configuración de nodo_Configuración de interfaz](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Pestañas

Las pestañas se pueden utilizar para diferenciar distintos contenidos. Por ejemplo, una pestaña para el envío de un formulario de aprobación, otra para el envío de un formulario de rechazo, o para mostrar los detalles de datos relacionados. Se pueden configurar libremente.

#### Bloques

Los tipos de bloques admitidos se dividen principalmente en dos categorías: bloques de datos y bloques de formulario. Además, Markdown se utiliza principalmente para contenido estático, como mensajes informativos.

##### Bloque de datos

Los bloques de datos pueden mostrar datos de un disparador o los resultados del procesamiento de cualquier nodo, proporcionando información contextual relevante al responsable de la tarea pendiente. Por ejemplo, si el **flujo de trabajo** se activa por un evento de formulario, puede crear un bloque de detalles para los datos del disparador. Esto es coherente con la configuración de detalles de una página normal, permitiéndole seleccionar cualquier campo disponible en los datos del disparador para su visualización.

![Nodo manual_Configuración de nodo_Configuración de interfaz_Bloque de datos_Disparador](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Los bloques de datos de nodo son similares; puede seleccionar el resultado de los datos de un nodo anterior para mostrarlo como detalles. Por ejemplo, el resultado de un nodo de cálculo anterior puede servir como información de referencia contextual para la tarea pendiente del responsable.

![Nodo manual_Configuración de nodo_Configuración de interfaz_Bloque de datos_Datos de nodo](https://static-docs.nocobase.com/a583e26e508e954b47e5ddff80d998c4.png)

:::info{title=Nota}
Dado que el **flujo de trabajo** no se encuentra en estado de ejecución durante la configuración de la interfaz, no se muestran datos específicos en los bloques de datos. Los datos relevantes para una instancia de **flujo de trabajo** específica solo se podrán ver en la interfaz emergente de tareas pendientes una vez que el **flujo de trabajo** haya sido activado y ejecutado.
:::

##### Bloque de formulario

En la interfaz de tareas pendientes, debe configurar al menos un bloque de formulario para gestionar la decisión final sobre si el **flujo de trabajo** debe continuar. No configurar un formulario impedirá que el **flujo de trabajo** progrese después de ser interrumpido. Existen tres tipos de bloques de formulario:

- Formulario personalizado
- Formulario de creación de registros
- Formulario de actualización de registros

![Nodo manual_Configuración de nodo_Configuración de interfaz_Tipos de formulario](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Los formularios de creación de registros y de actualización de registros requieren seleccionar una **colección** base. Después de que el usuario de la tarea pendiente envíe el formulario, los valores introducidos se utilizarán para crear o actualizar datos en la **colección** especificada. Un formulario personalizado le permite definir libremente un formulario temporal que no está vinculado a una **colección**. Los valores de los campos enviados por el usuario de la tarea pendiente pueden utilizarse en nodos posteriores.

Los botones de envío del formulario se pueden configurar en tres tipos:

- Enviar y continuar **flujo de trabajo**
- Enviar y terminar **flujo de trabajo**
- Solo guardar valores del formulario

![Nodo manual_Configuración de nodo_Configuración de interfaz_Botones de formulario](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

Los tres botones representan tres estados de nodo en el proceso del **flujo de trabajo**. Después del envío, el estado del nodo cambia a "Completado", "Rechazado" o permanece en estado "Pendiente". Un formulario debe tener configurado al menos uno de los dos primeros para determinar el flujo de procesamiento posterior de todo el **flujo de trabajo**.

En el botón "Continuar **flujo de trabajo**", puede configurar asignaciones para los campos del formulario:

![Nodo manual_Configuración de nodo_Configuración de interfaz_Botón de formulario_Establecer valores de formulario](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Nodo manual_Configuración de nodo_Configuración de interfaz_Botón de formulario_Ventana emergente de valores de formulario](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Después de abrir la ventana emergente, puede asignar valores a cualquier campo del formulario. Una vez enviado el formulario, este valor será el valor final del campo. Esto es particularmente útil al revisar datos. Puede usar varios botones diferentes de "Continuar **flujo de trabajo**" en un formulario, y cada botón puede establecer diferentes valores enumerados para campos similares al estado, logrando así el efecto de continuar la ejecución del **flujo de trabajo** posterior con diferentes valores de datos.

## Bloque de tareas pendientes

Para el procesamiento manual, también necesita añadir una lista de tareas pendientes a una página para mostrar las tareas. Esto permite que el personal relevante acceda y gestione las tareas específicas del nodo manual a través de esta lista.

### Añadir bloque

Puede seleccionar "Tareas pendientes del **flujo de trabajo**" de los bloques de una página para añadir un bloque de lista de tareas pendientes:

![Nodo manual_Añadir bloque de tareas pendientes](https://static-docs.nocobase.com/198b41754cd73b704267bf30fe5e647.png)

Ejemplo de bloque de lista de tareas pendientes:

![Nodo manual_Lista de tareas pendientes](https://static-docs.nocobase.com/cfefb05d6b220f34.png)

### Detalles de la tarea pendiente

Posteriormente, el personal relevante puede hacer clic en la tarea pendiente correspondiente para abrir la ventana emergente de tareas pendientes y realizar el procesamiento manual:

![Nodo manual_Detalles de la tarea pendiente](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Ejemplo

### Revisión de publicaciones

Supongamos que una publicación enviada por un usuario normal necesita ser aprobada por un administrador antes de que pueda actualizarse a un estado publicado. Si el **flujo de trabajo** es rechazado, la publicación permanecerá en estado de borrador (no pública). Este proceso se puede implementar utilizando un formulario de actualización en un nodo manual.

Cree un **flujo de trabajo** activado por "Crear publicación" y añada un nodo manual:

<figure>
  <img alt="Nodo manual_Ejemplo_Revisión de publicaciones_Orquestación de flujo de trabajo" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

En el nodo manual, configure al administrador como responsable. En la configuración de la interfaz, añada un bloque basado en los datos del disparador para mostrar los detalles de la nueva publicación:

<figure>
  <img alt="Nodo manual_Ejemplo_Revisión de publicaciones_Configuración de nodo_Bloque de detalles" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

En la configuración de la interfaz, añada un bloque basado en un formulario de actualización de registros, seleccione la **colección** de publicaciones, para que el administrador decida si aprueba. Después de la aprobación, la publicación correspondiente se actualizará según otras configuraciones posteriores. Después de añadir el formulario, por defecto habrá un botón "Continuar **flujo de trabajo**", que puede considerarse como "Aprobar". Luego, añada un botón "Terminar **flujo de trabajo**" para usarlo en caso de rechazo:

<figure>
  <img alt="Nodo manual_Ejemplo_Revisión de publicaciones_Configuración de nodo_Formulario y acciones" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Al continuar con el **flujo de trabajo**, necesitamos actualizar el estado de la publicación. Hay dos formas de configurar esto. Una es mostrar el campo de estado de la publicación directamente en el formulario para que el operador lo seleccione. Este método es más adecuado para situaciones que requieren rellenar activamente el formulario, como proporcionar comentarios:

<figure>
  <img alt="Nodo manual_Ejemplo_Revisión de publicaciones_Configuración de nodo_Campos de formulario" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Para simplificar la tarea del operador, otra forma es configurar la asignación de valores del formulario en el botón "Continuar **flujo de trabajo**". En la asignación, añada un campo "Estado" con el valor "Publicado". Esto significa que cuando el operador haga clic en el botón, la publicación se actualizará al estado de publicado:

<figure>
  <img alt="Nodo manual_Ejemplo_Revisión de publicaciones_Configuración de nodo_Asignación de formulario" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Luego, desde el menú de configuración en la esquina superior derecha del bloque de formulario, seleccione la condición de filtro para los datos a actualizar. Aquí, seleccione la **colección** "Publicaciones", y la condición de filtro es "ID `igual a` variable de disparador / datos de disparador / ID":

<figure>
  <img alt="Nodo manual_Ejemplo_Revisión de publicaciones_Configuración de nodo_Condición de formulario" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Finalmente, puede modificar los títulos de cada bloque, el texto de los botones relevantes y el texto de ayuda de los campos del formulario para hacer la interfaz más fácil de usar:

<figure>
  <img alt="Nodo manual_Ejemplo_Revisión de publicaciones_Configuración de nodo_Formulario final" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Cierre el panel de configuración y haga clic en el botón de enviar para guardar la configuración del nodo. El **flujo de trabajo** ya está configurado. Después de habilitar este **flujo de trabajo**, se activará automáticamente al crear una nueva publicación. El administrador podrá ver que este **flujo de trabajo** necesita ser procesado en la lista de tareas pendientes. Al hacer clic para ver, podrá consultar los detalles de la tarea pendiente:

<figure>
  <img alt="Nodo manual_Ejemplo_Revisión de publicaciones_Lista de tareas pendientes" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="Nodo manual_Ejemplo_Revisión de publicaciones_Detalles de la tarea pendiente" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

El administrador puede realizar un juicio manual basándose en los detalles de la publicación para decidir si esta puede ser publicada. Si es así, al hacer clic en el botón "Aprobar", la publicación se actualizará al estado de publicado. Si no, al hacer clic en el botón "Rechazar", la publicación permanecerá en estado de borrador.

## Aprobación de solicitudes de permiso

Supongamos que un empleado necesita solicitar un permiso, el cual debe ser aprobado por un supervisor para que sea efectivo, y los datos de permiso correspondientes del empleado deben ser descontados. Además, independientemente de la aprobación o el rechazo, se utilizará un nodo de solicitud HTTP para llamar a una API de SMS y enviar un mensaje de notificación al empleado (consulte la sección [Solicitud HTTP](#_HTTP_请求)). Este escenario se puede implementar utilizando un formulario personalizado en un nodo manual.

Cree un **flujo de trabajo** activado por "Crear solicitud de permiso" y añada un nodo manual. Esto es similar al proceso anterior de revisión de publicaciones, pero aquí el responsable es el supervisor. En la configuración de la interfaz, añada un bloque basado en los datos del disparador para mostrar los detalles de la nueva solicitud de permiso. Luego, añada otro bloque basado en un formulario personalizado para que el supervisor decida si aprueba. En el formulario personalizado, añada un campo para el estado de aprobación y un campo para el motivo del rechazo:

<figure>
  <img alt="Nodo manual_Ejemplo_Aprobación de solicitudes de permiso_Configuración de nodo" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

A diferencia del proceso de revisión de publicaciones, dado que necesitamos continuar con el **flujo de trabajo** posterior basándonos en el resultado de la aprobación del supervisor, aquí solo configuramos un botón "Continuar **flujo de trabajo**" para el envío, sin utilizar un botón "Terminar **flujo de trabajo**".

Al mismo tiempo, después del nodo manual, podemos usar un nodo condicional para determinar si el supervisor ha aprobado la solicitud de permiso. En la rama de aprobación, añada el procesamiento de datos para descontar el permiso, y después de que las ramas se fusionen, añada un nodo de solicitud para enviar una notificación por SMS al empleado. Esto da como resultado el siguiente **flujo de trabajo** completo:

<figure>
  <img alt="Nodo manual_Ejemplo_Aprobación de solicitudes de permiso_Orquestación de flujo de trabajo" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

La condición en el nodo condicional se configura como "Nodo manual / Datos de formulario personalizado / El valor del campo de aprobación es 'Aprobado'":

<figure>
  <img alt="Nodo manual_Ejemplo_Aprobación de solicitudes de permiso_Condición" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

Los datos en el nodo de envío de solicitud también pueden utilizar las variables de formulario correspondientes del nodo manual para diferenciar el contenido del SMS de aprobación y rechazo. Con esto se completa la configuración de todo el **flujo de trabajo**. Una vez habilitado, cuando un empleado envíe un formulario de solicitud de permiso, el supervisor podrá procesar la aprobación en sus tareas pendientes. La operación es básicamente similar al proceso de revisión de publicaciones.