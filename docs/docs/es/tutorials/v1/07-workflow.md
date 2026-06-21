# Capítulo 7: Workflow

<iframe  width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113600643469156&bvid=BV1qqidYQER8&cid=27196394345&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

¡Enhorabuena por llegar al último capítulo! Aquí presentaremos y exploraremos brevemente la potente función de workflow de **NocoBase**. Con esta funcionalidad podrá automatizar operaciones sobre las tareas del sistema, ahorrar tiempo y aumentar la eficiencia.

### Solución del reto del capítulo anterior

Antes de comenzar, repasemos el reto. Conseguimos configurar los **permisos de comentarios** del rol "Compañero" como sigue:

1. **Permiso de creación**: permite al usuario publicar comentarios.
2. **Permiso de visualización**: permite al usuario ver todos los comentarios.
3. **Permiso de edición**: el usuario solo puede editar los comentarios que él mismo ha publicado.
4. **Permiso de eliminación**: el usuario solo puede eliminar sus propios comentarios.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172247599.gif)

Con esta configuración, Tom puede no solo publicar comentarios libremente, sino también ver los del resto del equipo, mientras que solo él puede editar y eliminar los suyos.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248463.gif)

---

Ahora vamos a implementar una funcionalidad automatizada: **cada vez que se cambie el responsable de una tarea, el sistema enviará automáticamente una notificación al nuevo responsable para avisarle de que asume la tarea**.

> **Workflow:** El plugin Workflow es una potente herramienta de automatización, habitual en el ámbito de la gestión de procesos de negocio (BPM).
>
> Permite diseñar y orquestar procesos de negocio basados en modelos de datos, mediante la configuración de condiciones de disparo y nodos de proceso para automatizar el flujo. Es especialmente adecuado para procesar tareas repetitivas y orientadas a datos.

### 7.1 Crear el workflow

#### 7.1.1 Crear el workflow desde la página de administración

Cambie al rol **Root**, el rol de administrador del sistema con todos los permisos. A continuación, entre en el [**módulo de Workflow**](https://docs-cn.nocobase.com/handbook/workflow).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248323.png)

Haga clic en el botón **Añadir** de la esquina superior derecha para crear un nuevo workflow y rellene la información básica:

- **Nombre**: Generar notificación del sistema al cambiar de responsable.
- **Tipo de disparador**: seleccione "Evento de tabla".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248425.png)

#### 7.1.2 Explicación de los tipos de disparador:

1. [**Evento de tabla**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection): se dispara cuando cambia la información de una tabla (alta, modificación o eliminación). Es ideal para hacer seguimiento a cambios de campos, como el cambio de responsable.
2. [**Tarea programada**](https://docs-cn.nocobase.com/handbook/workflow/triggers/schedule): se dispara automáticamente en momentos concretos; es perfecta para automatizaciones ligadas a horarios.
3. [**Evento posterior a una operación**](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action): se asocia a un botón de operación y se dispara cuando el usuario realiza la acción. Por ejemplo, al pulsar el botón "Guardar".

Más adelante descubriremos otros tipos de disparador, como "evento previo a la operación", "evento personalizado", "aprobación", etc., todos ellos disponibles mediante los plugins correspondientes.

En este escenario, usaremos [**Evento de tabla**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection) para hacer seguimiento del cambio del campo "Responsable" en la "tabla de tareas". Tras enviar el workflow, haga clic en **Configuración** para entrar en su pantalla de configuración.

![demov3N-37.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248988.gif)

---

### 7.2 Configurar los nodos del workflow

#### 7.2.1 Configurar la condición de disparo

Sin más demora, ¡construyamos el flujo de notificación automática!

Configuramos el primer nodo y definimos las condiciones que harán que el workflow se inicie automáticamente:

- **Tabla**: seleccione "Tabla de tareas". (Es la tabla que dispara el workflow; sus datos también se cargarán en él. Naturalmente queremos que el workflow comience cuando cambie la "tabla de tareas").
- **Momento del disparo**: seleccione "Tras crear o actualizar datos".
- **Campos disparadores**: seleccione "Responsable".
- **Condición**: seleccione "ID del Responsable existe", para asegurarse de que solo se envía la notificación cuando se ha asignado un responsable.
- **Datos pre-cargados**: seleccione "Responsable", para poder usar su información en pasos posteriores.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172249330.gif)

---

#### 7.2.2 Habilitar el canal de "mensaje interno"

A continuación crearemos un nodo de envío de notificaciones.

Antes hay que crear un canal de [mensaje interno](https://docs-cn.nocobase.com/handbook/notification-in-app-message) que utilizaremos para enviar las notificaciones.

- Vuelva a la pantalla de gestión de plugins y seleccione "Gestión de notificaciones"; cree el canal "Notificación de tarea" (task_message).
- Una vez creado, vuelva al workflow y añada un nodo de **Notificación**.
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250497.gif)
- Configuración del nodo:
  **Canal:** seleccione "Notificación de tarea".
  **Destinatario:** seleccione "Variable del disparador / Datos del disparador / Responsable / ID", así apuntaremos al nuevo responsable tras el cambio.
  **Asunto del mensaje:** escriba "Aviso de cambio de responsable".
  **Cuerpo del mensaje:** escriba "Se le ha asignado como nuevo responsable".

Tras finalizar, haga clic en el interruptor de la esquina superior derecha para habilitar el workflow.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250472.gif)

¡Configuración lista!

#### 7.2.3 Probar la notificación

Llega el momento emocionante. Volvemos a la página, editamos cualquier tarea, cambiamos el responsable y hacemos clic en enviar. ¡El sistema envía la notificación!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250461.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250998.gif)

---

Este es el flujo de configuración del workflow, pero todavía nos queda trabajo:

La notificación generada debe insertar dinámicamente la información de la tarea, de lo contrario nadie sabrá qué tarea se le ha traspasado.

### 7.3 Mejorar el workflow

#### 7.3.1 Gestión de versiones

Al volver a la configuración del workflow se dará cuenta de que la pantalla está atenuada y no se puede editar.

Tranquilo: haga clic en los tres puntos de la esquina superior derecha > [**Copiar a nueva versión**](https://docs-cn.nocobase.com/handbook/workflow/advanced/revisions) y entrará en la pantalla de configuración de la nueva versión. Por supuesto, las versiones anteriores se conservan; haga clic en **Versiones** para cambiar entre ellas en cualquier momento (atención: las versiones de workflow ya ejecutadas no se pueden modificar).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251594.gif)

#### 7.3.2 Personalizar el contenido de la notificación

Personalicemos el contenido de la notificación añadiendo detalles del traspaso.

- **Edite el nodo de notificación.**

Cambie el cuerpo del mensaje a: "La tarea «【Nombre de la tarea】» ha cambiado de responsable a: 【Apodo del responsable】"

- Haga clic en el panel de variables de la derecha para insertar el nombre de la tarea y el responsable.
- Después, en la esquina superior derecha, habilite esta versión.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251780.gif)

Tras habilitar la versión actualizada, al volver a probar, la notificación del sistema mostrará el nombre de la tarea correspondiente.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251734.gif)

---

### Resumen

¡Bien hecho! Ha creado con éxito un workflow automatizado basado en el cambio de responsable de las tareas. Esta función no solo ahorra tiempo de operaciones manuales, sino que mejora la eficiencia de la colaboración del equipo. Con esto, nuestro sistema de gestión de tareas dispone de funcionalidades realmente potentes.

---

### Conclusión y siguientes pasos

Hasta aquí, ha construido desde cero un sistema completo de gestión de tareas, que cubre la creación de tareas, los comentarios, la configuración de roles y permisos, e incluso el workflow y las notificaciones del sistema.

La flexibilidad y extensibilidad de NocoBase le abren un sinfín de posibilidades. Más adelante podrá explorar más plugins, personalizar funciones o construir lógicas de negocio más complejas. Tras este recorrido domina ya el uso básico y los conceptos clave de NocoBase.

¡Esperamos su próxima creación! Si tiene cualquier duda, consulte la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o únase al [foro de la comunidad NocoBase](https://forum.nocobase.com/).

¡Siga explorando y cree posibilidades sin límite!
