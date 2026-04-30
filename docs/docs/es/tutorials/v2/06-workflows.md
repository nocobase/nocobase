# Capítulo 6: Workflow — que el sistema trabaje solo

En el capítulo anterior añadimos permisos al sistema, y los distintos roles ven contenidos distintos. Pero todas las operaciones aún las hace una persona: cuando llega un ticket nuevo hay que mirarlo, cuando cambia el estado nadie se entera.

En este capítulo, usaremos los [Workflow](/workflow) de NocoBase para que el sistema **trabaje solo**: configuraremos nodos de [condición](/workflow/nodes/condition) y de [actualización](/workflow/nodes/update) automática para flujo automático del estado de los tickets y registro automático de la fecha de creación.

## 6.1 ¿Qué es un [Workflow](/workflow)?

Un Workflow es un conjunto de reglas automatizadas del tipo "si... entonces...".

Una analogía: imagine que en el móvil pone una alarma para las 8 de la mañana cada día. La alarma es el Workflow más simple: **si se cumple la condición (son las 8), se ejecuta automáticamente (suena)**.

Los Workflow de NocoBase siguen la misma idea:

![06-workflows-2026-03-20-13-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-20-13-25-38.jpg)

- **[Disparador](/workflow/triggers/collection)**: la entrada al Workflow. Por ejemplo, "alguien creó un ticket nuevo" o "se actualizó cierto registro".
- **Evaluación condicional**: paso de filtrado opcional. Por ejemplo, "solo continuar si el responsable no está vacío".
- **Acción a ejecutar**: el paso que realmente trabaja. Por ejemplo, "enviar una notificación" o "actualizar un Field".

Las acciones de un Workflow pueden encadenar varios nodos. Tipos de nodos comunes:

- **Control de flujo**: condiciones, ramificaciones paralelas, bucles, retardo
- **Operaciones de datos**: crear, actualizar, consultar, eliminar
- **Notificaciones y externos**: notificaciones, peticiones HTTP, cálculos

Este tutorial solo usa los más comunes; al combinarlos podrá afrontar la mayoría de los escenarios.

### Tipos de disparadores

NocoBase ofrece varios tipos de disparadores que se eligen al crear el Workflow:

| Disparador | Descripción | Escenario típico |
|------------|-------------|------------------|
| [**Evento de tabla de datos**](/workflow/triggers/collection) | Se dispara al añadir, actualizar o eliminar datos | Notificación de nuevo ticket, registro de cambios de estado |
| [**Tarea programada**](/workflow/triggers/schedule) | Se dispara según expresión Cron o tiempo fijo | Generar informes diarios, limpieza periódica de datos |
| [**Evento posterior a una acción**](/workflow/triggers/action) | Se dispara después de que el usuario realiza una operación en la interfaz | Enviar notificación al enviar formulario, registrar log de operación |
| **Aprobación** | Inicia un flujo de aprobación, admite múltiples niveles | Aprobaciones de vacaciones, de compras |
| **Acción personalizada** | Vinculado a un botón personalizado, se dispara al hacer clic | Archivado con un solo clic, operaciones por lotes |
| **Evento previo a una acción** | Intercepta la operación, se ejecuta de forma síncrona y luego deja pasar | Validar antes de enviar, autocompletar Field |
| **Empleados de IA** | Proporciona el Workflow como herramienta para los empleados de IA | Que la IA ejecute operaciones de negocio automáticamente |

Este tutorial usa los disparadores **Evento de tabla de datos** y **Evento de acción personalizada**; los demás tipos funcionan de forma parecida y, una vez aprendidos estos, podrá deducir el resto.

Los Workflow de NocoBase son un Plugin integrado, no requieren instalación adicional, listo para usar.

## 6.2 Escenario 1: Notificar al responsable cuando se crea un ticket

**Necesidad**: cuando alguien crea un ticket y especifica al responsable, el sistema envía automáticamente un mensaje interno al responsable para que sepa que "tiene trabajo".

### Paso 1: Crear el Workflow

Abra el menú de configuración de plugins en la esquina superior derecha y vaya a **Gestión de Workflow**.

![06-workflows-2026-03-14-23-50-45](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-50-45.png)


Haga clic en **Nuevo** y, en el cuadro de diálogo:

- **Nombre**: «Notificar al responsable de nuevo ticket»
- **Tipo de disparador**: **Evento de tabla de datos**

![06-workflows-2026-03-14-23-53-37](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-53-37.png)


Tras enviar, haga clic en el enlace **Configurar** de la lista para entrar en la interfaz de edición del flujo.

### Paso 2: Configurar el disparador

Haga clic en la tarjeta del disparador en la parte superior para abrir el cajón de configuración:

- **[Tabla de datos](/data-sources/data-modeling/collection)**: seleccione fuente de datos principal / «Tickets»
- **Momento del disparo**: seleccione «Después de añadir o actualizar datos»
- **[Field](/data-sources/data-modeling/collection-fields) que han cambiado**: marque «Responsable (Assignee)» — solo se dispara si el Field Responsable cambia, evitando notificaciones innecesarias por modificaciones de otros Field (al añadir datos, todos los Field se consideran cambiados, así que la creación de un ticket también dispara)
- **Solo se dispara si se cumplen estas condiciones**: modo «Cumplir **cualquiera** de las condiciones del grupo»; añada dos condiciones:
  - `assignee_id` no está vacío
  - `Assignee / ID` no está vacío

  > ¿Por qué configurar dos condiciones? Porque en el momento del disparo, en el formulario puede haber solo la clave externa (assignee_id) sin que se haya consultado el objeto relacionado, o haber objeto relacionado pero la clave externa esté vacía. Las dos condiciones en relación OR garantizan que basta con que se haya especificado responsable para disparar.

- **Precarga de datos relacionados**: marque «Assignee» — el nodo de notificación posterior necesitará información del responsable, por lo que debe precargarse en el disparador

![06-workflows-2026-03-14-23-58-31](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-58-31.png)

Haga clic en guardar. Así, el disparador ya incluye la evaluación de condiciones — solo se dispara si el responsable no está vacío, sin necesidad de añadir un nodo de evaluación condicional adicional.

### Paso 3: Añadir el nodo de notificación

Haga clic en **+** debajo del disparador y seleccione el nodo **Notificación**.

![06-workflows-2026-03-15-00-00-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-00-55.png)

Abra la configuración del nodo de notificación; el primer ítem es seleccionar el **canal de notificación**, pero aún no hemos creado canales y la lista desplegable está vacía. Vamos a crear uno primero.

![06-workflows-2026-03-15-00-10-12](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-10-12.png)


### Paso 4: Crear un canal de notificación

NocoBase admite varios tipos de canales:

| Tipo de canal | Descripción |
|---------------|-------------|
| **Mensaje interno** | Notificación dentro del navegador, push en tiempo real al centro de notificaciones del usuario |
| **Correo electrónico** | Envío por SMTP, requiere configurar servidor de correo |

Este tutorial usa el canal más sencillo: **Mensaje interno**.

1. Abra la configuración de plugins en la esquina superior derecha y vaya a **Gestión de notificaciones**.
2. Pulse **Nuevo canal**.

![06-workflows-2026-03-15-00-13-07](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-13-07.png)

3. Tipo de canal: **Mensaje interno**, escriba un nombre (p. ej., «Mensajería interna del sistema»).
4. Guarde.

![06-workflows-2026-03-15-00-17-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-17-55.png)

### Paso 5: Configurar el nodo de notificación

Vuelva a la página de edición del Workflow y abra la configuración del nodo de notificación.

El nodo de notificación tiene los siguientes ajustes:

- **Canal de notificación**: seleccione la «Mensajería interna del sistema» recién creada
- **Destinatarios**: pulse seleccionar Consultar usuarios → «id = Variable del disparador / Datos disparados / Responsable / ID»
- **Título**: escriba el título de la notificación, p. ej., «Tiene un nuevo ticket por procesar». Admite insertar variables, por ejemplo añadir el título del ticket: `Nuevo ticket: {{Datos disparados / Título}}`
- **Contenido**: escriba el cuerpo de la notificación; igualmente puede insertar variables que referencien la prioridad, descripción y demás Field del ticket

![06-workflows-2026-03-15-20-10-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-10-11.png)

(En el siguiente paso vamos a obtener la dirección del ticket; ¡recuerde guardar antes de salir del popup!)

- **Página de detalles de escritorio**: introduzca la ruta URL de la página de detalles del ticket. Cómo obtenerla: en el frontend abra el popup de detalles de cualquier ticket y copie la ruta de la barra del navegador, con un formato similar a `/admin/camcwbox2uc/view/d8f8e122d37/filterbytk/353072988225540`. Pegue la ruta en el cuadro de configuración; la cifra que sigue a `filterbytk/` es el ID del ticket; reemplace esa parte con la variable de ID de los datos disparados (selector de variable → Datos disparados → ID). Una vez configurado, al pulsar la notificación en la lista, el usuario saltará directamente a la página de detalles del ticket y se marcará como leída

![06-workflows-2026-03-15-00-28-32](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-28-32.png)

![06-workflows-2026-03-15-20-15-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-15-19.png)

- **Continuar al fallar el envío**: opcional; si lo marca, el Workflow no se interrumpirá aunque falle el envío de la notificación

> Tras enviarse la notificación, el responsable la verá en el **centro de notificaciones** de la esquina superior derecha; las no leídas tendrán un punto rojo de aviso. Al pulsar la notificación se navegará a los detalles del ticket.

### Paso 6: Probar y habilitar

> El flujo completo del escenario 1 tiene solo dos nodos: disparador (con filtrado por condición) → notificación. Sencillo y directo.

Antes de habilitarlo, los Workflow ofrecen la función **Ejecución manual** para probar el flujo con datos concretos:

1. Haga clic en el botón **Ejecutar** de la esquina superior derecha (no el interruptor de habilitar)
2. Seleccione un ticket existente como datos del disparador
  > Si en el selector de tickets se muestra el id, en Fuente de datos > Tabla de datos > Tickets, configure la columna «Título» como Field título.
![06-workflows-2026-03-15-19-47-57](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-47-57.png)

3. Pulse Ejecutar; el Workflow se ejecutará y cambiará automáticamente a la nueva versión copiada
![06-workflows-2026-03-15-19-57-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-57-19.png)

4. Pulse los tres puntos de la esquina superior derecha y elija Historial de ejecución. Aquí verá el registro de la ejecución que acabamos de hacer; al verlo, podrá ver los detalles de la ejecución, incluyendo la situación del disparo, los detalles de cada nodo y los parámetros.
![06-workflows-2026-03-15-19-58-34](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-58-34.png)

![06-workflows-2026-03-15-20-01-02](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-01-02.png)


5. Parece que el ticket de antes era para Alice. Cambiemos a la cuenta de Alice — ¡recibida con éxito!

![06-workflows-2026-03-15-20-16-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-22.png)

Al hacer clic, navegará a la página del ticket correspondiente y la notificación se marcará automáticamente como leída.

![06-workflows-2026-03-15-20-16-54](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-54.png)


Una vez confirmado que el flujo funciona bien, pulse el interruptor **Habilitar/Deshabilitar** de la esquina superior derecha y ponga el Workflow en estado habilitado.

![06-workflows-2026-03-15-20-18-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-18-16.png)

> **Atención**: una vez que el Workflow se ha ejecutado (incluida la ejecución manual), pasa a estado de **solo lectura** (gris) y no se puede editar más. Si necesita modificarlo, pulse **«Copiar a nueva versión»** en la esquina superior derecha y siga editando en la versión nueva. La versión antigua se deshabilitará automáticamente.

![06-workflows-2026-03-15-20-19-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-19-11.png)

Vuelva a la página de tickets, cree uno nuevo y recuerde seleccionar a un responsable. Luego cambie a la cuenta del responsable y revise el centro de notificaciones — debería ver una notificación nueva.

![06-workflows-2026-03-15-20-22-00](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-22-00.gif)

¡Felicidades, su primer flujo automatizado está en marcha!

## 6.3 Escenario 2: Registrar automáticamente la fecha de finalización al cambiar de estado

**Necesidad**: cuando el estado del ticket pasa a «Completado», el sistema rellena automáticamente el Field «Fecha de finalización» con la fecha y hora actuales. Así no hay que registrarlo a mano y no se olvida.

> Si aún no ha creado el Field «Fecha de finalización» en la tabla de tickets, vaya a **Gestión de tablas → Tickets** y añada un Field de tipo **Fecha** llamado «Fecha de finalización». Para los pasos consulte el método de creación de Field del Capítulo 2; aquí no se repiten.
> ![06-workflows-2026-03-15-20-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-25-38.png)

### Paso 1: Crear el Workflow

Vuelva a la página de gestión de Workflow y pulse Nuevo:

- **Nombre**: «Registrar automáticamente la fecha al completar el ticket»
- **Tipo de disparador**: **Evento de acción personalizada** (se dispara cuando el usuario hace clic en el botón vinculado al Workflow)
- **Modo de ejecución**: síncrono
> Sobre síncrono y asíncrono:
> - Asíncrono: tras la operación, podemos seguir haciendo otras cosas; el Workflow se ejecuta automáticamente y nos notifica el resultado
> - Síncrono: tras la operación, la interfaz queda en espera hasta que finalice el Workflow para poder hacer otra cosa

![06-workflows-2026-03-19-22-56-34](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-56-34.png)

### Paso 2: Configurar el disparador

Abra la configuración del disparador:

- **Tabla de datos**: seleccione «Tickets»
- **Modo de ejecución**: seleccione **Modo de fila única** (cada vez se procesa solo el ticket sobre el que se ha hecho clic)

![06-workflows-2026-03-19-22-58-21](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-58-21.png)

<!-- TODO: Añadir captura de configuración del disparador -->


### Paso 3: Añadir un nodo de evaluación condicional

A diferencia del disparador de evento de tabla de datos, que ya incluye la condición, aquí debemos añadir un nodo de evaluación condicional manualmente:

![06-workflows-2026-03-15-20-39-14](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-39-14.png)

Recomendamos elegir «Continuar por «Sí» y «No» por separado», para facilitar futuras ampliaciones.

- Condición: **Datos disparados → Estado** distinto de **Completado** (es decir, solo pasarán los tickets aún no completados; los ya completados no se procesan de nuevo)

![06-workflows-2026-03-19-22-37-59](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-37-59.png)

### Paso 4: Añadir el nodo de actualización de datos

En la rama «Sí» de la evaluación, pulse **+** y seleccione el nodo **Actualizar datos**:

![06-workflows-2026-03-15-20-46-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-46-22.png)

- **Tabla de datos**: seleccione «Tickets»
- **Condición de filtrado**: ID igual a Datos disparados → ID (asegura que solo se actualice este ticket)
- **Valores de Field**:
  - Estado = **Completado**
  - Fecha de finalización = **Variable del sistema / Hora del sistema**

![06-workflows-2026-03-19-22-39-27](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-39-27.png)

> Así un solo nodo realiza a la vez "cambiar el estado" y "registrar la fecha", sin necesidad de configurar valores de Field por separado en el botón.

### Paso 5: Crear el botón de acción «Completar»

El Workflow está configurado, pero el «evento de acción personalizada» debe vincularse a un botón de acción específico para dispararse. Crearemos un botón «Completar» dedicado en la columna de acciones de la lista de tickets:

1. Entre en modo UI Editor; en la columna de acciones de la tabla de tickets, pulse **«+»** y seleccione el botón de acción **«Disparar Workflow»**

![06-workflows-2026-03-19-22-41-31](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-41-31.png)

2. Pulse la configuración del botón, cambie el título a **«Completar»** y elija un pequeño icono relacionado (como una marca de verificación)

![06-workflows-2026-03-19-22-43-39](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-43-39.png)

3. Configure la **regla de campo** del botón: cuando el estado del ticket ya sea «Completado», ocultar el botón (los tickets completados no necesitan el botón «Completar»)
   - Condición: Datos actuales → Estado igual a Completado
   - Acción: Ocultar

![06-workflows-2026-03-15-21-15-29](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-15-29.png)

4. Abra **«Vincular Workflow»** en la configuración del botón y seleccione el Workflow «Registrar automáticamente la fecha al completar el ticket» que acabamos de crear

![06-workflows-2026-03-19-23-00-53](https://static-docs.nocobase.com/06-workflows-2026-03-19-23-00-53.png)

### Paso 6: Configurar el flujo de eventos para refrescar

El botón está creado, pero al hacer clic, la tabla no se refresca automáticamente — el usuario no ve el cambio de estado. Hay que configurar el **flujo de eventos** del botón para que refresque la tabla cuando el Workflow termine.

1. En la configuración del botón, pulse el segundo símbolo de rayo (⚡) para abrir la configuración del **flujo de eventos**.
2. Configure el evento disparador:
   - **Evento disparador**: seleccione **Hacer clic**
   - **Momento de ejecución**: seleccione **Después de todos los flujos**
3. Pulse **«Añadir paso»** y seleccione **«Refrescar bloque de destino»**.

![06-workflows-2026-03-20-16-46-59](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-46-59.png)

4. Busque la tabla de tickets de la página actual, abra su menú de configuración y, abajo del todo, elija **«Copiar UID»**; pegue el UID en el bloque de destino del paso de refresco

![06-workflows-2026-03-20-16-48-39](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-48-39.png)

Así, al pulsar "Completar", el Workflow se ejecuta y la tabla se refresca automáticamente; el usuario ve al instante el cambio de estado y de la fecha de finalización.

### Paso 7: Habilitar y probar

Vuelva a la página de gestión de Workflow y habilite el Workflow «Registrar automáticamente la fecha al completar el ticket».

Luego abra un ticket en estado «En proceso» y, en la columna de acciones, pulse el botón **«Completar»**. Verá:

- El Field "Fecha de finalización" del ticket se ha rellenado automáticamente con la fecha y hora actuales
- La tabla se refresca automáticamente y el botón "Completar" desaparece de este ticket (la regla de campo ha funcionado)

![06-workflows-2026-03-15-21-25-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-11.gif)

¿Cómoda, verdad? Este es el segundo uso común de los Workflow: **actualizar datos automáticamente**. Y mediante "evento de acción personalizada + botón vinculado", hemos conseguido un mecanismo de disparo preciso: solo al pulsar un botón concreto se ejecuta el Workflow.

## 6.4 Ver el historial de ejecución

¿Cuántas veces se ha ejecutado el Workflow? ¿Ha habido errores? NocoBase lo registra todo.

En la lista de gestión de Workflow, cada uno tiene un enlace numérico de **Número de ejecuciones**. Al pulsarlo verá el registro detallado de cada ejecución:

- **Estado de la ejecución**: éxito (verde) o fallo (rojo), de un vistazo
- **Hora del disparo**: cuándo se disparó
- **Detalles del nodo**: al entrar puede ver el resultado de la ejecución de cada nodo

![06-workflows-2026-03-15-21-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-38.png)

Si una ejecución ha fallado, al entrar en los detalles puede ver qué nodo falló y el mensaje de error concreto. Es la herramienta más importante para depurar Workflow.

![06-workflows-2026-03-15-21-36-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-36-16.png)

## Resumen

En este capítulo hemos creado dos Workflow sencillos pero útiles:

- **Notificación de nuevo ticket** (disparador de evento de tabla de datos): tras crear o cambiar el responsable, notifica automáticamente, sin tener que avisar a mano
- **Registro automático de fecha de finalización** (disparador de evento de acción personalizada): al pulsar el botón "Completar" se rellena automáticamente la fecha, evitando olvidos humanos

Los dos Workflow ilustran dos formas distintas de disparar; juntos no llevan más de 10 minutos de configuración y el sistema ya trabaja solo. NocoBase admite muchos más tipos de nodos (peticiones HTTP, cálculos, bucles, etc.), pero para iniciarse, dominar estas combinaciones cubre la mayoría de los escenarios.

## Avance del próximo capítulo

El sistema ya trabaja solo, pero todavía nos falta una "vista global" — ¿cuántos tickets hay en total? ¿Qué categoría tiene más? ¿Cuántos se añaden cada día? En el próximo capítulo usaremos [bloques](/interface-builder/blocks) de gráfico para construir un **dashboard de datos** y verlo todo de un vistazo.

## Recursos relacionados

- [Resumen de Workflow](/workflow) — Conceptos y escenarios de uso
- [Disparador de evento de tabla](/workflow/triggers/collection) — Configuración de disparadores por cambios de datos
- [Nodo de actualización de datos](/workflow/nodes/update) — Configuración de actualización automática de datos
