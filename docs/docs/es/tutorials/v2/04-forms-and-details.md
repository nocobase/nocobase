# Capítulo 4: Formularios y detalles — captura, visualización, todo en uno

En el capítulo anterior montamos la lista de tickets y, con un formulario sencillo, registramos datos de prueba. En este capítulo vamos a **mejorar la experiencia del formulario**: optimizar la disposición de Field del [bloque de formulario](/interface-builder/blocks/data-blocks/form), añadir el [bloque de detalles](/interface-builder/blocks/data-blocks/details), configurar [reglas de campo](/interface-builder/linkage-rules) y, además, usar el [historial de cambios](https://docs.nocobase.com/cn/record-history/) para hacer seguimiento de cada modificación de los tickets.

:::tip
La función **«[Historial de registros](https://docs.nocobase.com/cn/record-history/)»** de la sección 4.4 está incluida en la [versión Profesional](https://www.nocobase.com/cn/commercial); saltarse esta sección no afecta al aprendizaje de los siguientes capítulos.
:::

## 4.1 Mejorar el formulario de creación de tickets

En el capítulo anterior creamos rápidamente un formulario de creación funcional. Ahora vamos a perfeccionarlo: ajustar el orden de Field, establecer valores por defecto y optimizar la disposición. Si se saltó la parte del formulario rápido del capítulo anterior, no pasa nada: aquí empezaremos desde cero.

### Añadir el botón de acción «Crear»

1. Asegúrese de estar en modo UI Editor (interruptor de la esquina superior derecha activado).
2. Entre en la página «Lista de tickets» y haga clic en **«[Acciones](/interface-builder/actions) (Actions)»** sobre el bloque de tabla.
3. Marque el botón de acción **«Añadir»**.
4. Aparecerá un botón «Añadir» sobre la tabla; al pulsarlo se abrirá un [popup](/interface-builder/actions/pop-up).

![04-forms-and-details-2026-03-13-09-43-54](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-43-54.png)

### Configurar el formulario dentro del popup

1. Haga clic en el botón «Añadir» para abrir el popup.
2. En el popup, pulse **«Crear [Block](/interface-builder/blocks) (Add block) → bloque de datos → Formulario (añadir)»**.
3. Seleccione **«[Tabla de datos](/data-sources/data-modeling/collection) actual (Current collection)»**. El popup ya está vinculado al contexto de la tabla correspondiente, no es necesario especificarla manualmente.

   ![04-forms-and-details-2026-03-13-09-44-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-44-50.png)
4. En el formulario, pulse **«[Field](/data-sources/data-modeling/collection-fields) (Fields)»** y marque los siguientes Field:

| Field | Notas de configuración |
|-------|------------------------|
| Título | Obligatorio (heredado del global) |
| Descripción | Texto largo |
| Estado | Selección desplegable (más adelante se establecerá el valor por defecto con regla de campo) |
| Prioridad | Selección desplegable |
| Categoría | Field de relación, se muestra automáticamente como selector desplegable |
| Remitente | Field de relación (más adelante se establecerá el valor por defecto con regla de campo) |
| Responsable | Field de relación |

![04-forms-and-details-2026-03-13-12-44-49](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-44-49.png)

Verá que el Field «Título» tiene un asterisco rojo `*` automáticamente — porque al crear el Field en el Capítulo 2 ya lo definimos como obligatorio; el formulario hereda automáticamente la regla obligatoria del nivel de tabla, sin necesidad de configurarla aparte.

![04-forms-and-details-2026-03-13-12-46-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-46-34.png)

> **Sugerencia**: si un Field no es obligatorio a nivel de tabla pero quiere que lo sea en el formulario actual, también puede configurarlo individualmente en las opciones del Field.
>
![04-forms-and-details-2026-03-13-12-47-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-47-26.png)

### Añadir botón de envío

1. Bajo el bloque de formulario, haga clic en **«Acciones (Actions)»**.
2. Marque el botón **«Enviar»**.

![04-forms-and-details-2026-03-13-16-30-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-30-06.png)

3. Tras rellenar el formulario, el usuario hace clic en Enviar para crear un nuevo ticket.

![04-forms-and-details-2026-03-13-16-32-19](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-32-19.gif)

## 4.2 Reglas de campo: valores por defecto y comportamiento condicional

Algunos Field queremos rellenarlos automáticamente (p. ej., el estado por defecto «Pendiente»); otros deben cambiar dinámicamente según condiciones (p. ej., los tickets urgentes requieren descripción obligatoria). En 2.0, la función de valores por defecto sigue evolucionando, por lo que en este tutorial usamos uniformemente las **reglas de campo** para configurar valores por defecto y comportamiento condicional de los Field.

1. Haga clic en la configuración del bloque de formulario (icono de tres líneas) en la esquina superior derecha.
2. Busque **«Reglas de campo (Linkage rules)»** y, al pulsar, se abrirá el panel de configuración en la barra lateral.

![04-forms-and-details-2026-03-13-16-43-35](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-43-35.png)

### Establecer valores por defecto

Primero establecemos valores por defecto para «Estado» y «Remitente»:

1. Haga clic en **«Añadir regla de campo»**.
2. **No establezca condición** (déjela vacía) — las reglas sin condición se ejecutan inmediatamente al cargar el formulario.

![04-forms-and-details-2026-03-13-16-47-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-47-34.png)

3. Configure las acciones (Actions):
   - Field Estado → **Establecer valor por defecto** → Pendiente
   - Field Remitente → **Establecer valor por defecto** → Usuario actual

> **Atención al seleccionar el valor del Field**: al establecer el valor, primero seleccione **«Formulario actual»** como fuente de datos. Si es un Field de objeto relacionado (como Categoría, Remitente, Responsable y otros Field muchos a uno), debe seleccionar el atributo del objeto en sí, no un sub-Field expandido.
>
> Al seleccionar variables (como «Usuario actual»), debe primero **hacer un clic** para seleccionar la variable y luego **doble clic** para insertarla en la barra de selección.

![04-forms-and-details-2026-03-13-17-01-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-01-06.png)

![04-forms-and-details-2026-03-13-17-02-20](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-02-20.png)


![04-forms-and-details-2026-03-13-17-03-41](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-03-41.png)


Si quiere que el remitente no pueda modificar un Field (como el estado), en la configuración del Field cambie **«Modo de visualización (Display mode)»** a **«Solo lectura (Readonly)»**.

![04-forms-and-details-2026-03-13-17-22-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-22-15.png)

> **Tres modos de visualización**: Editable, Solo lectura (Readonly, prohíbe editar pero conserva la apariencia del Field) y Modo lectura (Easy-reading, solo muestra texto).

![04-forms-and-details-2026-03-13-12-54-53](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-54-53.png)

### Tickets urgentes con descripción obligatoria

A continuación añadimos una regla con condición: cuando el usuario seleccione prioridad «Urgente», el Field descripción se vuelve **obligatorio**, recordando al remitente que detalle bien la situación.

1. Haga clic en **«Añadir regla de campo»**.

![04-forms-and-details-2026-03-13-17-07-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-07-34.png)

2. Configure la regla:
   - **Condición (Condition)**: Formulario actual / Prioridad **igual a** Urgente
   - **Acciones (Actions)**: Field Descripción → marcar como **Obligatorio**

![04-forms-and-details-2026-03-13-17-08-46](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-08-46.png)

![04-forms-and-details-2026-03-13-17-18-16](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-18-16.png)

3. Guarde la regla.

Probemos: seleccione prioridad «Urgente» y aparecerá un asterisco rojo `*` junto al Field descripción, indicando que es obligatorio. Si selecciona otra prioridad, vuelve a no ser obligatorio.

![04-forms-and-details-2026-03-13-17-20-18](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-20-18.gif)

Por último, según lo aprendido, ajustemos un poco la disposición.
![04-forms-and-details-2026-03-13-17-25-55](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-25-55.png)

> **¿Qué más pueden hacer las reglas de campo?** Además de establecer valores por defecto y controlar la obligatoriedad, también pueden controlar la visibilidad/ocultación de Field y asignar valores dinámicamente. Por ejemplo: cuando el estado sea «Cerrado», ocultar el Field Responsable. Lo ampliaremos cuando lo encontremos en capítulos posteriores.

## 4.3 [Bloque de detalles](/interface-builder/blocks/data-blocks/details)

En el capítulo anterior añadimos un botón «Ver» a las filas de la tabla; al pulsarlo se abre un cajón. Ahora vamos a configurar el contenido del cajón.

1. En la tabla, haga clic en el botón **«Ver»** de una fila para abrir el cajón.
2. En el cajón, pulse **«Crear bloque (Add block) → bloque de datos → Detalles»**.
3. Seleccione **«Tabla actual (Current collection)»**.

![04-forms-and-details-2026-03-13-17-27-02](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-27-02.png)

4. En el bloque de detalles pulse **«Field (Fields)»**, con la disposición:


| Zona | Field |
|------|-------|
| Cabecera | Título, Estado (estilo etiqueta) |
| Cuerpo | Descripción (área de texto grande) |
| Información lateral | Nombre de la categoría, Prioridad, Remitente, Responsable, Fecha de creación |

¿Cómo colocar un título grande?
Seleccione Field > markdown > editar markdown > en el área de edición seleccione una variable > Registro actual > Título.
Esto inserta dinámicamente el título del registro en el bloque markdown.
Borre el texto por defecto y, con sintaxis markdown, conviértalo en estilo de título de segundo nivel (es decir, anteponga `## ` con un espacio).

![04-forms-and-details-2026-03-13-17-36-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-36-26.png)

![04-forms-and-details-2026-03-13-17-39-51](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-39-51.png)

El Field de título original de la página puede eliminarse; ajuste un poco el diseño del formulario de detalles.

![04-forms-and-details-2026-03-13-17-43-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-43-36.png)


> **Sugerencia**: varios Field pueden disponerse en una misma fila arrastrándolos, para una disposición más compacta y atractiva.


1. En **«Acciones (Actions)»** del bloque de detalles, marque el botón **«Editar»**, para entrar al modo de edición directamente desde los detalles.

![04-forms-and-details-2026-03-13-17-45-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-45-15.png)

### Configurar el formulario de edición

Al hacer clic en «Editar» se abre un nuevo popup, en el que hay que colocar un formulario de edición. Los Field del formulario de edición son casi iguales a los del formulario de creación: ¿hay que volver a marcarlos uno a uno?

No. ¿Recuerda el formulario de creación? Lo guardamos primero como **plantilla** y el formulario de edición lo referenciará directamente.

**Paso 1: volver al formulario de creación y guardarlo como plantilla**

1. Cierre el popup actual, vuelva a la lista de tickets y haga clic en «Añadir» para abrir el formulario de creación.
2. Haga clic en la configuración del bloque de formulario (icono de tres líneas) en la esquina superior derecha y busque **«Guardar como plantilla (Save as template)»**.

![04-forms-and-details-2026-03-13-17-47-21](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-21.png)

3. Pulse guardar; por defecto es **«Referencia (Reference)»**: todos los formularios que referencian la plantilla comparten la misma configuración, modificar uno actualiza todos.

![04-forms-and-details-2026-03-13-17-47-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-44.png)


![04-forms-and-details-2026-03-13-18-39-05](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-39-05.png)

> Como nuestro formulario de tickets no es complejo, elegir «Referencia» es más cómodo de mantener. Si elige «Copiar», cada formulario obtiene una copia independiente, que se modifican sin afectarse mutuamente.

**Paso 2: referenciar la plantilla en el popup de edición**

1. Vuelva al cajón de detalles o a la columna de acciones de la tabla y haga clic en «Editar» para abrir el popup de edición.

Quizá piense: ¿no basta con crearlo directamente con **«Crear bloque → Otros bloques → Plantilla de bloque»**? Pruebe y verá que crea un **formulario de creación** y los Field no se rellenan automáticamente. Es una trampa habitual.

![04-forms-and-details-2026-03-13-17-59-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-59-36.png)

La forma correcta es:

2. En el popup pulse **«Crear bloque (Add block) → bloque de datos → Formulario (Editar)»** y cree primero un bloque de formulario de edición de manera normal.
3. En el formulario de edición pulse **«Field (Fields) → Plantilla de Field (Field templates)»** y seleccione la plantilla guardada anteriormente.
4. Los Field se rellenarán todos de golpe, idénticos al formulario de creación.
5. No olvide añadir el botón de acción «Enviar» para que el usuario pueda guardar tras modificar.

![04-forms-and-details-2026-03-13-18-05-13](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-05-13.png)

![04-forms-and-details-2026-03-13-18-15-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-15-11.gif)

¿Quiere añadir un Field más adelante? Modifique solo la plantilla y los formularios de creación y edición se actualizarán a la vez.

### Edición rápida: modificar datos sin abrir popup

Además de la edición por popup, NocoBase admite **edición rápida** directamente en la tabla — sin abrir ningún popup, basta con pasar el ratón.

Hay dos formas de activarla:

- **A nivel de bloque de tabla**: haga clic en la configuración del bloque (icono de tres líneas) y busque **«Edición rápida (Quick editing)»**; al activarla, todos los Field de la tabla admiten edición rápida.
- **A nivel de Field individual**: haga clic en la configuración de la columna y busque **«Edición rápida»**; puede controlar Field a Field si se activa.

![04-forms-and-details-2026-03-13-18-20-07](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-20-07.png)

Una vez activada, al pasar el ratón sobre la celda aparece un pequeño icono de lápiz; al pulsarlo aparece el componente de edición del Field, y se guarda automáticamente al modificar.

![04-forms-and-details-2026-03-13-18-21-09](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-21-09.gif)

> **¿En qué escenarios va bien?** La edición rápida es ideal cuando hay que modificar masivamente Field como estado o responsable. Por ejemplo, un administrador navegando por la lista de tickets puede pulsar directamente la columna «Estado» para pasar rápidamente un ticket de «Pendiente» a «En proceso», sin tener que abrir uno a uno.

## 4.4 Habilitar el historial de registros

:::info Plugin comercial
El **«[Historial de registros](https://docs.nocobase.com/cn/record-history/)»** es un plugin de la [versión Profesional](https://www.nocobase.com/cn/commercial) de NocoBase y requiere licencia comercial. Si usa la versión Community, puede saltarse esta sección sin que afecte a los siguientes capítulos.
:::

Lo más importante de un sistema de tickets es: **quién modificó qué y cuándo, debe ser rastreable**. El plugin «Historial de registros» de NocoBase registra automáticamente cada cambio de datos.

### Configurar el historial de registros

1. Vaya a **Configuración → Gestión de plugins** y asegúrese de que el plugin «Historial de registros» (Record History) está habilitado.

![04-forms-and-details-2026-03-13-18-22-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-22-44.png)

2. Entre en la página de configuración del plugin, pulse **«Añadir tabla de datos»** y seleccione **«Tickets»**.
3. Seleccione los Field a registrar: **Título, Estado, Prioridad, Responsable, Descripción**, etc.

![04-forms-and-details-2026-03-13-18-25-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-25-11.png)

> **Sugerencia**: no es necesario registrar todos los Field. Field como ID o fecha de creación, que no se modifican manualmente, no merecen seguimiento. Registre solo Field con significado para el negocio.

4. En este momento vuelva a la configuración y pulse **«Sincronizar instantánea de datos históricos»**; el plugin registrará automáticamente todos los tickets actuales como primer registro histórico, y cada modificación posterior añadirá un nuevo registro histórico.

![04-forms-and-details-2026-03-13-18-27-01](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-27-01.png)

![04-forms-and-details-2026-03-13-18-28-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-28-50.png)

### Ver el historial en la página de detalles

1. Vuelva al cajón de detalles del ticket (pulse el botón «Ver» de la fila de la tabla).
2. En el cajón pulse **«Crear bloque (Add block) → Historial de registros»**.
3. Seleccione **«Tabla actual»** y, en datos, **«Registro actual»**.
4. En la parte inferior de los detalles aparecerá una línea de tiempo que muestra claramente cada cambio: quién, cuándo, qué Field cambió de qué valor a qué valor.

![04-forms-and-details-2026-03-13-18-31-45](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-31-45.png)

![04-forms-and-details-2026-03-13-18-33-00](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-33-00.gif)

Así, aunque el ticket pase por varias manos, todos los cambios quedan claros como el agua.

## Resumen

En este capítulo hemos completado el ciclo de vida completo de los datos:

- **Formulario**: el usuario puede enviar nuevos tickets, con valores por defecto y validación
- **Reglas de campo**: los tickets urgentes requieren automáticamente descripción
- **Bloque de detalles**: muestra de forma clara la información completa del ticket
- **Historial de registros**: rastrea automáticamente cada cambio, auditoría sin preocupaciones (plugin comercial, opcional)

Desde "verlo" hasta "introducirlo" y "consultarlo": nuestro sistema de tickets ya tiene una usabilidad básica.

## Recursos relacionados

- [Bloque de formulario](/interface-builder/blocks/data-blocks/form) — Configuración detallada del bloque de formulario
- [Bloque de detalles](/interface-builder/blocks/data-blocks/details) — Configuración del bloque de detalles
- [Reglas de campo](/interface-builder/linkage-rules) — Descripción de las reglas de campo
