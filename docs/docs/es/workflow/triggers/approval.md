---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Aprobación

## Introducción

La aprobación es un tipo de proceso diseñado específicamente para tareas iniciadas y procesadas manualmente, con el fin de decidir el estado de los datos relevantes. Se utiliza comúnmente para la automatización de oficinas u otros procesos de toma de decisiones manuales. Por ejemplo, permite crear y gestionar **flujos de trabajo** manuales para escenarios como "solicitudes de vacaciones", "aprobaciones de gastos" y "aprobaciones de compra de materias primas".

El **plugin** de Aprobación ofrece un tipo de **flujo de trabajo** (disparador) dedicado, "Aprobación (evento)", y un nodo de "Aprobación" exclusivo para este proceso. Al combinarlo con las **colecciones** y bloques personalizados únicos de NocoBase, usted puede crear y gestionar de forma rápida y flexible diversos escenarios de aprobación.

## Crear un flujo de trabajo

Al crear un **flujo de trabajo**, seleccione el tipo "Aprobación" para crear un **flujo de trabajo** de aprobación:

![Disparador de Aprobación_Crear Flujo de Trabajo de Aprobación](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Luego, en la interfaz de configuración del **flujo de trabajo**, haga clic en el disparador para abrir una ventana emergente y realizar más configuraciones.

## Configuración del Disparador

### Vincular una colección

El **plugin** de Aprobación de NocoBase está diseñado para ser flexible y puede utilizarse con cualquier **colección** personalizada. Esto significa que la configuración de aprobación no requiere reconfigurar el modelo de datos, sino que reutiliza directamente una **colección** existente. Por lo tanto, después de acceder a la configuración del disparador, primero debe seleccionar una **colección** para determinar qué datos de esta **colección** activarán este proceso al crearse o actualizarse:

![Disparador de Aprobación_Configuración del Disparador_Seleccionar Colección](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

Luego, en el formulario para crear (o editar) datos de la **colección** correspondiente, vincule este **flujo de trabajo** al botón de envío:

![Iniciar Aprobación_Vincular Flujo de Trabajo](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Después de esto, cuando un usuario envíe este formulario, se activará el **flujo de trabajo** de aprobación correspondiente. Los datos enviados no solo se guardarán en la **colección** respectiva, sino que también se capturarán como una instantánea en el **flujo de trabajo** de aprobación para que los revisores posteriores puedan consultarlos.

### Retirar

Si un **flujo de trabajo** de aprobación permite que el iniciador lo retire, debe habilitar el botón "Retirar" en la configuración de la interfaz del iniciador:

![Disparador de Aprobación_Configuración del Disparador_Permitir Retiro](https://static-docs.nocobase.com/20251029232544.png)

Una vez habilitado, una aprobación iniciada por este **flujo de trabajo** puede ser retirada por el iniciador antes de que cualquier aprobador la procese. Sin embargo, después de que cualquier aprobador en un nodo de aprobación posterior la haya procesado, ya no podrá ser retirada.

:::info{title=Nota}
Después de habilitar o eliminar el botón de retiro, debe hacer clic en guardar y enviar en la ventana emergente de configuración del disparador para que los cambios surtan efecto.
:::

### Configuración de la Interfaz del Formulario del Iniciador

Finalmente, debe configurar la interfaz del formulario del iniciador. Esta interfaz se utilizará para las acciones de envío al iniciar desde el bloque del centro de aprobación y al reiniciar después de un retiro. Haga clic en el botón de configuración para abrir la ventana emergente:

![Disparador de Aprobación_Configuración del Disparador_Formulario del Iniciador](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Puede añadir un formulario para la interfaz del iniciador basado en la **colección** vinculada, o añadir texto descriptivo (Markdown) para indicaciones y guía. El formulario es obligatorio; de lo contrario, el iniciador no podrá realizar ninguna acción al acceder a esta interfaz.

Después de añadir un bloque de formulario, al igual que en una interfaz de configuración de formulario normal, puede añadir componentes de campo de la **colección** correspondiente y organizarlos como necesite para estructurar el contenido a rellenar en el formulario:

![Disparador de Aprobación_Configuración del Disparador_Formulario del Iniciador_Configuración de Campos](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Además del botón de envío directo, también puede añadir un botón de acción "Guardar como borrador" para permitir un proceso de almacenamiento temporal:

![Disparador de Aprobación_Configuración del Disparador_Formulario del Iniciador_Configuración de Acciones](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Nodo de Aprobación

En un **flujo de trabajo** de aprobación, debe utilizar el nodo "Aprobación" dedicado para configurar la lógica operativa que permitirá a los aprobadores procesar (aprobar, rechazar o devolver) la aprobación iniciada. El nodo "Aprobación" solo puede utilizarse en **flujos de trabajo** de aprobación. Consulte [Nodo de Aprobación](../nodes/approval.md) para obtener más detalles.

## Configuración de Inicio de Aprobación

Después de configurar y habilitar un **flujo de trabajo** de aprobación, puede vincularlo al botón de envío del formulario de la **colección** correspondiente, permitiendo a los usuarios iniciar una aprobación al enviar:

![Iniciar Aprobación_Vincular Flujo de Trabajo](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Una vez vinculado el **flujo de trabajo**, cuando un usuario envía el formulario actual, se inicia una aprobación.

:::info{title=Nota}
Actualmente, el botón para iniciar una aprobación solo admite el botón 'Enviar' (o 'Guardar') en un formulario de creación o actualización. No es compatible con el botón 'Enviar al flujo de trabajo' (el cual solo puede vincularse a un 'Evento posterior a la acción').
:::

## Centro de Tareas Pendientes

El Centro de Tareas Pendientes ofrece un punto de entrada unificado para que los usuarios puedan ver y procesar sus tareas pendientes. Las aprobaciones iniciadas por el usuario actual y sus tareas pendientes pueden accederse a través del Centro de Tareas Pendientes en la barra de herramientas superior, y los diferentes tipos de tareas pendientes pueden visualizarse mediante la navegación izquierda.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Mis Solicitudes

#### Ver Aprobaciones Solicitadas

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Iniciar una Nueva Aprobación Directamente

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Mis Tareas Pendientes

#### Lista de Tareas Pendientes

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Detalles de Tarea Pendiente

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Iniciador

#### Iniciar desde una Colección

Para iniciar desde un bloque de datos, puede realizar una llamada como esta (utilizando el botón de creación de la **colección** `posts` como ejemplo):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Aquí, el parámetro URL `triggerWorkflows` es la clave del **flujo de trabajo**; múltiples claves de **flujo de trabajo** se separan por comas. Esta clave puede obtenerse al pasar el ratón sobre el nombre del **flujo de trabajo** en la parte superior del lienzo del **flujo de trabajo**:

![Flujo de Trabajo_Clave_Método de Visualización](https://static-docs.nocobase.com/20240426135108.png)

Tras una llamada exitosa, se activará el **flujo de trabajo** de aprobación para la **colección** `posts` correspondiente.

:::info{title="Nota"}
Dado que las llamadas externas también requieren basarse en la identidad del usuario, al realizar llamadas a través de la API HTTP, al igual que las solicitudes enviadas desde la interfaz regular, debe proporcionar información de autenticación, incluyendo el encabezado `Authorization` o el parámetro `token` (el token obtenido al iniciar sesión), y el encabezado `X-Role` (el nombre del rol actual del usuario).
:::

Si necesita activar un evento para datos relacionados uno a uno en esta acción (uno a muchos aún no es compatible), puede usar `!` en el parámetro para especificar los datos de activación para el campo de asociación:

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

Tras una llamada exitosa, se activará el evento de aprobación para la **colección** `categories` correspondiente.

:::info{title="Nota"}
Al activar un evento posterior a la acción mediante la API HTTP, también debe prestar atención al estado de habilitación del **flujo de trabajo** y a si la configuración de la **colección** coincide; de lo contrario, la llamada podría no tener éxito o podría generar un error.
:::

#### Iniciar desde el Centro de Aprobaciones

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parámetros**

*   `collectionName`: El nombre de la **colección** de destino para iniciar la aprobación. Obligatorio.
*   `workflowId`: El ID del **flujo de trabajo** utilizado para iniciar la aprobación. Obligatorio.
*   `data`: Los campos del registro de la **colección** creados al iniciar la aprobación. Obligatorio.
*   `status`: El estado del registro creado al iniciar la aprobación. Obligatorio. Los valores posibles incluyen:
    *   `0`: Borrador, indica que se guarda sin enviar para aprobación.
    *   `1`: Enviar para aprobación, indica que el iniciador envía la solicitud de aprobación, entrando en el proceso de aprobación.

#### Guardar y Enviar

Cuando una aprobación iniciada (o retirada) se encuentra en estado de borrador, puede guardarla o enviarla de nuevo a través de la siguiente API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Obtener Lista de Aprobaciones Solicitadas

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Retirar

El iniciador puede retirar un registro que se encuentra actualmente en aprobación a través de la siguiente API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parámetros**

*   `<approval id>`: El ID del registro de aprobación a retirar. Obligatorio.

### Aprobador

Una vez que el **flujo de trabajo** de aprobación entra en un nodo de aprobación, se crea una tarea pendiente para el aprobador actual. El aprobador puede completar la tarea de aprobación a través de la interfaz o mediante una llamada a la API HTTP.

#### Obtener Registros de Procesamiento de Aprobación

Las tareas pendientes son registros de procesamiento de aprobación. Puede obtener todos los registros de procesamiento de aprobación del usuario actual a través de la siguiente API:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Aquí, `approvalRecords` es un recurso de **colección**, por lo que puede utilizar condiciones de consulta comunes como `filter`, `sort`, `pageSize` y `page`.

#### Obtener un Único Registro de Procesamiento de Aprobación

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Aprobar y Rechazar

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parámetros**

*   `<record id>`: El ID del registro a procesar para aprobación. Obligatorio.
*   `status`: El campo de estado del procesamiento de aprobación. `2` significa "Aprobar", `-1` significa "Rechazar". Obligatorio.
*   `comment`: Información de comentarios para el procesamiento de aprobación. Opcional.
*   `data`: Representa las modificaciones realizadas en el registro de la **colección** del nodo de aprobación actual después de la aprobación. Opcional (solo efectivo al aprobar).

#### Devolver <Badge>v1.9.0+</Badge>

Antes de la versión v1.9.0, la devolución utilizaba la misma API que 'Aprobar' y 'Rechazar', usando `"status": 1` para representar una devolución.

A partir de la versión v1.9.0, la devolución tiene una API separada:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parámetros**

*   `<record id>`: El ID del registro a procesar para aprobación. Obligatorio.
*   `returnToNodeKey`: La clave del nodo de destino al que se debe devolver. Opcional. Cuando se configura un rango de nodos a los que se puede devolver en el nodo, este parámetro puede utilizarse para especificar a qué nodo se debe regresar. Si no se configura, no es necesario pasar este parámetro, y por defecto se devolverá al punto de inicio para que el iniciador lo vuelva a enviar.

#### Delegar

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parámetros**

*   `<record id>`: El ID del registro a procesar para aprobación. Obligatorio.
*   `assignee`: El ID del usuario al que se delega. Obligatorio.

#### Añadir Firmante

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parámetros**

*   `<record id>`: El ID del registro a procesar para aprobación. Obligatorio.
*   `assignees`: Una lista de IDs de usuario para añadir como firmantes. Obligatorio.
*   `order`: El orden del firmante añadido. `-1` indica antes de "mí", `1` indica después de "mí".