---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/workflow/triggers/approval).
:::

# Aprobación

## Introducción

La aprobación es una forma de proceso dedicada a ser iniciada y procesada por personas para decidir el estado de los datos relacionados. Generalmente se utiliza para la automatización de oficinas u otros asuntos de toma de decisiones manuales; por ejemplo, se pueden crear y gestionar procesos manuales para escenarios como "solicitudes de vacaciones", "aprobación de reembolsos de gastos" y "aprobación de compra de materias primas".

El plugin de Aprobación proporciona un tipo de flujo de trabajo (disparador) dedicado "Aprobación (evento)" y un nodo de "Aprobación" exclusivo para este proceso. Combinado con las colecciones y bloques personalizados característicos de NocoBase, permite crear y gestionar diversos escenarios de aprobación de forma rápida y flexible.

## Crear flujo de trabajo

Al crear un flujo de trabajo, seleccione el tipo "Aprobación" para crear un flujo de trabajo de aprobación:

![Disparador de aprobación_Crear flujo de trabajo de aprobación](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Después, en la interfaz de configuración del flujo de trabajo, haga clic en el disparador para abrir la ventana emergente y realizar más configuraciones.

## Configuración del disparador

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Vincular colección

El plugin de Aprobación de NocoBase está diseñado basándose en la flexibilidad y puede utilizarse con cualquier colección personalizada; es decir, la configuración de aprobación no necesita configurar repetidamente el modelo de datos, sino que reutiliza directamente las colecciones ya creadas. Por lo tanto, al entrar en la configuración del disparador, primero debe seleccionar una colección para decidir sobre qué datos de la colección actuará el proceso:

![Disparador de aprobación_Configuración del disparador_Seleccionar colección](https://static-docs.nocobase.com/20251226103223.png)

### Modo de activación

Al iniciar una aprobación para datos de negocio, puede elegir entre los siguientes dos modos de activación:

*   **Antes de guardar los datos**

    Inicia la aprobación antes de que se guarden los datos enviados. Es adecuado para escenarios donde los datos solo deben guardarse después de que la aprobación sea concedida. En este modo, los datos al momento de iniciar la aprobación son solo datos temporales y solo se guardarán formalmente en la colección correspondiente después de que se aprueben.

*   **Después de guardar los datos**

    Inicia la aprobación después de que se guarden los datos enviados. Es adecuado para escenarios donde los datos pueden guardarse primero y luego aprobarse. En este modo, los datos ya se han guardado en la colección correspondiente al iniciar la aprobación, y las modificaciones realizadas durante el proceso de aprobación también se guardarán.

### Ubicación para iniciar la aprobación

Puede elegir la ubicación en el sistema desde donde se inicia la aprobación:

*   **Solo iniciar en bloques de datos**

    Puede vincular la acción de cualquier bloque de formulario de esta tabla a este flujo de trabajo para iniciar la aprobación, y procesar y rastrear el proceso de aprobación en el bloque de aprobación de un solo registro. Generalmente es adecuado para datos de negocio.

*   **Iniciar tanto en bloques de datos como en el centro de tareas pendientes**

    Además de los bloques de datos, también puede iniciar y procesar aprobaciones en el centro de tareas pendientes global. Esto generalmente es adecuado para datos administrativos.

### Quién puede iniciar la aprobación

Puede configurar permisos basados en el alcance del usuario para decidir qué usuarios pueden iniciar esta aprobación:

*   **Todos los usuarios**

    Todos los usuarios del sistema pueden iniciar esta aprobación.

*   **Solo los usuarios seleccionados**

    Solo se permite a los usuarios dentro del alcance especificado iniciar esta aprobación. Se permite la selección múltiple.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Configuración de la interfaz del formulario del iniciador

Finalmente, debe configurar la interfaz del formulario del iniciador. Esta interfaz se utilizará para las operaciones de envío cuando se inicie desde el bloque del centro de aprobación y cuando el usuario vuelva a iniciar tras un retiro. Haga clic en el botón de configuración para abrir la ventana emergente:

![Disparador de aprobación_Configuración del disparador_Formulario del iniciador](https://static-docs.nocobase.com/20251226130239.png)

Puede añadir un formulario de llenado basado en la colección vinculada para la interfaz del iniciador, o un texto explicativo (Markdown) para indicaciones y guía. El formulario es obligatorio; de lo contrario, el iniciador no podrá operar al entrar en esta interfaz.

Después de añadir el bloque de formulario, al igual que en una interfaz de configuración de formulario normal, puede añadir componentes de campo de la colección correspondiente y organizarlos libremente para estructurar el contenido que debe completarse en el formulario:

![Disparador de aprobación_Configuración del disparador_Formulario del iniciador_Configuración de campos](https://static-docs.nocobase.com/20251226130339.png)

A diferencia del botón de envío directo, también puede añadir un botón de operación "Guardar borrador" para admitir procesos de almacenamiento temporal:

![Disparador de aprobación_Configuración del disparador_Formulario del iniciador_Configuración de operaciones_Guardar](https://static-docs.nocobase.com/20251226130512.png)

Si un flujo de trabajo de aprobación permite que el iniciador retire la solicitud, debe habilitar el botón "Retirar" en la configuración de la interfaz del iniciador:

![Disparador de aprobación_Configuración del disparador_Permitir retiro](https://static-docs.nocobase.com/20251226130637.png)

Una vez habilitado, la aprobación iniciada por este flujo puede ser retirada por el iniciador antes de que cualquier aprobador la procese. Sin embargo, después de que cualquier aprobador configurado en cualquier nodo de aprobación posterior la haya procesado, ya no podrá ser retirada.

:::info{title=Sugerencia}
Después de habilitar o eliminar el botón de retiro, debe hacer clic en guardar y enviar en la ventana emergente de configuración del disparador para que los cambios surtan efecto.
:::

### Tarjeta de "Mis solicitudes" <Badge>2.0+</Badge>

Se utiliza para configurar las tarjetas de tareas en la lista "Mis solicitudes" del centro de tareas pendientes.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

En la tarjeta, puede configurar libremente los campos de negocio que desea mostrar (excepto campos de relación) o información relacionada con la aprobación.

Después de que se cree la solicitud de aprobación, podrá ver la tarjeta de tarea personalizada en la lista del centro de tareas pendientes:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Modo de visualización de registros en el flujo

*   **Instantánea**

    En el flujo de trabajo de aprobación, es el estado del registro que el solicitante y los aprobadores ven al entrar, y después de enviar, solo verán los registros que ellos mismos modificaron; no verán las actualizaciones realizadas por otros posteriormente.

*   **Último**

    En el flujo de trabajo de aprobación, el solicitante y los aprobadores siempre ven la versión más reciente del registro durante todo el proceso, independientemente del estado del registro antes de su operación. Al finalizar el proceso, verán la versión final del registro.

## Nodo de aprobación

En un flujo de trabajo de aprobación, debe utilizar el nodo dedicado "Aprobación" para configurar la lógica de operación para que los aprobadores procesen (aprobar, rechazar o devolver) la aprobación iniciada. El nodo de "Aprobación" solo puede utilizarse en flujos de trabajo de aprobación. Consulte [Nodo de aprobación](../nodes/approval.md) para más detalles.

:::info{title=Sugerencia}
Si un flujo de trabajo de aprobación no contiene ningún nodo de "Aprobación", el flujo se aprobará automáticamente.
:::

## Configuración de inicio de aprobación

Después de configurar y habilitar un flujo de trabajo de aprobación, puede vincular dicho flujo al botón de envío del formulario de la colección correspondiente para que los usuarios inicien la aprobación al momento del envío:

![Iniciar aprobación_Vincular flujo de trabajo](https://static-docs.nocobase.com/20251226110710.png)

Posteriormente, el envío de dicho formulario por parte del usuario activará el flujo de trabajo de aprobación correspondiente. Los datos enviados, además de guardarse en la colección correspondiente, también se capturarán como una instantánea en el flujo de aprobación para la consulta de los aprobadores posteriores.

:::info{title=Sugerencia}
Actualmente, el botón para iniciar la aprobación solo admite el uso de los botones "Enviar" (o "Guardar") en formularios de creación o actualización; no admite el uso del botón "Activar flujo de trabajo" (este botón solo puede vincularse a "Eventos de acción personalizados").
:::

## Centro de tareas pendientes

El centro de tareas pendientes proporciona una entrada unificada para que los usuarios vean y procesen sus tareas pendientes. Tanto las aprobaciones iniciadas por el usuario actual como las tareas pendientes pueden accederse a través del centro de tareas pendientes en la barra de herramientas superior, y los diferentes tipos de tareas pueden visualizarse mediante la navegación izquierda.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Iniciadas por mí

#### Ver aprobaciones ya iniciadas

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Iniciar directamente una nueva aprobación

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Mis tareas pendientes

#### Lista de tareas pendientes

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Detalles de tarea pendiente

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Iniciador

#### Inicio desde colección

Para iniciar desde un bloque de datos, puede realizar una llamada como esta (usando el botón de creación de la tabla `posts` como ejemplo):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Donde el parámetro URL `triggerWorkflows` es la clave (key) del flujo de trabajo; múltiples flujos de trabajo se separan por comas. Esta clave puede obtenerse al pasar el ratón sobre el nombre del flujo de trabajo en la parte superior del lienzo del flujo de trabajo:

![Flujo de trabajo_key_método de visualización](https://static-docs.nocobase.com/20240426135108.png)

Tras una llamada exitosa, se activará el flujo de trabajo de aprobación para la tabla `posts` correspondiente.

:::info{title="Sugerencia"}
Dado que las llamadas externas también requieren basarse en la identidad del usuario, al realizar llamadas a través de la API HTTP, al igual que las solicitudes enviadas desde la interfaz normal, debe proporcionar información de autenticación, incluyendo el encabezado `Authorization` o el parámetro `token` (el token obtenido al iniciar sesión), y el encabezado `X-Role` (el nombre del rol actual del usuario).
:::

Si necesita activar eventos para datos de relación uno a uno en esta operación (uno a muchos aún no es compatible), puede usar `!` en los parámetros para especificar los datos de activación del campo de relación:

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

Tras la llamada exitosa anterior, se activará el evento de aprobación para la tabla `categories` correspondiente.

:::info{title="Sugerencia"}
Al activar eventos posteriores a la operación mediante la API HTTP, también debe prestar atención al estado de habilitación del flujo de trabajo y a si la configuración de la colección coincide; de lo contrario, la llamada podría no tener éxito o generar un error.
:::

#### Inicio desde el centro de aprobaciones

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<nombre de la colección>",
    "workflowId": <id del flujo de trabajo>,
    "data": { "<campo>": "<valor>" },
    "status": <estado inicial de aprobación>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parámetros**

* `collectionName`: Nombre de la colección de destino para iniciar la aprobación, obligatorio.
* `workflowId`: ID del flujo de trabajo utilizado para iniciar la aprobación, obligatorio.
* `data`: Campos del registro de la colección creados al iniciar la aprobación, obligatorio.
* `status`: Estado del registro creado al iniciar la aprobación, obligatorio. Los valores posibles incluyen:
  * `0`: Borrador, indica que se guarda pero no se envía a aprobación.
  * `2`: Enviar aprobación, indica que el iniciador envía la solicitud de aprobación y entra en el proceso de aprobación.

#### Guardar y enviar

Cuando una aprobación iniciada (o retirada) está en estado de borrador, puede guardarla o enviarla de nuevo a través de la siguiente interfaz:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<campo>": "<valor>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<id de aprobación>"
```

#### Obtener lista de aprobaciones iniciadas

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Retirar

El iniciador puede retirar un registro que se encuentra actualmente en aprobación a través de la siguiente interfaz:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<id de aprobación>"
```

**Parámetros**

* `<id de aprobación>`: ID del registro de aprobación a retirar, obligatorio.

### Aprobador

Una vez que el flujo de trabajo de aprobación entra en un nodo de aprobación, se crea una tarea pendiente para el aprobador actual. El aprobador puede completar la tarea de aprobación a través de la interfaz o mediante una llamada a la API HTTP.

#### Obtener registros de procesamiento de aprobación

Las tareas pendientes son registros de procesamiento de aprobación. Puede obtener todos los registros de procesamiento de aprobación del usuario actual a través de la siguiente interfaz:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Donde `approvalRecords`, como recurso de colección, también puede utilizar condiciones de consulta comunes como `filter`, `sort`, `pageSize` y `page`.

#### Obtener un único registro de procesamiento de aprobación

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<id del registro>"
```

#### Aprobar y rechazar

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Me parece bien.",
    "data": { "<campo a modificar>": "<valor>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<id del registro>"
```

**Parámetros**

* `<id del registro>`: ID del registro de procesamiento de aprobación pendiente, obligatorio.
* `status`: El campo es el estado del procesamiento de aprobación, `2` significa "Aprobar", `-1` significa "Rechazar", obligatorio.
* `comment`: Información de comentarios del procesamiento de aprobación, opcional.
* `data`: Representa las modificaciones realizadas en el registro de la colección del nodo de aprobación actual después de la aprobación, opcional (solo efectivo al aprobar).

#### Devolver <Badge>v1.9.0+</Badge>

Antes de la versión v1.9.0, la devolución utilizaba la misma interfaz que "Aprobar" y "Rechazar", usando `"status": 1` para representar la devolución.

A partir de la versión v1.9.0, la devolución tiene una interfaz separada:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<clave del nodo>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<id del registro>"
```

**Parámetros**

* `<id del registro>`: ID del registro de procesamiento de aprobación pendiente, obligatorio.
* `returnToNodeKey`: Clave del nodo de destino para la devolución, opcional. Cuando se configura un rango de nodos a los que se puede devolver en el nodo, se puede usar este parámetro para especificar a qué nodo devolver. Si no se configura, no es necesario pasar este parámetro y, por defecto, se devolverá al punto de inicio para que el iniciador lo vuelva a enviar.

#### Delegar

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <id de usuario>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<id del registro>"
```

**Parámetros**

* `<id del registro>`: ID del registro de procesamiento de aprobación pendiente, obligatorio.
* `assignee`: ID del usuario al que se delega, obligatorio.

#### Añadir firmante

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<id de usuario>],
    "order": <orden>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<id del registro>"
```

**Parámetros**

* `<id del registro>`: ID del registro de procesamiento de aprobación pendiente, obligatorio.
* `assignees`: Lista de IDs de usuario para añadir como firmantes, obligatorio.
* `order`: Orden del firmante añadido, `-1` indica antes de "mí", `1` indica después de "mí".