# Capítulo 3: Gestión de datos de tareas

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113504258425496&bvid=BV1XvUxYREWx&cid=26827688969&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Ya hemos analizado los requisitos del sistema de gestión de tareas; ¡es momento de pasar a la práctica! Recuerde que nuestro sistema necesita poder **[crear](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new), [editar](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) y [eliminar](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete)** tareas, así como **consultar la lista de tareas**. Todas estas funciones se pueden implementar con páginas, bloques y acciones de NocoBase.

> Visite la documentación oficial para ver la definición detallada de [menú](https://docs-cn.nocobase.com/handbook/ui/menus) y [página](https://docs-cn.nocobase.com/handbook/ui/pages).

### 3.1 ¿Por dónde empezamos?

Como recordará, ya vimos cómo crear páginas y mostrar la lista de usuarios. Las páginas son como un lienzo que puede contener distintos tipos de bloques, los cuales se pueden ordenar y redimensionar libremente. Repasemos los pasos rápidamente:

1. [**Crear página**](https://docs-cn.nocobase.com/handbook/ui/pages): unos pocos clics y la página estará lista.
   ![Crear página](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333648.gif)
2. **Crear un [bloque de tabla](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)**: tras seleccionar el bloque de tabla, podrá mostrar diferentes datos.
   ![Crear bloque de tabla](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333239.gif)

Parece muy sencillo, ¿verdad?
Sin embargo, al abrir la "lista de datos" verá que en las opciones por defecto solo aparecen las tablas de "usuarios" y "roles".
¿Y la tabla de tareas? Tranquilo, la respuesta está en la funcionalidad [**fuente de datos**](https://docs-cn.nocobase.com/handbook/data-source-manager) de NocoBase.

> **Introducción a las fuentes de datos:** Una fuente de datos puede ser una base de datos, una API u otro almacenamiento. Soporta la conexión a diversas bases de datos relacionales como MySQL, PostgreSQL, SQLite o MariaDB.
> NocoBase incluye un **plugin de gestión de fuentes de datos** para administrarlas, pero ese plugin solo aporta la interfaz de gestión: la capacidad de conectar a una fuente concreta la proporcionan los **plugins de fuente de datos** correspondientes.

### 3.2 Fuente de datos: el almacén de sus tablas

![](https://static-docs.nocobase.com/20241009144356.png)

En NocoBase, todas las tablas se almacenan en una [**fuente de datos**](https://docs-cn.nocobase.com/handbook/data-source-manager). Es como un libro lleno de descripciones detalladas del diseño y la estructura de cada tabla. Vamos a escribir nuestra propia página: la **tabla de tareas**.

> [!NOTE] Note
> Si desea conocer en profundidad las capacidades de fuentes y tablas, consulte [Gestión de fuentes de datos](https://docs-cn.nocobase.com/handbook/data-source-manager) y [Visión general de las tablas](https://docs-cn.nocobase.com/handbook/data-modeling/collection).

- **Acceder a la configuración de la fuente de datos**:
  - Haga clic en **Configuración** > **Fuente de datos** > **Configuración de la fuente principal** en la esquina superior derecha.
  - Verá todas las tablas existentes en la fuente principal de NocoBase. Por defecto solo encontrará las tablas "Usuarios" y "Roles".
    ![Configuración de la fuente de datos](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334835.gif)

Es momento de crear la tercera tabla, nuestra **tabla de tareas**. Es la primera tabla que crearemos en NocoBase: ¡un momento emocionante! Solo tenemos que crear una tabla sencilla con los siguientes campos, según el diseño previo:

```
Tabla de tareas (Tasks):
        Nombre de la tarea (task_name) Texto de una línea
        Descripción de la tarea (task_description) Texto multilínea
```

### 3.3 Crear la tabla de tareas

1. **Crear la nueva tabla**:

   - Haga clic en "Crear tabla" > seleccione **Tabla normal** > rellene el **nombre de la tabla** (por ejemplo, "Tabla de tareas") y el **identificador de la tabla** (por ejemplo, "tasks").
   - El **identificador de la tabla** es el ID único; se recomienda usar letras, números o guiones bajos para facilitar futuras búsquedas y mantenimiento.
   - Confirme la creación.
     ![Crear tabla de tareas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334006.gif)
2. **Campos por defecto**:
   NocoBase genera campos predeterminados para cada tabla normal:

   - **ID**: identificador único de cada registro.
   - **Fecha de creación**: registra automáticamente cuándo se creó la tarea.
   - **Creador**: registra automáticamente quién creó la tarea.
   - **Fecha de última modificación** y **Modificado por**: registran cuándo y quién modificó la tarea.

Estos campos predeterminados son justamente lo que necesitamos y nos ahorran añadirlos manualmente.

3. **Crear campos personalizados**:
   - **Nombre de la tarea**: haga clic en "Añadir campo" > seleccione **Texto de una línea** > defina el nombre del campo como "Nombre de la tarea" y el identificador como "task_name".
     ![Crear campo de nombre de tarea](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335943.gif)
   - **Descripción de la tarea**: cree otro campo de **Texto multilínea** con identificador "task_description".
     ![Crear campo de descripción de tarea](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335521.gif)

¡Enhorabuena! La **tabla de tareas** está definida y ha creado con éxito su propia estructura de datos para tareas. ¡Bien hecho!

### 3.4 Crear la página de gestión de tareas

Ahora que tenemos la tabla, vamos a representarla en la página con un bloque adecuado. Crearemos una nueva página de **gestión de tareas** y añadiremos un bloque de tabla que muestre los datos.

1. **Crear la página de gestión de tareas**:

   - Haga clic en "Nueva página" y nómbrela "Gestión de tareas".
   - Cree un bloque para mostrar los datos de la tabla de tareas.
     ![Crear bloque de tareas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162336833.gif)
2. **Añadir datos**:

   - "¡Anda, no hay datos!" Tranquilo, vamos a añadirlos ahora mismo.
   - Haga clic en "Configurar acción" en la esquina superior derecha de la página y, a continuación, en la acción **"Añadir"**: aparecerá un cuadro emergente vacío.
     Las acciones [añadir](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new) y [editar](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) llevan asociado un cuadro emergente por defecto.
   - Aparece un nuevo bloque (formulario): cree un bloque emergente > seleccione **Tabla actual**.
   - Muestre los campos de nombre y descripción de la tarea, configure la acción de envío y, ¡listo!
     ![Configurar acciones](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162337313.gif)
3. **Introducir datos**:

   - Introduzca un dato de prueba, haga clic en enviar y... ¡éxito! Ya se ha añadido la primera tarea.
     ![Enviar datos](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338074.gif)

¡Momento emocionante! Ha registrado con éxito el primer dato de tarea, ¿a que es muy fácil?

### 3.5 Consulta y filtrado de tareas: encontrar tareas rápidamente

Cuando las tareas se multipliquen, ¿cómo encontrar rápidamente la que busca? Aquí entra en juego la [**acción de filtrado**](https://docs-cn.nocobase.com/handbook/ui/actions/types/filter). Con NocoBase puede localizar fácilmente tareas concretas combinando condiciones.

#### 3.5.1 Activar la acción de filtrado

Primero hay que activar la acción de filtrado:

- **Pase el ratón por "Configurar acción"** y luego haga clic en el **interruptor de filtrado** para activarlo.
  ![Activar filtrado](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338152.png)

#### 3.5.2 Usar condiciones de filtrado

Una vez activada la acción de filtrado, verá el botón de filtro en la página. Probemos con el campo **Nombre de la tarea**:

- En el panel de filtrado seleccione "Nombre de la tarea" e introduzca el contenido a buscar.
- Haga clic en "Enviar" y compruebe si la lista de tareas muestra el resultado filtrado correctamente.
  ![Activar filtrado](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338495.gif)

#### 3.5.3 Desactivar la acción de filtrado

Si ya no necesita la acción de filtrado, normalmente las acciones de tipo interruptor se desactivan con un solo clic:

- **Restablecer las condiciones**: asegúrese de que no hay ningún filtro activo y pulse el botón "Restablecer".
- Vuelva a hacer clic en el **interruptor "Filtrar"** y la acción se ocultará de la página.
  ![Desactivar filtrado](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339299.gif)

¡Así de simple! La acción de filtrado le ayudará enormemente a gestionar grandes volúmenes de tareas. A medida que vayamos avanzando descubriremos otros métodos flexibles de consulta. (Puede consultar el [bloque de filtro de formulario](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) y el [bloque de filtro tipo collapse](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/collapse)).

¡Mantenga la energía y sigamos!

### 3.6 Edición y eliminación de tareas

Además de añadir y consultar tareas, también necesitamos poder [**editar**](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) y [**eliminar**](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete) tareas. Como ya conoce el flujo de añadir bloques, campos y acciones, esto será sencillo:

1. **Editar tareas**:

   - En la configuración del listado de tareas, añada la acción **Editar**, haga clic en editar > añada un bloque de formulario (de edición) > seleccione los campos que se pueden editar.
2. **Eliminar tareas**:

   - De forma similar, en la configuración de la columna de acciones, active el interruptor **Eliminar**. Al aparecer el botón eliminar, haga clic en eliminar > confirme; la tarea se quitará de la lista.
     ![Editar tareas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339672.gif)

Hasta aquí, las operaciones de **CRUD** sobre la lista de tareas están completamente implementadas.

¡Estupendo! Ha completado este paso con éxito.

### Reto

A medida que se va familiarizando con NocoBase, pruebe este pequeño reto: necesitamos marcar el estado de las tareas y permitir la subida de adjuntos. ¿Cómo lo haría?

Pistas:

- En la tabla de tareas, añada:
  1. El campo **Estado (status)** como desplegable de selección única, con las siguientes opciones: **No iniciada, En progreso, Pendiente de revisión, Completada, Cancelada, Archivada**.
  2. El campo **Adjunto (attachment)**.
- Muestre los campos "Estado" y "Adjunto" en el bloque de tabla de tareas y en los formularios de "Añadir" y "Editar".

¿Tiene una idea? No se impaciente: en el [siguiente capítulo (Capítulo 4: Plugins de tareas y comentarios)](https://www.nocobase.com/cn/tutorials/task-tutorial-plugin-use) revelaremos la respuesta. ¡A esperar con ganas!

---

Siga explorando y dé rienda suelta a su creatividad. Si tiene dudas, recuerde que siempre puede consultar la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o unirse al [foro de la comunidad NocoBase](https://forum.nocobase.com/).
