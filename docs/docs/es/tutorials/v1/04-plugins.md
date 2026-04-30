# Capítulo 4: Plugins de tareas y comentarios

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113532393752067&bvid=BV16XB2YqERC&cid=26937593203&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe

## Repaso del capítulo anterior

¿Recuerda el reto del capítulo anterior? Había que configurar los campos **Estado** y **Adjunto** en la tabla de tareas y mostrarlos en la lista. Tranquilo, ahí va la solución.

1. **Configuración del campo Estado**:
   - Seleccione el campo [**Desplegable (selección única)**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select), introduzca las etiquetas de las opciones: **No iniciada, En progreso, Pendiente de revisión, Completada, Cancelada, Archivada**. Los colores se eligen al gusto, ¡añadamos un poco de color a las tareas!

![Configuración del campo de estado](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162341275.png)

2. **Configuración del campo Adjunto**:
   - Cree un nuevo campo de tipo [**Adjunto**](https://docs-cn.nocobase.com/handbook/file-manager/field-attachment), póngale un nombre, por ejemplo "Adjunto", y haga clic en enviar. Listo, sencillísimo.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162343470.png)

3. **Mostrar Creador y Estado en la lista**:
   - En el bloque de tabla, marque los campos "Creador", "Estado" y "Adjunto" para que la lista de tareas muestre más información clave y resulte más rica.

![Mostrar campos en la lista](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162344570.png)

4. **Mostrar campos en los formularios de añadir y editar**:
   - En los formularios emergentes no olvide marcar los campos Estado y Adjunto, para tenerlos a mano al añadir o editar tareas.

![Mostrar campos en formularios](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162345053.gif)

¿Bien, verdad? No tenga prisa: repita las operaciones unas cuantas veces y poco a poco dominará el uso esencial de NocoBase. Cada paso es la base de la gestión de tareas que vendrá a continuación. ¡Sigamos!

---

## 4.1 Contenido de la tarea y comentarios: interacción en la gestión de tareas

Hasta aquí, su sistema de gestión de tareas ya soporta la información básica. Pero la gestión de tareas no se limita a unas líneas de texto: a veces necesitamos contenido más rico y la interacción en tiempo real entre miembros del equipo.

### 4.1.1 Markdown(Vditor): contenido de tarea más rico

Quizá ya se haya fijado en los editores [**Texto enriquecido**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/rich-text) y [**Markdown**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/markdown) que ofrece NocoBase, pero quizá sus prestaciones le resulten insuficientes.
El editor de texto enriquecido es bastante limitado y el editor Markdown, aunque útil, no soporta vista previa en tiempo real.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162346447.png)

¿Existe un editor que combine vista previa en tiempo real y funciones avanzadas? ¡La respuesta es sí! [**Markdown(Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor) es el editor de texto más potente de NocoBase, soporta vista previa en tiempo real, subida de imágenes e incluso grabación de audio. Además, está integrado en el sistema y es totalmente gratuito.

> **Introducción a los plugins:** Los Plugins son una de las funcionalidades centrales de NocoBase y permiten al usuario añadir funciones personalizadas o integrar servicios de terceros según las necesidades del proyecto.
> Mediante plugins se pueden integrar funcionalidades cómodas o sorprendentes que faciliten su creación y desarrollo.

A continuación le guiaré paso a paso para activar este potente editor. ¿Recuerda el Plugin Manager? ¡Eso es, ahí lo tiene!

> **Markdown(Vditor)**: almacena Markdown y lo renderiza con el editor Vditor. Soporta la sintaxis Markdown habitual (listas, código, citas...), permite subir imágenes, grabar audio y, además, ofrece renderizado en tiempo real WYSIWYG.

1. **Activar el plugin Markdown(Vditor)**:
   - Abra el **Gestor de plugins** en la esquina superior derecha, escriba "markdown" para buscar el plugin y active [**Markdown(Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor). No se preocupe si la página se refresca un momento; en unos segundos volverá a la normalidad.

![Activar plugin Markdown](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162348237.png)

2. **Crear un campo Markdown**:

   - Vuelva a la tabla de tareas, haga clic en "Crear campo" y aparecerá nuestra versión Markdown Pro Plus.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162349275.png)

- Póngale un nombre, por ejemplo "Detalle de tarea (task_detail)" y marque todas las funciones disponibles.

3. Quizá se haya fijado en la opción "Tabla de archivos". Si no la selecciona, ¿perderá la función de archivos? No se preocupe: los archivos se guardarán en el almacenamiento por defecto, puede usarlo con tranquilidad.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162350389.gif)

4. **Probar el campo Markdown**:
   - Vuelva a la página de gestión de tareas y escriba su primer texto en Markdown. Pruebe a pegar imágenes o subir archivos: ¡es muy potente!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162351380.gif)

¡La tabla de tareas se enriquece más y más! Cada paso amplía las funcionalidades del sistema. A continuación veremos cómo organizar los campos para que la interfaz quede mejor.

### 4.1.2 Reorganizar los campos

A medida que aumenta el número de campos, la disposición de la página puede volverse algo caótica. No se preocupe, la flexibilidad de NocoBase permite recolocar los campos con facilidad.

**Recolocar campos**:

- Pase el ratón por la cruz situada en la esquina superior derecha del campo, haga clic y arrastre el campo a la posición deseada; al soltar quedará colocado. Pruebe: ¡la página se ve mucho más ordenada al instante!

![Recolocar campos](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162352077.gif)

Tras este ajuste la página se adapta mejor a sus necesidades. Sigamos: vamos a añadir comentarios para facilitar la interacción del equipo.

## 4.2 Comentarios

La descripción de la tarea no basta: a veces necesitamos que los miembros del equipo comenten las tareas, debatan asuntos y dejen feedback. ¡Manos a la obra!

### 4.2.1 Método 1: usar el plugin de comentarios

#### 4.2.1.1 Instalar el plugin de comentarios

> **Plugin de comentarios (plugin comercial):** Aporta una plantilla de tabla y un bloque de comentarios para añadir comentarios a los datos de cualquier tabla.
>
> Atención: al añadir comentarios es necesario relacionar la tabla destino mediante un campo de relación, para evitar conflictos de datos en los comentarios.

En el [**Gestor de plugins**](https://docs-cn.nocobase.com/handbook/plugin-manager), suba y active el **plugin de comentarios**. Una vez activado, en la fuente de datos aparecerá una nueva opción "Tabla de comentarios".
Haga clic en añadir > Subir plugin > Arrastre el archivo comprimido > Enviar.
Busque "comentarios" y verá que el plugin ya aparece. Tras activarlo, vuelva a la fuente de datos y verá la opción de tabla de comentarios. ¡Instalación realizada!

![Instalar el plugin de comentarios](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162353550.gif)

#### 4.2.1.2 Crear la tabla de comentarios

Vamos a la fuente de datos y creamos una nueva tabla de comentarios: **Tabla de comentarios (Comments)**.

#### 4.2.1.3 Relación entre la tabla de comentarios y la tabla de tareas

Ya hemos creado la **tabla de comentarios (Comments)**. Quizá esté pensando: ¿podemos ya pintar el área de comentarios en la página? Aún no: pensemos un momento. **Cada tarea tiene su propia área de comentarios**, y la relación entre comentarios y tareas debe ser **muchos a uno**. ¿Cómo enlazamos comentarios y tareas?

**¡Exacto! Aquí entran en juego los [campos de relación](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations).**

NocoBase nos permite, mediante campos de relación, establecer relaciones a nivel de datos entre tablas, como tendiendo puentes que conectan estrechamente la información relacionada.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162355370.gif)

**¿Por qué muchos a uno?**

¿Por qué elegimos [**muchos a uno**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o) en lugar de [**uno a muchos**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/o2m) u otra relación? Recuerde: **cada tarea tiene varios comentarios**; por tanto, varios comentarios apuntan a una misma tarea. En la tabla de comentarios necesitamos un campo **muchos a uno** que apunte a la tabla de tareas.

> Quizá ya se le haya ocurrido:
> Si comentarios y tareas tienen relación muchos a uno, ¿podemos crear en la tabla de tareas un campo **uno a muchos** que apunte a la tabla de comentarios?
> **¡Correcto!** Uno a muchos y muchos a uno son relaciones inversas; podemos crear igualmente en la tabla de tareas un campo uno a muchos que enlace con la tabla de comentarios. ¡Excelente!

#### 4.2.1.4 Configurar el campo de relación muchos a uno

A continuación, en la tabla de comentarios crearemos un campo de relación muchos a uno para asociarla con la tabla de tareas. Lo llamaremos **Tarea a la que pertenece (belong_task)**. Hay varios ajustes clave:

1. **Tabla origen de la relación**: ¿desde dónde partimos? Aquí elegimos la **tabla de comentarios**.
2. **Tabla destino**: ¿con qué tabla establecemos la relación? Elegimos la **tabla de tareas**.

> **Clave foránea e identificador del campo destino: ejemplo:**
> Lo siguiente es la clave: **clave foránea** e **identificador del campo de la tabla destino**.
> ¿Suena complicado? Tranquilo, lo veremos con un ejemplo detallado.
>
> **Imagine** que tiene en la mano numerosos boletines de notas y nuestra tarea es asociar cada boletín al alumno correspondiente. ¿Cómo lo haríamos?
> Tomamos un boletín que contiene la siguiente información:
>
> - **Nombre**: Zhang San
> - **Clase**: 3.º de bachillerato, grupo 15
> - **Número de admisión**: 202300000001
> - **Número de identidad**: 111111111111
>   Suponga que quiere identificar a Zhang San por **nombre** y **clase**. Pero hay un problema: en una misma escuela puede haber muchos alumnos con el mismo nombre; ¡solo en el grupo 15 hay **20 Zhang San**! Con solo nombre y clase no podemos identificar al correcto.
>   **Necesitamos un identificador más único.** Por ejemplo, el **número de admisión** es ideal: cada alumno tiene uno único. Lanzamos la consulta para el número 202300000001 y al rato la escuela responde: "Este boletín pertenece a Zhang San, el de la fila 3 del grupo 15 que lleva gafas".
>   **De forma análoga**, en el escenario de la relación de **comentarios**: ¿podemos elegir un identificador único de la tabla de tareas (por ejemplo, **id**) y guardarlo en cada comentario para saber a qué tarea pertenece?
>   Esa es precisamente la idea esencial de la relación muchos a uno: la **clave foránea**. Sencillo, ¿verdad?

En la tabla de comentarios guardamos el id único de la tabla de tareas, lo llamamos **task_id** y así enlazamos comentarios y tareas.

#### 4.2.1.5 Estrategia de la clave foránea al eliminar

En NocoBase, una vez configurada la relación muchos a uno, hay que decidir qué hacer con los comentarios cuando se elimine una tarea. Hay varias opciones:

- **CASCADE**: si elimina la tarea, todos los comentarios asociados también se eliminarán.
- **SET NULL** (por defecto): la tarea se elimina pero los comentarios permanecen; el campo de clave foránea queda vacío.
- **RESTRICT y NO ACTION**: si la tarea tiene comentarios asociados, el sistema impedirá eliminarla, garantizando que los comentarios no se pierdan.

#### 4.2.1.7 Crear la relación inversa en la tabla de tareas

Por último, marcamos "**Crear campo de relación inversa en la tabla destino**" para poder ver desde la tarea todos los comentarios asociados, lo que facilita la gestión.

En NocoBase, la ubicación del campo de relación determina la forma de obtener los datos; por tanto, si queremos consultar también los comentarios desde la tabla de tareas, hay que crear en ella un campo de relación **uno a muchos** que apunte a la tabla de comentarios.

Cuando vuelva a abrir la tabla de tareas, el sistema generará automáticamente un campo asociado a comentarios indicando "**uno a muchos**". Así podrá consultar y gestionar los comentarios fácilmente.

## 4.3 Construcción de la página

### 4.3.1 Habilitar la tabla de comentarios

¡Llegó el momento emocionante! Volvamos al cuadro emergente de edición, creemos un bloque de comentarios y marquemos las funciones que necesitamos. ¡Listo!

![demov3N-16.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162357118.gif)

### 4.3.2 Ajustar la página

Mejoremos un poco el estilo: pase el ratón sobre la esquina superior derecha del botón de edición y elija un cuadro emergente más ancho. Aplicando lo aprendido, arrastre el bloque de comentarios a la derecha. ¡Perfecto!

![demov3N-17.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162358300.gif)

Algunos pueden estar pensando: yo también quiero comentarios. No se preocupe, también he preparado una segunda opción gratuita.

### 4.2.2 Método 2: tabla de comentarios personalizada

Si no ha adquirido el plugin de comentarios, también puede crear una tabla normal para implementar una funcionalidad similar.

1. **Crear la tabla de comentarios**:

   - Cree la **tabla de comentarios (comments2)**, añada el campo **Contenido del comentario (content)** (tipo Markdown) y el campo **Tarea a la que pertenece (belong_task)** (tipo muchos a uno).
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170001040.gif)
2. **Crear el bloque de lista de comentarios en la página**:

   - En el cuadro emergente de edición de la tarea añada un [**bloque de lista**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) (¡ya tenemos un tercer tipo de bloque, que también puede mostrar el detalle de los campos!), seleccione comentarios y pruébelo:
     ![Crear bloque de lista de comentarios](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170003544.gif)

## Resumen

¡Ya sabe enriquecer el contenido de las tareas con Markdown(Vditor) y añadir comentarios a las tareas! El sistema de gestión de tareas tiene ya una base funcional completa, ¿no nota que está más cerca de construir una herramienta profesional de gestión de tareas?

No deje de explorar y operar, NocoBase está lleno de posibilidades. Si tiene problemas, no se preocupe: estaré aquí para acompañarle paso a paso.

En el [siguiente capítulo (Capítulo 5: Pestañas y bloques dinámicos)](https://www.nocobase.com/cn/tutorials/task-tutorial-tabs-blocks) profundizaremos en más bloques de NocoBase para llevar el sistema a un nuevo nivel. ¡Adelante!

---

Siga explorando y dé rienda suelta a su creatividad. Si tiene dudas, recuerde que siempre puede consultar la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o unirse al [foro de la comunidad NocoBase](https://forum.nocobase.com/).
