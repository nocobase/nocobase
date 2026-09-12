# Capítulo 8: Base de conocimiento - Tabla de árbol

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113815089907668&bvid=BV1mfcgeTE7H&cid=27830914731&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

### 8.1 Bienvenido a un nuevo capítulo

En este capítulo profundizaremos en la construcción de una base de conocimiento. Será un módulo integral que nos ayudará a gestionar y organizar documentos, tareas e información. Diseñando y creando una tabla de documentos con estructura de árbol implementaremos una gestión eficiente del estado, los adjuntos y las tareas asociadas a cada documento.

### 8.2 Primer acercamiento al diseño de la base de datos

#### 8.2.1 Diseño básico y creación de la tabla de documentos

Empezaremos con un diseño sencillo: crearemos una "tabla de documentos" para registrar la información de todos los documentos. Esta tabla incluye los siguientes campos clave:

1. **Título (Title)**: el nombre del documento, en formato de texto de una línea.
2. **Contenido (Content)**: el contenido detallado del documento, en formato de texto multilínea con soporte Markdown.
3. **Estado del documento (Status)**: marca el estado actual del documento; opciones: borrador, publicado, archivado y eliminado.
4. **Adjunto (Attachment)**: permite añadir archivos e imágenes para enriquecer el contenido.
5. **Tarea relacionada (Related Task)**: campo de relación muchos a uno que asocia el documento a una tarea, para facilitar las referencias en la gestión de tareas.

![](https://static-docs.nocobase.com/2412061730%E6%96%87%E6%A1%A3-%E4%BB%BB%E5%8A%A1er.svg)

A medida que ampliemos las funcionalidades iremos añadiendo más campos al sistema documental.

#### 8.2.2 Estructura de árbol y gestión del directorio

> Tabla con estructura de árbol (proporcionada por el plugin de tabla de árbol): cada elemento puede tener uno o varios elementos hijos, y a su vez cada hijo puede tener sus propios hijos.

Para asegurar la organización y la jerarquía, nuestra tabla de documentos será una [**tabla de árbol**](https://docs-cn.nocobase.com/handbook/collection-tree), facilitando la clasificación con relaciones padre-hijo. Al crear una tabla de árbol, el sistema genera automáticamente los siguientes campos:

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190010004.png)

- **ID del registro padre**: registra el documento superior del documento actual.
- **Registro padre**: campo muchos a uno que ayuda a establecer la relación padre-hijo.
- **Registros hijos**: campo uno a muchos para consultar los documentos hijos de un documento.
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011580.png)

Estos campos mantienen la jerarquía del directorio de la tabla de árbol, así que no se recomienda modificarlos.

A la vez, debemos crear la relación con la tabla de tareas [(muchos a uno)](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o), incluyendo la relación inversa, para poder crear listas de documentos en el cuadro emergente asociado a una tarea cuando lo necesitemos.

### 8.3 Crear la página de gestión de documentos

#### 8.3.1 Crear el menú de gestión de documentos

En el menú principal del sistema, añada una nueva página llamada "Gestión de documentos" y elija un icono adecuado. Después, cree un bloque de tabla para nuestra tabla de documentos. Añada al bloque las operaciones básicas de añadir, eliminar, modificar y consultar, e introduzca algunos datos de prueba para comprobar que la tabla está bien diseñada.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011929.gif)

#### Práctica

1. Pruebe a añadir en la página de gestión de documentos un documento padre llamado "Documento 1".
2. Añada un documento hijo de "Documento 1" llamado "Capítulo 1".

#### 8.3.2 Cambiar a vista de tabla de árbol

Quizá se pregunte: ¿por qué no se ve como un árbol de directorio?

Por defecto, el bloque de tabla se muestra como una tabla normal; activémoslo manualmente:

1. Haga clic en la esquina superior derecha del bloque de tabla > Tabla de árbol.

   Verá que al activarlo aparece un interruptor "Expandir todo" debajo de la tabla de árbol.

   También notará que el "Capítulo 1" recién creado desaparece.
2. Active la opción "Expandir todo" debajo de la tabla de árbol.

   Ahora la estructura padre-hijo se muestra de forma mucho más intuitiva y puede expandir todos los niveles.

   Aprovechamos para añadir la operación "Añadir registro hijo".

¡Conversión a tabla de árbol completada!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012338.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012178.png)

### 8.3.3 Configurar "Añadir registro hijo"

Definamos los contenidos básicos. Si marca el campo "registro padre", verá que por defecto está en estado "Solo lectura (no editable)" porque por defecto se está creando bajo el documento actual.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012648.png)

Si hay muchas tareas, asociar la tarea correspondiente puede ser engorroso; podemos establecer un valor por defecto en el filtro de tareas que sea igual a la tarea asociada al registro padre.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012417.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013403.png)

Si el valor por defecto no se actualiza al instante, cierre y reabra el formulario: ¡ya aparece relleno automáticamente!

### 8.4 Configurar plantillas de formulario y asociación con tareas

#### 8.4.1 Crear [plantillas](https://docs-cn.nocobase.com/handbook/block-template) de tabla y formulario

Para facilitar la gestión, [guardamos como plantilla](https://docs-cn.nocobase.com/handbook/block-template) la tabla y los formularios de creación y edición de documentos para reutilizarlos en otras páginas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013599.png)

#### 8.4.2 Mostrar el bloque de tabla de documentos por copia

En el cuadro emergente de visualización de la tabla de tareas, añadimos una nueva [pestaña](https://docs-cn.nocobase.com/manual/ui/pages) llamada "Documentos". En esa pestaña añadimos un bloque de formulario > Otros registros > Tabla de documentos > "Copiar plantilla" > seleccionamos la plantilla de formulario de documentos creada anteriormente. (Asegúrese de elegir [**Copiar plantilla**](https://docs-cn.nocobase.com/handbook/block-template)).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013140.png)

Esta forma facilita la creación de listas de documentos en distintos contextos.

#### 8.4.3 Adaptación de la asociación con la tarea

Como hemos copiado una plantilla externa de tabla, no está asociada a la tabla de tareas. Verá que se muestran todos los documentos, lo cual no es lo que queremos.

Es una situación frecuente: si no creamos un campo de relación pero necesitamos mostrar datos asociados, hay que vincularlos manualmente. (Recuerde elegir [**Copiar plantilla**](https://docs-cn.nocobase.com/handbook/block-template) y no [Referenciar plantilla](https://docs-cn.nocobase.com/handbook/block-template), de lo contrario sus cambios se sincronizarán con otros bloques de tabla).

- Asociar los datos mostrados

Haga clic en la esquina superior derecha del bloque de tabla, ["Configurar rango de datos"](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/data-scope) como:

【Tarea/ID】= 【Registro del cuadro emergente actual/ID】

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014372.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014983.gif)

Ya está. Solo se mostrarán los documentos asociados a la tarea actual.

- Asociar el bloque de formulario de añadir.

Entre en el bloque de añadir:

Para el campo de tarea relacionada, configure el [valor por defecto](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/default-value) > 【Registro del cuadro emergente superior】.

El cuadro emergente superior es el cuadro de "ver" de los datos de la tarea actual, que enlaza directamente con esa tarea.

Configuramos el [modo de solo lectura](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/pattern), de modo que dentro de este cuadro emergente solo se pueda asociar a la tarea actual.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014424.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014289.gif)

¡Listo! Ahora tanto al añadir como al mostrar, los documentos serán los asociados a la tarea actual.

Si quiere, puede completar también los filtros de "Editar" y "Añadir subtareas" para mantener la coherencia.

Para que la estructura de árbol y la columna de operaciones queden más ordenadas y claras, movemos el título a la primera columna.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015378.png)

### 8.5 Filtrado y búsqueda en la gestión de documentos

#### 8.5.1 Añadir un [bloque de filtro](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)

Aprovechemos para añadir filtrado a la tabla de documentos.

- Añada un [bloque de filtro](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) en la página de gestión de documentos.
- Elija el formulario de filtrado y arrástrelo a la parte superior.
- Marque los campos título, estado y campo de tabla de tareas como condiciones de filtrado.
- Añada las acciones "Filtrar" y "Restablecer".

Este formulario es nuestra caja de búsqueda y permite localizar documentos rápidamente con palabras clave.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015868.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015365.gif)

#### 8.5.2 [Conectar bloques de datos](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block)

Quizá note que al hacer clic no ocurre nada; falta el último paso: conectar los bloques con función de búsqueda entre sí.

- Haga clic en la esquina superior derecha del bloque > [Conectar bloques de datos](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block).

  ```
  Aquí se muestran los bloques que se pueden conectar.

  Como hemos creado un formulario de la tabla de documentos, se buscan todos los bloques de datos asociados (en esta página solo hay uno) y se ofrecen como opción.

  No se preocupe por confundirlos: al pasar el ratón por encima, la pantalla se centrará automáticamente en el bloque correspondiente.
  ```
- Pulse para activar el bloque que quiere conectar y pruebe la búsqueda.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190016981.gif)

Conectando el bloque de filtrado con el bloque principal de datos de documentos a través del botón de configuración, cada vez que ajuste los filtros la tabla actualizará los resultados automáticamente.

### 8.6 [Configuración de permisos](https://docs-cn.nocobase.com/handbook/acl) de la base de conocimiento

Para garantizar la seguridad y la correcta gestión de los documentos, puede asignar [permisos](https://docs-cn.nocobase.com/handbook/acl) a la base documental según el rol. Cada rol podrá ver, editar o eliminar documentos según los permisos que tenga.

Más adelante adaptaremos la tabla de documentos para incluir noticias y avisos de tareas, así que los permisos pueden ser un poco más abiertos.

### 8.7 Resumen y siguientes pasos

En este capítulo hemos creado una base de conocimiento básica con una tabla de documentos, [estructura de árbol](https://docs-cn.nocobase.com/handbook/collection-tree) y la asociación con tareas. Mediante el bloque de filtrado y la reutilización de plantillas hemos conseguido una gestión documental eficiente.

A continuación pasamos al [siguiente capítulo](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-1), donde aprenderá a construir un tablero personal con [gráficos de análisis de datos](https://docs-cn.nocobase.com/handbook/data-visualization) y visualización de información importante.

---

Siga explorando y dé rienda suelta a su creatividad. Si tiene dudas, recuerde que siempre puede consultar la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o unirse al [foro de la comunidad NocoBase](https://forum.nocobase.com/).
