# Capítulo 5: Pestañas y bloques dinámicos

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113544406238001&bvid=BV1RfzNYLES5&cid=27009811403&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

¡Bienvenido al Capítulo 5! Es un capítulo muy interesante: añadiremos más funcionalidades a la página de gestión de tareas y soportaremos distintas formas de visualización. Estoy seguro de que lleva tiempo esperándolo. Le iremos guiando paso a paso, como siempre, ¡y lo resolveremos sin problema!

### 5.1 Pestañas como contenedor para distintos bloques

Ya hemos creado la página de gestión de tareas, pero, para hacer el sistema más intuitivo, queremos poder cambiar entre distintos modos de visualización dentro de la misma página: [**tabla**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table), [**kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**calendario**](https://docs-cn.nocobase.com/handbook/calendar) e incluso [**diagrama de Gantt**](https://docs-cn.nocobase.com/handbook/block-gantt). Las pestañas de NocoBase nos permiten alternar la disposición de bloques dentro de la misma página. Vamos paso a paso.

- Crear pestañas
  Empecemos creando las pestañas.

1. **Añadir una sub-pestaña**:

   - Abra la página de gestión de tareas que creamos antes y cree una sub-pestaña dentro de la página. La primera la llamaremos **"Vista de tabla"** y mostrará el bloque de lista de tareas que ya configuramos.
2. **Añadir otra pestaña**:

   - A continuación, cree otra pestaña llamada **"Vista de kanban"**. Aquí crearemos el bloque kanban de tareas.
     ![Crear pestañas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172155490.gif)

¿Listo? ¡Vamos a crear los distintos bloques!

> **Introducción a los bloques:** Los bloques son los contenedores de datos y contenido que muestran la información en el sitio web de la forma más adecuada. Pueden colocarse en una página (Page), un cuadro de diálogo (Modal) o un cajón (Drawer) y se pueden arrastrar libremente para reorganizarlos. Las distintas operaciones sobre los datos dentro de un bloque permiten todo tipo de configuraciones y visualizaciones.
> Usar los bloques en NocoBase, como en este caso de estudio, permite construir y gestionar las páginas y funcionalidades del sistema con mucha más rapidez. Además, los bloques se pueden guardar como plantillas para copiar y referenciar, reduciendo enormemente el trabajo de creación.

### 5.2 Bloque kanban: estado de las tareas a simple vista

El [**kanban**](https://docs-cn.nocobase.com/handbook/block-kanban) es una de las funcionalidades más importantes en un sistema de gestión de tareas: permite gestionar el estado de las tareas arrastrándolas de forma intuitiva. Por ejemplo, puede agruparlas por estado para ver en qué fase se encuentra cada una.

#### 5.2.1 Crear el bloque kanban

1. **Crear el bloque kanban**:

- En la pestaña **Vista de kanban**, haga clic en "Crear bloque", seleccione la tabla de tareas y aparecerá una opción para elegir el campo por el que agrupar.

2. **Seleccionar el campo de agrupación**:

- Elegimos el campo **Estado** que creamos antes, para agrupar por estado de las tareas. (Atención: el campo de agrupación solo puede ser de tipo [Desplegable (selección única)](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select) o [Radio](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/radio-group).)

3. **Añadir un campo de orden**:

- Las tarjetas dentro del kanban pueden ordenarse mediante un campo de orden. Para ello creamos un nuevo campo. Haga clic en "Añadir campo" y cree uno llamado **Orden de estado (status_sort)**.
- Este campo determina la posición vertical de la tarjeta al arrastrarla en el kanban, como una coordenada: a izquierda y derecha están los distintos estados, y la posición vertical es el valor de orden. Más tarde, al arrastrar tarjetas, podrá ver cómo cambia el valor en el formulario.
  ![Crear bloque kanban](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156926.gif)

#### 5.2.2 Marcar campos y acciones

- Por último, recuerde marcar los campos a mostrar en el bloque kanban: nombre y estado de la tarea, etc., para que las tarjetas tengan la información necesaria.

![Mostrar campos en kanban](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156326.gif)

### 5.3 Uso de plantillas: copiar y referenciar

Tras crear el kanban, hay que crear un **formulario de creación**. Aquí NocoBase ofrece una funcionalidad muy útil: puede [**copiar** o **referenciar** ](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB) plantillas de formulario anteriores para no tener que reconfigurarlo cada vez.

#### 5.3.1 **Guardar el formulario como plantilla**

- En el formulario de creación anterior, pase el ratón sobre la configuración del formulario y haga clic en "Guardar como plantilla". Asígnele un nombre, por ejemplo, "Tabla de tareas_Formulario crear".

![Guardar formulario como plantilla](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156356.gif)

#### 5.3.2 **Copiar o referenciar plantilla**

Al crear un nuevo formulario en la vista de kanban, verá dos opciones: **Copiar plantilla** y **Referenciar plantilla**. ¿Qué diferencia hay?

- [**Copiar plantilla**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB): equivale a crear una copia independiente del formulario; puede modificarla sin afectar al original.
- [**Referenciar plantilla**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB): toma "prestado" el formulario original; cualquier modificación se sincroniza con todos los lugares donde se referencia esta plantilla. Por ejemplo, si cambia el orden de los campos, todos los formularios que la referencian cambiarán.

![Copiar y referenciar plantilla](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157435.gif)

Puede elegir copiar o referenciar según sus necesidades. En general, **referenciar plantilla** es más cómodo porque solo hay que modificar una vez y los cambios se aplican a todos lados, ahorrando tiempo y esfuerzo.

### 5.4 Bloque de calendario: progreso de las tareas a simple vista

A continuación crearemos un [**bloque de calendario**](https://docs-cn.nocobase.com/handbook/calendar) para gestionar mejor la planificación temporal de las tareas.

#### 5.4.1 Crear la vista de calendario

##### 5.4.1.1 **Añadir campos de fecha**

La vista de calendario necesita conocer la **fecha de inicio** y la **fecha de fin** de cada tarea, así que añadimos dos campos en la tabla de tareas:

- **Fecha de inicio (start_date)**: marca la fecha de inicio de la tarea.
- **Fecha de fin (end_date)**: marca la fecha de finalización de la tarea.

![Añadir campos de fecha](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157585.png)

#### 5.4.2 Crear el bloque de calendario:

Volvemos a la vista de calendario, creamos un bloque de calendario, seleccionamos la tabla de tareas y usamos los campos **Fecha de inicio** y **Fecha de fin** que acabamos de crear. Las tareas se mostrarán como un periodo continuo en el calendario, dejando claro su progreso.

![Construir vista de calendario](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157957.gif)

#### 5.4.3 Probar las operaciones del calendario:

En el calendario puede arrastrar tareas a su gusto, hacer clic para editar los detalles (no olvide copiar o referenciar la plantilla).

![Operar en calendario](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158379.gif)

### 5.5 Bloque de Gantt: la herramienta para gestionar el progreso

El último bloque es el [**bloque de Gantt**](https://docs-cn.nocobase.com/handbook/block-gantt), una herramienta muy utilizada en gestión de proyectos para hacer seguimiento del progreso y las dependencias entre tareas.

#### 5.5.1 Crear la pestaña "Vista de Gantt"

#### 5.5.2 **Añadir el campo "Porcentaje completado"**

Para que el Gantt muestre mejor el progreso, añadimos un campo llamado **Porcentaje completado (complete_percent)** que registre el avance de la tarea. Su valor por defecto es 0%.

![Añadir campo de porcentaje](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158044.gif)

#### 5.5.3 **Crear el bloque de Gantt**

En la vista de Gantt, cree un bloque de Gantt, seleccione la tabla de tareas y configure los campos de fecha de inicio, fecha de fin y porcentaje completado.

![Construir vista de Gantt](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158860.gif)

#### 5.5.4 **Probar el arrastre en el Gantt**

En el Gantt puede arrastrar las tareas para ajustar su duración y avance; las fechas de inicio y fin y el porcentaje completado se actualizarán en consecuencia.

![Arrastrar en Gantt](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172159140.gif)

### Resumen

¡Estupendo! Ya domina el uso de varios tipos de bloques para representar los datos de tareas en NocoBase: [**bloque kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**bloque de calendario**](https://docs-cn.nocobase.com/handbook/calendar) y [**bloque de Gantt**](https://docs-cn.nocobase.com/handbook/block-gantt). Estos bloques no solo hacen la gestión de tareas más visual, sino que también aportan una gran flexibilidad.

Pero esto es solo el principio. En un equipo, cada miembro suele tener responsabilidades distintas: ¿cómo asegurarse de que todos colaboran sin fricciones? ¿Cómo garantizar la seguridad de los datos a la vez que cada uno solo ve y opera lo que le compete?

¿Listo? Pasamos al siguiente capítulo: [Capítulo 6: Usuarios y permisos](https://www.nocobase.com/cn/tutorials/task-tutorial-user-permissions).

¡Veremos cómo, con pasos sencillos, llevar la colaboración de su equipo al siguiente nivel!

---

Siga explorando y dé rienda suelta a su creatividad. Si tiene dudas, recuerde que siempre puede consultar la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o unirse al [foro de la comunidad NocoBase](https://forum.nocobase.com/).
